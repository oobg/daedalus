"use client";

import { Suspense, useMemo, useCallback, useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Html, Line, OrbitControls, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { GTAOPass } from "three/examples/jsm/postprocessing/GTAOPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import type { EditorFloor, EditorPoint, RoomOpening, RoomOpeningType } from "@/domain/editor-state";
import { useEditorStore } from "@/store/editorStore";
import {
  configureContactShadowSoftness,
  createContactShadowFootprint,
  createExteriorWallMeshAssembly,
  createTopDownWallBandPath,
  createTopDownWallBandShape,
  createWallMeshAssembly,
  getContactShadowSoftnessPreset,
  getGlassMaterialConfig,
  resolveContactShadowActivationSettings,
  resolveContactShadowPlacement,
  resolveContactShadowRenderState,
  getViewerLightingConfiguration,
  getViewerPresentationPreset,
  getWallShadingConfig,
} from "@/features/viewer";
import { resolveAmbientOcclusionSettings } from "@/features/viewer/ambient-occlusion";
import {
  createRoomSurfaceLayout,
  DEFAULT_WALL_HEIGHT_SCALE,
  DEFAULT_WALL_THICKNESS,
  resolveFloorPerimeterInset,
  resolveRoomLayerElevations,
  resolveViewer25DFloorExtrusionDepth,
  resolveViewer25DFloorLayerThickness,
  resolveViewer25DFloorRenderPlacements,
  resolveViewer25DStackExtrusionDepth,
  type Viewer25DFloorRenderPlacement,
} from "./viewer25dGeometry";
import {
  applyViewerCameraModeConfig,
  resolveViewerCameraModeConfig,
  resolveViewerViewportState,
  type ViewerCameraMode,
} from "@/features/viewer/viewer-camera-mode";
import { resolveTopDownSceneBounds } from "@/features/viewer/top-down-camera-configuration";
import {
  createViewer25DSceneGraph,
  resolveViewer25DRenderPlan,
} from "./viewer25dSceneGraph";
import { createViewer25DTopDownHandleOverlayScene } from "./viewer25dTopDownHandleOverlayScene";
import { resolveViewer25DSharedSceneInstance } from "./viewer25dSharedScene";

// ── Visual palette ────────────────────────────────────────────────────────────
const FLOOR_COLORS           = ["#DDD8CF", "#D1CCC3", "#C5C0B7", "#B9B4AC", "#AEA9A2"];
const WALL_HEIGHT_SCALE      = DEFAULT_WALL_HEIGHT_SCALE;
const WALL_THICKNESS         = DEFAULT_WALL_THICKNESS;  // world units (~4.5cm at 1:100)
const EXTERIOR_WALL_THICKNESS = 0.072;                  // matches getExteriorWallMeshOptions default
const WALL_TOP_EDGE_RADIUS   = 0.011;
const INTERIOR_WALL_SHADING = getWallShadingConfig("interior");
const EXTERIOR_WALL_SHADING = getWallShadingConfig("exterior");
const WINDOW_GLASS_MATERIAL = getGlassMaterialConfig("windowPane");
const VIEWER_LIGHTING = getViewerLightingConfiguration();
const VIEWER_PRESENTATION = getViewerPresentationPreset();
const DEFAULT_ROOM_LAYER_ELEVATIONS = resolveRoomLayerElevations({
  wallThickness: WALL_THICKNESS,
});

// Isometric lock: camera [8,8,8] → polar = acos(1/√3)
const FIXED_POLAR = Math.acos(1 / Math.sqrt(3));

const CAMERA_TRANSITION_DURATION = 0.5; // seconds

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

interface CameraTransitionState {
  startPos: THREE.Vector3;
  endPos: THREE.Vector3;
  startQuat: THREE.Quaternion;
  endQuat: THREE.Quaternion;
  startUp: THREE.Vector3;
  endUp: THREE.Vector3;
  startZoom: number;
  endZoom: number;
  elapsed: number;
  readonly duration: number;
}

// ── Coordinate helpers ────────────────────────────────────────────────────────
// world X = canvasX / 100
// world Z = canvasY / 100  (shape uses -canvasY/100 in shape-space; rotation negates)

function isPointInPolygon(
  point: { x: number; y: number },
  polygon: readonly { x: number; y: number }[],
): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    if (((yi > point.y) !== (yj > point.y)) &&
        (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
}

function polygonToShape(points: EditorPoint[]): THREE.Shape {
  const shape = new THREE.Shape();
  if (points.length < 3) return shape;
  shape.moveTo(points[0].x / 100, -points[0].y / 100);
  for (let i = 1; i < points.length; i++) {
    shape.lineTo(points[i].x / 100, -points[i].y / 100);
  }
  shape.closePath();
  return shape;
}

function computeSceneCenter(floors: EditorFloor[]): { x: number; z: number } {
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const floor of floors)
    for (const room of floor.rooms)
      for (const pt of room.roomPolygon) {
        const wx = pt.x / 100, wz = pt.y / 100;
        if (wx < minX) minX = wx; if (wx > maxX) maxX = wx;
        if (wz < minZ) minZ = wz; if (wz > maxZ) maxZ = wz;
      }
  if (!isFinite(minX)) return { x: 0, z: 0 };
  return { x: (minX + maxX) / 2, z: (minZ + maxZ) / 2 };
}

function createShadowFootprints(
  floors: readonly EditorFloor[],
  exteriorPolygon: readonly EditorPoint[] | null | undefined,
  floorPlacements: readonly Viewer25DFloorRenderPlacement[],
  floorBaseOffset: number,
  wallBaseOffset: number,
) {
  const footprints = [];

  for (let index = 0; index < floors.length; index += 1) {
    const floor = floors[index];
    const floorRenderY = floorPlacements[index]?.renderVerticalOffset ?? 0;

    for (const room of floor.rooms) {
      const points = room.roomPolygon.map((point) => ({
        x: point.x / 100,
        z: point.y / 100,
      }));
      const floorFootprint = createContactShadowFootprint(
        "floor",
        points,
        floorRenderY + floorBaseOffset,
      );
      const wallFootprint = createContactShadowFootprint(
        "wall",
        points,
        floorRenderY + wallBaseOffset,
      );

      if (floorFootprint != null) {
        footprints.push(floorFootprint);
      }

      if (wallFootprint != null) {
        footprints.push(wallFootprint);
      }
    }
  }

  const exteriorFootprint = createContactShadowFootprint(
    "wall",
    (exteriorPolygon ?? []).map((point) => ({
      x: point.x / 100,
      z: point.y / 100,
    })),
    wallBaseOffset,
  );

  if (exteriorFootprint != null) {
    footprints.push(exteriorFootprint);
  }

  return footprints;
}

function LocalizedContactShadow({
  footprints,
  sceneCenter,
}: {
  footprints: ReturnType<typeof createShadowFootprints>;
  sceneCenter: { x: number; z: number };
}) {
  const { gl, size } = useThree();
  const shadowSettings = useMemo(
    () =>
      resolveContactShadowActivationSettings({
        viewportWidth: size.width,
        devicePixelRatio: gl.getPixelRatio(),
        hardwareConcurrency:
          typeof navigator === "undefined" ? null : navigator.hardwareConcurrency,
        maxTouchPoints:
          typeof navigator === "undefined" ? null : navigator.maxTouchPoints,
      }),
    [gl, size.width],
  );
  const placement = useMemo(
    () => resolveContactShadowPlacement(shadowSettings, footprints),
    [footprints, shadowSettings],
  );
  const renderState = useMemo(
    () =>
      resolveContactShadowRenderState(
        placement,
        configureContactShadowSoftness(
          getContactShadowSoftnessPreset("miniatureArchitecture"),
        ),
      ),
    [placement],
  );

  if (renderState == null) {
    return null;
  }

  return (
    <ContactShadows
      position={[
        renderState.position[0] - sceneCenter.x,
        renderState.position[1],
        renderState.position[2] - sceneCenter.z,
      ]}
      scale={[renderState.scale[0], renderState.scale[1]]}
      blur={renderState.blur}
      far={renderState.far}
      opacity={renderState.opacity}
      color={renderState.color}
      resolution={renderState.resolution}
      frames={renderState.frames}
    />
  );
}

// ── 3D Opening Symbols ────────────────────────────────────────────────────────
// All symbols sit at y=0.02 inside the RoomMesh group above the recessed floor slab.
// ExtrudeGeometry depth goes in the shape's +Z which, after rotation [-PI/2,0,0],
// maps to world +Y — so symbols extrude upward.

// Door — solid extruded panel + shallow translucent arc sweep
function DoorSymbol3D({ x, z, wallH, isActive }: { x: number; z: number; wallH: number; isActive: boolean }) {
  const r = 0.17, ri = 0.150, t = 0.022;
  const panelDepth = wallH * 0.85;
  const arcDepth   = wallH * 0.85 * 0.34; // preserves original 0.022/0.065 ratio
  const inactiveOpacity = 0.35;
  const panelOpacity = isActive ? 1 : inactiveOpacity;
  const arcOpacity   = isActive ? 0.38 : Math.min(0.38, inactiveOpacity);

  const { panelGeo, arcGeo } = useMemo(() => {
    const panel = new THREE.Shape();
    panel.moveTo(0, -t / 2); panel.lineTo(r, -t / 2);
    panel.lineTo(r,  t / 2); panel.lineTo(0,  t / 2);
    panel.closePath();

    const arc = new THREE.Shape();
    arc.moveTo(ri, 0); arc.lineTo(r, 0);
    arc.absarc(0, 0, r,  0,           Math.PI / 2, false);
    arc.lineTo(0, ri);
    arc.absarc(0, 0, ri, Math.PI / 2, 0,           true);
    arc.closePath();

    return {
      panelGeo: new THREE.ExtrudeGeometry(panel, { depth: panelDepth, bevelEnabled: false }),
      arcGeo:   new THREE.ExtrudeGeometry(arc,   { depth: arcDepth,   bevelEnabled: false }),
    };
  }, [panelDepth, arcDepth]);

  return (
    <group position={[x, 0.02, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh geometry={panelGeo}>
        <meshLambertMaterial color="#5E8A7C" transparent={!isActive} opacity={panelOpacity} />
      </mesh>
      <mesh geometry={arcGeo}>
        <meshLambertMaterial color="#5E8A7C" transparent opacity={arcOpacity} />
      </mesh>
    </group>
  );
}

// Window — extruded outer frame + center divider slab
function WindowSymbol3D({ x, z, wallH, isActive }: { x: number; z: number; wallH: number; isActive: boolean }) {
  const w = 0.24, h = 0.07, ft = 0.013, lt = 0.010;
  const frameDepth = wallH * 0.85;
  const paneDepth  = wallH * 0.85 * 0.24; // preserves original 0.012/0.050 ratio
  const inactiveOpacity = 0.35;
  const frameOpacity = isActive ? 1 : inactiveOpacity;
  const divOpacity   = isActive ? 0.72 : Math.min(0.72, inactiveOpacity);
  const glassBaseOpacity = WINDOW_GLASS_MATERIAL.opacity ?? 1;
  const glassOpacity = isActive ? glassBaseOpacity : Math.min(glassBaseOpacity, inactiveOpacity);

  const { frameGeo, divGeo, paneGeo } = useMemo(() => {
    const frame = new THREE.Shape();
    frame.moveTo(-w / 2, -h / 2); frame.lineTo(w / 2, -h / 2);
    frame.lineTo( w / 2,  h / 2); frame.lineTo(-w / 2, h / 2);
    frame.closePath();
    const hole = new THREE.Path();
    hole.moveTo(-w / 2 + ft, -h / 2 + ft); hole.lineTo(w / 2 - ft, -h / 2 + ft);
    hole.lineTo( w / 2 - ft,  h / 2 - ft); hole.lineTo(-w / 2 + ft, h / 2 - ft);
    hole.closePath();
    frame.holes.push(hole);

    const div = new THREE.Shape();
    div.moveTo(-w / 2 + ft, -lt / 2); div.lineTo(w / 2 - ft, -lt / 2);
    div.lineTo( w / 2 - ft,  lt / 2); div.lineTo(-w / 2 + ft, lt / 2);
    div.closePath();

    const pane = new THREE.Shape();
    pane.moveTo(-w / 2 + ft, -h / 2 + ft);
    pane.lineTo(w / 2 - ft, -h / 2 + ft);
    pane.lineTo( w / 2 - ft,  h / 2 - ft);
    pane.lineTo(-w / 2 + ft,  h / 2 - ft);
    pane.closePath();

    return {
      frameGeo: new THREE.ExtrudeGeometry(frame, { depth: frameDepth, bevelEnabled: false }),
      divGeo:   new THREE.ExtrudeGeometry(div,   { depth: frameDepth, bevelEnabled: false }),
      paneGeo:  new THREE.ExtrudeGeometry(pane,  { depth: paneDepth,  bevelEnabled: false }),
    };
  }, [frameDepth, paneDepth]);

  return (
    <group position={[x, 0.02, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh geometry={frameGeo}>
        <meshLambertMaterial color="#7A9EB5" transparent={!isActive} opacity={frameOpacity} />
      </mesh>
      <mesh geometry={paneGeo}>
        <meshPhysicalMaterial {...WINDOW_GLASS_MATERIAL} transparent opacity={glassOpacity} />
      </mesh>
      <mesh geometry={divGeo}>
        <meshLambertMaterial color="#90A8B1" transparent opacity={divOpacity} />
      </mesh>
    </group>
  );
}

// Stair — three actual 3D steps at increasing Y heights and Z offsets
function StairSymbol3D({ x, z, wallH, isActive }: { x: number; z: number; wallH: number; isActive: boolean }) {
  const tall  = wallH;
  const mid   = wallH * (0.090 / 0.150);
  const low   = wallH * (0.040 / 0.150);
  const zStep = wallH * (0.065 / 0.150);
  const inactiveOpacity = 0.35;
  const meshOpacity = isActive ? 1 : inactiveOpacity;

  const STEPS = [
    { h: low,  yCenter: low / 2,   zOff: -zStep },
    { h: mid,  yCenter: mid / 2,   zOff:  0     },
    { h: tall, yCenter: tall / 2,  zOff:  zStep },
  ];

  return (
    <group position={[x, 0, z]}>
      {STEPS.map((s, i) => (
        <mesh key={i} position={[0, s.yCenter, s.zOff]}>
          <boxGeometry args={[0.17, s.h, zStep]} />
          <meshLambertMaterial color="#9A9578" transparent={!isActive} opacity={meshOpacity} />
        </mesh>
      ))}
    </group>
  );
}

// Elevator — extruded square frame + up/down arrow triangles
function ElevatorSymbol3D({ x, z, wallH, isActive }: { x: number; z: number; wallH: number; isActive: boolean }) {
  const s = 0.19, ft = 0.013, at = 0.040;
  const elevDepth = wallH;
  const inactiveOpacity = 0.35;
  const meshOpacity = isActive ? 1 : inactiveOpacity;

  const { frameGeo, upGeo, downGeo } = useMemo(() => {
    const frame = new THREE.Shape();
    frame.moveTo(-s / 2, -s / 2); frame.lineTo(s / 2, -s / 2);
    frame.lineTo( s / 2,  s / 2); frame.lineTo(-s / 2, s / 2);
    frame.closePath();
    const hole = new THREE.Path();
    hole.moveTo(-s / 2 + ft, -s / 2 + ft); hole.lineTo(s / 2 - ft, -s / 2 + ft);
    hole.lineTo( s / 2 - ft,  s / 2 - ft); hole.lineTo(-s / 2 + ft, s / 2 - ft);
    hole.closePath();
    frame.holes.push(hole);

    const upArrow = new THREE.Shape();
    upArrow.moveTo(-at, 0.018); upArrow.lineTo(0, 0.018 + at * 1.1); upArrow.lineTo(at, 0.018);
    upArrow.closePath();

    const downArrow = new THREE.Shape();
    downArrow.moveTo(-at, -0.018); downArrow.lineTo(0, -0.018 - at * 1.1); downArrow.lineTo(at, -0.018);
    downArrow.closePath();

    return {
      frameGeo: new THREE.ExtrudeGeometry(frame,     { depth: elevDepth, bevelEnabled: false }),
      upGeo:    new THREE.ExtrudeGeometry(upArrow,   { depth: elevDepth, bevelEnabled: false }),
      downGeo:  new THREE.ExtrudeGeometry(downArrow, { depth: elevDepth, bevelEnabled: false }),
    };
  }, [elevDepth]);

  return (
    <group position={[x, 0.02, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh geometry={frameGeo}><meshLambertMaterial color="#8A8A8A" transparent={!isActive} opacity={meshOpacity} /></mesh>
      <mesh geometry={upGeo}>  <meshLambertMaterial color="#8A8A8A" transparent={!isActive} opacity={meshOpacity} /></mesh>
      <mesh geometry={downGeo}><meshLambertMaterial color="#8A8A8A" transparent={!isActive} opacity={meshOpacity} /></mesh>
    </group>
  );
}

function OpeningMarker({
  opening,
  wallH,
  isActive,
}: {
  opening: RoomOpening;
  wallH: number;
  isActive: boolean;
}) {
  const x = opening.x / 100;
  const z = opening.y / 100;
  if (opening.type === "door")    return <DoorSymbol3D     x={x} z={z} wallH={wallH} isActive={isActive} />;
  if (opening.type === "window")  return <WindowSymbol3D   x={x} z={z} wallH={wallH} isActive={isActive} />;
  if (opening.type === "stair")   return <StairSymbol3D    x={x} z={z} wallH={wallH} isActive={isActive} />;
  return                                 <ElevatorSymbol3D x={x} z={z} wallH={wallH} isActive={isActive} />;
}

// ── RoomMesh — walls as per-edge boxes, no ceiling ───────────────────────────
interface RoomMeshProps {
  points:   readonly EditorPoint[];
  openings: readonly RoomOpening[];
  floorRenderY: number;
  height:   number;
  floorBaseOffset: number;
  wallBaseOffset: number;
  floorPerimeterInset: number;
  color:    string;
  label:    string;
  isActive: boolean;
  cameraMode: ViewerCameraMode;
}

function RoomMesh({
  points,
  openings,
  floorRenderY,
  height,
  floorBaseOffset,
  wallBaseOffset,
  floorPerimeterInset,
  color,
  label,
  isActive,
  cameraMode,
}: RoomMeshProps) {
  const surfaceLayout = useMemo(
    () =>
      createRoomSurfaceLayout(points, {
        wallThickness: WALL_THICKNESS,
        minimumFloorPerimeterInset: floorPerimeterInset,
        floorPerimeterInsetRatio: 0,
      }),
    [points, floorPerimeterInset],
  );
  const shape = useMemo(
    () => polygonToShape(surfaceLayout.floorSurfaceFootprint),
    [surfaceLayout],
  );
  const wallH = resolveViewer25DFloorExtrusionDepth(height, WALL_HEIGHT_SCALE);
  const floorLayerThickness = resolveViewer25DFloorLayerThickness(height);

  const wallMeshAssembly = useMemo(
    () =>
      createWallMeshAssembly(
        points.map((point) => ({
          x: point.x / 100,
          y: point.y / 100,
        })),
        {
          baseOffset: wallBaseOffset,
          curveSegments: 6,
          height: wallH,
          thickness: WALL_THICKNESS,
          topEdgeRadius: WALL_TOP_EDGE_RADIUS,
        },
      ),
    [points, wallBaseOffset, wallH],
  );
  const topDownWallBandShape = useMemo(() => {
    const wallBand = createTopDownWallBandPath(
      points.map((point) => ({
        x: point.x / 100,
        y: point.y / 100,
      })),
      WALL_THICKNESS,
    );

    if (wallBand == null) {
      return null;
    }

    return createTopDownWallBandShape(wallBand);
  }, [points]);

  const labelX = points.reduce((s, p) => s + p.x, 0) / points.length / 100;
  const labelZ = points.reduce((s, p) => s + p.y, 0) / points.length / 100;

  // AC-3: inactive floor opacity values
  const inactiveOpacity = 0.35;
  const meshOpacity = isActive ? 1 : inactiveOpacity;
  const meshTransparent = !isActive;

  return (
    <group position={[0, floorRenderY, 0]}>
      {/* Wall band ring — top-down uses flat shapeGeometry; perspective extrudes upward. */}
      {cameraMode === "top-down-orthographic"
        ? topDownWallBandShape != null && (
            <mesh
              rotation={[-Math.PI / 2, 0, 0]}
              position={[0, wallBaseOffset + wallH + 0.0005, 0]}
            >
              <shapeGeometry args={[topDownWallBandShape]} />
              <meshStandardMaterial
                {...INTERIOR_WALL_SHADING}
                side={THREE.DoubleSide}
                transparent={meshTransparent}
                opacity={meshOpacity}
              />
            </mesh>
          )
        : topDownWallBandShape != null
          ? (
              <mesh
                rotation={[-Math.PI / 2, 0, 0]}
                position={[0, wallBaseOffset, 0]}
              >
                <extrudeGeometry
                  args={[topDownWallBandShape, { depth: wallH, bevelEnabled: false }]}
                />
                <meshStandardMaterial
                  {...INTERIOR_WALL_SHADING}
                  side={THREE.DoubleSide}
                  transparent={meshTransparent}
                  opacity={meshOpacity}
                />
              </mesh>
            )
          : wallMeshAssembly.meshes.map((wallMesh, index) => (
              <mesh
                key={`${wallMesh.source}-${index}`}
                geometry={wallMesh.geometry}
                position={wallMesh.position}
                rotation={wallMesh.rotation}
              >
                <meshStandardMaterial
                  {...INTERIOR_WALL_SHADING}
                  transparent={meshTransparent}
                  opacity={meshOpacity}
                />
              </mesh>
            ))}

      {/* Floor plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, floorBaseOffset, 0]}>
        <extrudeGeometry
          args={[
            shape,
            {
              bevelEnabled: false,
              depth: floorLayerThickness,
              steps: 1,
            },
          ]}
        />
        <meshLambertMaterial
          color={color}
          side={THREE.DoubleSide}
          transparent={meshTransparent}
          opacity={meshOpacity}
        />
      </mesh>

      {/* Room label — 2.5D 에서만 표시 */}
      {cameraMode !== "top-down-orthographic" && (
        <Html
          position={[labelX, wallH + 0.1, labelZ]}
          center
          style={{
            pointerEvents: "none",
            userSelect: "none",
            fontSize: "11px",
            color: "#333",
            background: "rgba(255,255,255,0.82)",
            padding: "1px 5px",
            borderRadius: "3px",
            whiteSpace: "nowrap",
            border: "1px solid rgba(0,0,0,0.08)",
            fontFamily: "Pretendard, -apple-system, sans-serif",
          }}
        >
          {label}
        </Html>
      )}

      {/* Opening markers */}
      {openings.map(op => (
        <OpeningMarker key={op.id} opening={op} wallH={wallH} isActive={isActive} />
      ))}
    </group>
  );
}

// ── Drawing Layer — top-down polygon + opening placement ─────────────────────
function DrawingLayer({ sceneCenter }: { sceneCenter: { x: number; z: number } }) {
  const activeTool         = useEditorStore(s => s.activeTool);
  const isDrawing          = useEditorStore(s => s.isDrawing);
  const draftPoints        = useEditorStore(s => s.draftPoints);
  const addDraftPoint      = useEditorStore(s => s.addDraftPoint);
  const commitDraft        = useEditorStore(s => s.commitDraft);
  const cancelDraft        = useEditorStore(s => s.cancelDraft);
  const activeFloorId      = useEditorStore(s => s.project.viewState.activeFloorId);
  const selectedRoomId     = useEditorStore(s => s.project.viewState.selectedRoomId);
  const addOpening         = useEditorStore(s => s.addOpening);
  const addExteriorOpening = useEditorStore(s => s.addExteriorOpening);

  const isPolygonTool = activeTool === "room" || activeTool === "exterior";
  const isOpeningTool = activeTool === "door" || activeTool === "window" || activeTool === "stair" || activeTool === "elevator";
  const isCapturing   = isPolygonTool || isOpeningTool;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") cancelDraft();
      if (e.key === "Enter" && isDrawing && draftPoints.length >= 3) commitDraft();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cancelDraft, commitDraft, isDrawing, draftPoints.length]);

  const handleClick = useCallback(
    (e: { point: THREE.Vector3; stopPropagation: () => void }) => {
      if (!isCapturing) return;
      e.stopPropagation();
      const cx = (e.point.x + sceneCenter.x) * 100;
      const cy = (e.point.z + sceneCenter.z) * 100;
      if (isPolygonTool) {
        addDraftPoint({ x: cx, y: cy });
      } else if (isOpeningTool) {
        const type = activeTool as RoomOpeningType;
        if (activeFloorId && selectedRoomId) {
          addOpening(activeFloorId, selectedRoomId, type, cx, cy);
        } else if (activeFloorId) {
          addExteriorOpening(type, cx, cy);
        }
      }
    },
    [isCapturing, isPolygonTool, isOpeningTool, activeTool, addDraftPoint, addOpening, addExteriorOpening, activeFloorId, selectedRoomId, sceneCenter],
  );

  const handleDoubleClick = useCallback(
    (e: { stopPropagation: () => void }) => {
      if (!isPolygonTool || draftPoints.length < 3) return;
      e.stopPropagation();
      commitDraft();
    },
    [isPolygonTool, draftPoints.length, commitDraft],
  );

  const draftLinePoints = useMemo<[number, number, number][]>(() => {
    if (draftPoints.length < 2) return [];
    const pts = draftPoints.map((p): [number, number, number] => [p.x / 100, 0.01, p.y / 100]);
    if (draftPoints.length >= 3) pts.push(pts[0]);
    return pts;
  }, [draftPoints]);

  if (!isCapturing) return null;

  return (
    <>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.001, 0]}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      >
        <planeGeometry args={[2000, 2000]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      {isDrawing && draftLinePoints.length >= 2 && (
        <Line points={draftLinePoints} color="#2563EB" lineWidth={2} />
      )}
      {isDrawing && draftPoints.map((p, i) => (
        <Html key={i} position={[p.x / 100, 0.05, p.y / 100]} center>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#2563EB",
              border: "2px solid white",
              boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
              pointerEvents: "none",
            }}
          />
        </Html>
      ))}
    </>
  );
}

// ── Screenshot button ─────────────────────────────────────────────────────────
function ScreenshotButton() {
  const { gl, scene, camera } = useThree();

  const handleCapture = useCallback(() => {
    gl.render(scene, camera);
    const url = gl.domElement.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = "building-guide-3d.png";
    a.click();
  }, [gl, scene, camera]);

  return (
    <Html position={[0, 0, 0]} calculatePosition={() => [8, 8]}>
      <button
        onClick={handleCapture}
        style={{
          padding: "4px 10px",
          fontSize: "12px",
          background: "#F2F1ED",
          border: "1px solid #E0DDD7",
          borderRadius: "6px",
          cursor: "pointer",
          color: "#6B6B65",
          whiteSpace: "nowrap",
          fontFamily: "Pretendard, -apple-system, sans-serif",
        }}
      >
        2.5D PNG 저장
      </button>
    </Html>
  );
}

function AmbientOcclusionComposer() {
  const { gl, scene, camera, size } = useThree();
  const composerRef = useRef<EffectComposer | null>(null);

  const ambientOcclusion = useMemo(
    () =>
      resolveAmbientOcclusionSettings({
        viewportWidth: size.width,
        devicePixelRatio: gl.getPixelRatio(),
        hardwareConcurrency:
          typeof navigator === "undefined"
            ? undefined
            : navigator.hardwareConcurrency,
        maxTouchPoints:
          typeof navigator === "undefined"
            ? undefined
            : navigator.maxTouchPoints,
      }),
    [gl, size.width],
  );

  useEffect(() => {
    if (!ambientOcclusion.enabled) {
      composerRef.current?.dispose();
      composerRef.current = null;
      return;
    }

    const composer = new EffectComposer(gl);
    composer.setPixelRatio(gl.getPixelRatio());
    composer.setSize(size.width, size.height);

    const renderPass = new RenderPass(scene, camera);
    const ambientOcclusionPass = new GTAOPass(
      scene,
      camera,
      size.width,
      size.height,
    );
    ambientOcclusionPass.blendIntensity = ambientOcclusion.strength;
    ambientOcclusionPass.updateGtaoMaterial({
      radius: ambientOcclusion.radius,
      thickness: ambientOcclusion.thickness,
      distanceFallOff: ambientOcclusion.falloff,
      samples: ambientOcclusion.samples,
      screenSpaceRadius: true,
    });
    ambientOcclusionPass.updatePdMaterial({
      radius: ambientOcclusion.denoiseRadius,
      rings: ambientOcclusion.denoiseRings,
      samples: ambientOcclusion.denoiseSamples,
    });

    composer.addPass(renderPass);
    composer.addPass(ambientOcclusionPass);
    composer.addPass(new OutputPass());

    composerRef.current = composer;

    return () => {
      ambientOcclusionPass.dispose();
      composer.dispose();
      composerRef.current = null;
    };
  }, [ambientOcclusion, camera, gl, scene, size.height, size.width]);

  useFrame((_, delta) => {
    if (composerRef.current != null) {
      composerRef.current.render(delta);
      return;
    }

    gl.render(scene, camera);
  }, 1);

  return null;
}

function SceneCameraController({
  cameraModeConfig,
  onTransitionComplete,
}: {
  cameraModeConfig: ReturnType<typeof resolveViewerCameraModeConfig>;
  onTransitionComplete?: () => void;
}) {
  const { camera } = useThree();
  const isFirstMount = useRef(true);
  const prevConfigRef = useRef<typeof cameraModeConfig | null>(null);
  const transitionRef = useRef<CameraTransitionState | null>(null);
  const onCompleteRef = useRef(onTransitionComplete);
  onCompleteRef.current = onTransitionComplete;

  useEffect(() => {
    const prevConfig = prevConfigRef.current;
    prevConfigRef.current = cameraModeConfig;

    if (isFirstMount.current) {
      isFirstMount.current = false;
      applyViewerCameraModeConfig(camera, cameraModeConfig);
      return;
    }

    if (prevConfig == null) {
      applyViewerCameraModeConfig(camera, cameraModeConfig);
      return;
    }

    // Build start state from previous config
    const startPos = new THREE.Vector3(...prevConfig.position);
    const startUp = new THREE.Vector3(...prevConfig.up);
    const startMat = new THREE.Matrix4().lookAt(
      startPos,
      new THREE.Vector3(...prevConfig.lookAt),
      startUp,
    );
    const startQuat = new THREE.Quaternion().setFromRotationMatrix(startMat);

    // When camera type changes (ortho ↔ perspective), zoom scales are incompatible.
    // Ortho zoom 30-48 applied to a PerspectiveCamera causes a huge zoom-out animation,
    // so for ortho→perspective we always start zoom at 1.
    const isCrossType = prevConfig.orthographic !== cameraModeConfig.orthographic;
    const startZoom = isCrossType && !cameraModeConfig.orthographic ? 1 : (prevConfig.zoom ?? 1);
    const endZoom = cameraModeConfig.zoom ?? 1;

    // Reset camera to previous position before animating
    // (R3F may have already moved it to the new position on camera type switch)
    camera.position.copy(startPos);
    camera.up.copy(startUp);
    camera.quaternion.copy(startQuat);
    camera.near = prevConfig.near;
    camera.far = prevConfig.far;
    camera.zoom = startZoom;
    camera.updateProjectionMatrix();

    // Build end state
    const endPos = new THREE.Vector3(...cameraModeConfig.position);
    const endUp = new THREE.Vector3(...cameraModeConfig.up);
    const endMat = new THREE.Matrix4().lookAt(
      endPos,
      new THREE.Vector3(...cameraModeConfig.lookAt),
      endUp,
    );
    const endQuat = new THREE.Quaternion().setFromRotationMatrix(endMat);

    transitionRef.current = {
      startPos,
      endPos,
      startQuat,
      endQuat,
      startUp,
      endUp,
      startZoom,
      endZoom,
      elapsed: 0,
      duration: CAMERA_TRANSITION_DURATION,
    };
  }, [camera, cameraModeConfig]);

  useFrame((_, delta) => {
    const t = transitionRef.current;
    if (t == null) return;

    t.elapsed += delta;
    const raw = Math.min(t.elapsed / t.duration, 1);
    const p = easeInOutCubic(raw);

    camera.position.lerpVectors(t.startPos, t.endPos, p);
    camera.quaternion.slerpQuaternions(t.startQuat, t.endQuat, p);
    camera.up.lerpVectors(t.startUp, t.endUp, p);
    camera.zoom = t.startZoom + (t.endZoom - t.startZoom) * p;
    camera.updateProjectionMatrix();

    if (raw >= 1) {
      transitionRef.current = null;
      onCompleteRef.current?.();
    }
  });

  return null;
}

// ── Exterior wall — wraps all floors ─────────────────────────────────────────
interface ExteriorWallProps {
  points: readonly EditorPoint[];
  totalHeight: number;
  cameraMode: ViewerCameraMode;
}

function ExteriorWall({ points, totalHeight, cameraMode }: ExteriorWallProps) {
  const wallH = resolveViewer25DFloorExtrusionDepth(totalHeight, WALL_HEIGHT_SCALE);
  const exteriorWallBandShape = useMemo(() => {
    const wallBand = createTopDownWallBandPath(
      points.map((point) => ({
        x: point.x / 100,
        y: point.y / 100,
      })),
      EXTERIOR_WALL_THICKNESS,
    );
    if (wallBand == null) {
      return null;
    }
    return createTopDownWallBandShape(wallBand);
  }, [points]);
  const wallMeshAssembly = useMemo(
    () =>
      createExteriorWallMeshAssembly(
        points.map((point) => ({
          x: point.x / 100,
          y: point.y / 100,
        })),
        {
          height: wallH,
        },
      ),
    [points, wallH],
  );

  return (
    <group>
      {exteriorWallBandShape != null
        ? cameraMode === "top-down-orthographic"
          ? (
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, wallH + 0.0005, 0]}>
                <shapeGeometry args={[exteriorWallBandShape]} />
                <meshStandardMaterial {...EXTERIOR_WALL_SHADING} side={THREE.DoubleSide} />
              </mesh>
            )
          : (
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
                <extrudeGeometry
                  args={[exteriorWallBandShape, { depth: wallH, bevelEnabled: false }]}
                />
                <meshStandardMaterial {...EXTERIOR_WALL_SHADING} side={THREE.DoubleSide} />
              </mesh>
            )
        : wallMeshAssembly.meshes.map((wallMesh, index) => (
            <mesh
              key={`${wallMesh.source}-${index}`}
              geometry={wallMesh.geometry}
              position={wallMesh.position}
              rotation={wallMesh.rotation}
            >
              <meshStandardMaterial {...EXTERIOR_WALL_SHADING} />
            </mesh>
          ))
      }
    </group>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
interface Props {
  floors: EditorFloor[];
  activeFloorId: string | null;
  exteriorPolygon?: EditorPoint[] | null;
  exteriorEdgeOpenings?: RoomOpening[];
  cameraMode?: ViewerCameraMode;
  floorBaseOffset?: number;
  wallBaseOffset?: number;
  floorPerimeterInset?: number;
}

export default function Viewer25D({
  floors,
  activeFloorId,
  exteriorPolygon,
  exteriorEdgeOpenings,
  cameraMode = "perspective",
  floorBaseOffset = DEFAULT_ROOM_LAYER_ELEVATIONS.floorBaseOffset,
  wallBaseOffset = DEFAULT_ROOM_LAYER_ELEVATIONS.wallBaseOffset,
  floorPerimeterInset = resolveFloorPerimeterInset({
    wallThickness: WALL_THICKNESS,
  }),
}: Props) {
  const activeTool = useEditorStore(s => s.activeTool);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [orbitKey, setOrbitKey] = useState<ViewerCameraMode>(cameraMode);
  const prevCameraModeRef = useRef(cameraMode);
  useEffect(() => {
    if (prevCameraModeRef.current === cameraMode) return;
    prevCameraModeRef.current = cameraMode;
    setIsTransitioning(true);
  }, [cameraMode]);
  const handleTransitionComplete = useCallback(() => {
    setIsTransitioning(false);
    setOrbitKey(cameraMode);
  }, [cameraMode]);
  const sharedSceneInstanceRef = useRef<THREE.Scene>(
    resolveViewer25DSharedSceneInstance(),
  );
  const sceneCenter = useMemo(() => computeSceneCenter(floors), [floors]);
  const sceneBounds = useMemo(
    () => resolveTopDownSceneBounds({ floors, exteriorPolygon }),
    [exteriorPolygon, floors],
  );
  const floorPlacements = useMemo(
    () => resolveViewer25DFloorRenderPlacements(floors, WALL_HEIGHT_SCALE),
    [floors],
  );
  const shadowFootprints = useMemo(
    () =>
      createShadowFootprints(
        floors,
        exteriorPolygon,
        floorPlacements,
        floorBaseOffset,
        wallBaseOffset,
      ),
    [exteriorPolygon, floorBaseOffset, floorPlacements, floors, wallBaseOffset],
  );
  const wallTopHeight = resolveViewer25DStackExtrusionDepth(floors, WALL_HEIGHT_SCALE);
  const orbitTargetY = Math.max(wallTopHeight * 0.32, 0.2);
  const pedestalWidth = sceneBounds.width + VIEWER_PRESENTATION.pedestalMargin * 2;
  const pedestalDepth = sceneBounds.depth + VIEWER_PRESENTATION.pedestalMargin * 2;
  const pedestalY = -VIEWER_PRESENTATION.pedestalHeight / 2 - 0.035;
  const sharedSceneGraph = useMemo(
    () =>
      createViewer25DSceneGraph({
        floors,
        activeFloorId,
        exteriorPolygon,
        exteriorEdgeOpenings,
        floorRenderOffsets: floorPlacements.map(
          (placement) => placement.renderVerticalOffset ?? 0,
        ),
      }),
    [activeFloorId, exteriorEdgeOpenings, exteriorPolygon, floorPlacements, floors],
  );
  const renderPlan = useMemo(
    () =>
      resolveViewer25DRenderPlan({
        sceneGraph: sharedSceneGraph,
        cameraMode,
      }),
    [cameraMode, sharedSceneGraph],
  );
  const visibleRoomNodes = useMemo(() => {
    if (!exteriorPolygon || exteriorPolygon.length < 3) return renderPlan.roomNodes;
    return renderPlan.roomNodes.filter((roomNode) => {
      const n = roomNode.points.length;
      if (n === 0) return false;
      const cx = roomNode.points.reduce((s, p) => s + p.x, 0) / n;
      const cy = roomNode.points.reduce((s, p) => s + p.y, 0) / n;
      return isPointInPolygon({ x: cx, y: cy }, exteriorPolygon);
    });
  }, [renderPlan.roomNodes, exteriorPolygon]);
  // Scale perspective camera distance proportionally to scene size so that
  // small and large floor plans both fill the viewport at a comfortable zoom level.
  const perspectivePosition = useMemo((): readonly [number, number, number] => {
    const base = VIEWER_PRESENTATION.cameraPosition;
    const baseDist = Math.sqrt(base[0] ** 2 + base[1] ** 2 + base[2] ** 2);
    const maxSpan = Math.max(sceneBounds.width, sceneBounds.depth, 2);
    const targetDist = Math.max(baseDist, maxSpan * 1.6);
    const s = targetDist / baseDist;
    return [base[0] * s, base[1] * s, base[2] * s];
  }, [sceneBounds]);

  const viewportState = useMemo(
    () =>
      resolveViewerViewportState({
        sceneGraph: sharedSceneGraph,
        cameraMode,
        sceneBounds,
        perspectivePosition,
        perspectiveFov: VIEWER_PRESENTATION.cameraFov,
        fixedPolarAngle: FIXED_POLAR,
      }),
    [cameraMode, perspectivePosition, sceneBounds, sharedSceneGraph],
  );
  const cameraModeConfig = viewportState.camera;

  return (
    <div className="w-full h-full bg-[#F7F6F2]">
      <Canvas
        scene={sharedSceneInstanceRef.current}
        orthographic={cameraModeConfig.orthographic}
        camera={{
          position: [...cameraModeConfig.position],
          near: cameraModeConfig.near,
          far: cameraModeConfig.far,
          ...(cameraModeConfig.fov != null ? { fov: cameraModeConfig.fov } : {}),
          ...(cameraModeConfig.zoom != null ? { zoom: cameraModeConfig.zoom } : {}),
        }}
        shadows
        gl={{ preserveDrawingBuffer: true }}
      >
        <SceneCameraController
          cameraModeConfig={cameraModeConfig}
          onTransitionComplete={handleTransitionComplete}
        />
        <color attach="background" args={[VIEWER_PRESENTATION.backgroundColor]} />
        <fog
          attach="fog"
          args={[
            VIEWER_PRESENTATION.fogColor,
            VIEWER_PRESENTATION.fogNear,
            VIEWER_PRESENTATION.fogFar,
          ]}
        />
        <AmbientOcclusionComposer />
        <ambientLight
          intensity={VIEWER_LIGHTING.ambientLight.intensity}
          color={VIEWER_LIGHTING.ambientLight.color}
        />
        <hemisphereLight
          position={VIEWER_LIGHTING.bounceLight.position}
          intensity={VIEWER_LIGHTING.bounceLight.intensity}
          color={VIEWER_LIGHTING.bounceLight.skyColor}
          groundColor={VIEWER_LIGHTING.bounceLight.groundColor}
        />
        <directionalLight
          position={VIEWER_LIGHTING.diffuseLight.position}
          intensity={VIEWER_LIGHTING.diffuseLight.intensity}
          color={VIEWER_LIGHTING.diffuseLight.color}
          castShadow={VIEWER_LIGHTING.diffuseLight.castShadow}
          shadow-mapSize-width={VIEWER_LIGHTING.diffuseLight.shadowMapSize[0]}
          shadow-mapSize-height={VIEWER_LIGHTING.diffuseLight.shadowMapSize[1]}
          shadow-camera-near={VIEWER_LIGHTING.diffuseLight.shadowCameraNear}
          shadow-camera-far={VIEWER_LIGHTING.diffuseLight.shadowCameraFar}
          shadow-bias={VIEWER_LIGHTING.diffuseLight.shadowBias}
        />

        <Suspense fallback={null}>
          <group position={[-sceneCenter.x, 0, -sceneCenter.z]}>
            <LocalizedContactShadow
              footprints={shadowFootprints}
              sceneCenter={sceneCenter}
            />
            <RoundedBox
              args={[
                pedestalWidth,
                VIEWER_PRESENTATION.pedestalHeight,
                pedestalDepth,
              ]}
              position={[0, pedestalY, 0]}
              radius={VIEWER_PRESENTATION.pedestalCornerRadius}
              receiveShadow
              smoothness={5}
            >
              <meshStandardMaterial
                color="#E3DBCF"
                roughness={0.97}
                metalness={0.02}
              />
            </RoundedBox>
            {renderPlan.exteriorNode != null && (
              <ExteriorWall
                points={renderPlan.exteriorNode.points}
                totalHeight={renderPlan.exteriorNode.totalHeight}
                cameraMode={cameraMode}
              />
            )}
            {renderPlan.exteriorNode != null &&
              renderPlan.exteriorOpeningNodes.map((op) => (
                <OpeningMarker
                  key={op.id}
                  opening={op}
                  wallH={resolveViewer25DFloorExtrusionDepth(
                    renderPlan.exteriorNode!.totalHeight,
                    WALL_HEIGHT_SCALE,
                  )}
                  isActive={true}
                />
              ))}
            {visibleRoomNodes.map((roomNode) => (
              <RoomMesh
                key={roomNode.nodeId}
                points={roomNode.points}
                openings={roomNode.openings}
                floorRenderY={roomNode.floorRenderY}
                height={roomNode.floorHeight}
                floorBaseOffset={floorBaseOffset}
                wallBaseOffset={wallBaseOffset}
                floorPerimeterInset={floorPerimeterInset}
                color={FLOOR_COLORS[roomNode.colorIndex % FLOOR_COLORS.length]}
                label={roomNode.roomName}
                isActive={roomNode.isActive}
                cameraMode={cameraMode}
              />
            ))}
            {createViewer25DTopDownHandleOverlayScene({
              geometrySource: renderPlan,
              cameraMode,
            })}
            {cameraMode === "top-down-orthographic" && <DrawingLayer sceneCenter={sceneCenter} />}
          </group>
        </Suspense>

        <OrbitControls
          key={orbitKey}
          enabled={!isTransitioning}
          enablePan={cameraMode === "perspective" || activeTool === "select"}
          enableZoom
          enableDamping
          enableRotate={(cameraMode === "perspective" || activeTool === "select") && cameraModeConfig.enableRotate}
          dampingFactor={0.08} rotateSpeed={0.5} zoomSpeed={0.6}
          minPolarAngle={cameraModeConfig.minPolarAngle}
          maxPolarAngle={cameraModeConfig.maxPolarAngle}
          target={
            cameraModeConfig.orthographic
              ? [...cameraModeConfig.lookAt]
              : [0, orbitTargetY, 0]
          }
        />
        <ScreenshotButton />
      </Canvas>
    </div>
  );
}
