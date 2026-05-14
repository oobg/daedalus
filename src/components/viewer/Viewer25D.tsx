"use client";

import { Suspense, useMemo, useCallback, useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Html, OrbitControls, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { GTAOPass } from "three/examples/jsm/postprocessing/GTAOPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import type { EditorFloor, EditorPoint, RoomOpening } from "@/domain/editor-state";
import {
  configureContactShadowSoftness,
  createContactShadowFootprint,
  createExteriorWallMeshAssembly,
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
} from "./viewer25dGeometry";

// ── Visual palette ────────────────────────────────────────────────────────────
const FLOOR_COLORS      = ["#DDD8CF", "#D1CCC3", "#C5C0B7", "#B9B4AC", "#AEA9A2"];
const WALL_HEIGHT_SCALE = DEFAULT_WALL_HEIGHT_SCALE;
const WALL_THICKNESS    = DEFAULT_WALL_THICKNESS;  // world units (~4.5cm at 1:100)
const WALL_TOP_EDGE_RADIUS = 0.011;
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

// ── Coordinate helpers ────────────────────────────────────────────────────────
// world X = canvasX / 100
// world Z = canvasY / 100  (shape uses -canvasY/100 in shape-space; rotation negates)

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

function computeSceneBounds(
  floors: EditorFloor[],
  exteriorPolygon?: EditorPoint[] | null,
): { minX: number; maxX: number; minZ: number; maxZ: number; width: number; depth: number } {
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;

  const trackPoint = (point: EditorPoint) => {
    const worldX = point.x / 100;
    const worldZ = point.y / 100;
    minX = Math.min(minX, worldX);
    maxX = Math.max(maxX, worldX);
    minZ = Math.min(minZ, worldZ);
    maxZ = Math.max(maxZ, worldZ);
  };

  for (const floor of floors) {
    for (const room of floor.rooms) {
      for (const point of room.roomPolygon) {
        trackPoint(point);
      }
    }
  }

  for (const point of exteriorPolygon ?? []) {
    trackPoint(point);
  }

  if (!isFinite(minX) || !isFinite(minZ)) {
    return {
      minX: -1,
      maxX: 1,
      minZ: -1,
      maxZ: 1,
      width: 2,
      depth: 2,
    };
  }

  return {
    minX,
    maxX,
    minZ,
    maxZ,
    width: Math.max(maxX - minX, 2),
    depth: Math.max(maxZ - minZ, 2),
  };
}

function createShadowFootprints(
  floors: readonly EditorFloor[],
  exteriorPolygon: readonly EditorPoint[] | null | undefined,
  floorBaseOffset: number,
  wallBaseOffset: number,
) {
  const footprints = [];
  let cumulativeY = 0;

  for (const floor of floors) {
    const floorY = cumulativeY;
    cumulativeY += floor.floorHeight;

    for (const room of floor.rooms) {
      const points = room.roomPolygon.map((point) => ({
        x: point.x / 100,
        z: point.y / 100,
      }));
      const floorFootprint = createContactShadowFootprint(
        "floor",
        points,
        floorY + floorBaseOffset,
      );
      const wallFootprint = createContactShadowFootprint(
        "wall",
        points,
        floorY + wallBaseOffset,
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

const EX_DOOR_PANEL  = { depth: 0.065, bevelEnabled: false } as const;
const EX_DOOR_ARC    = { depth: 0.022, bevelEnabled: false } as const;
const EX_WINDOW      = { depth: 0.050, bevelEnabled: false } as const;
const EX_WINDOW_PANE = { depth: 0.012, bevelEnabled: false } as const;
const EX_ELEV        = { depth: 0.070, bevelEnabled: false } as const;

// Door — solid extruded panel + shallow translucent arc sweep
function DoorSymbol3D({ x, z }: { x: number; z: number }) {
  const r = 0.17, ri = 0.150, t = 0.022;

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
      panelGeo: new THREE.ExtrudeGeometry(panel, EX_DOOR_PANEL),
      arcGeo:   new THREE.ExtrudeGeometry(arc,   EX_DOOR_ARC),
    };
  }, []);

  return (
    <group position={[x, 0.02, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh geometry={panelGeo}>
        <meshLambertMaterial color="#5E8A7C" />
      </mesh>
      <mesh geometry={arcGeo}>
        <meshLambertMaterial color="#5E8A7C" transparent opacity={0.38} />
      </mesh>
    </group>
  );
}

// Window — extruded outer frame + center divider slab
function WindowSymbol3D({ x, z }: { x: number; z: number }) {
  const w = 0.24, h = 0.07, ft = 0.013, lt = 0.010;

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
      frameGeo: new THREE.ExtrudeGeometry(frame, EX_WINDOW),
      divGeo:   new THREE.ExtrudeGeometry(div,   EX_WINDOW),
      paneGeo:  new THREE.ExtrudeGeometry(pane,  EX_WINDOW_PANE),
    };
  }, []);

  return (
    <group position={[x, 0.02, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh geometry={frameGeo}>
        <meshLambertMaterial color="#7A9EB5" />
      </mesh>
      <mesh geometry={paneGeo}>
        <meshPhysicalMaterial {...WINDOW_GLASS_MATERIAL} />
      </mesh>
      <mesh geometry={divGeo}>
        <meshLambertMaterial color="#90A8B1" transparent opacity={0.72} />
      </mesh>
    </group>
  );
}

// Stair — three actual 3D steps at increasing Y heights and Z offsets
function StairSymbol3D({ x, z }: { x: number; z: number }) {
  const STEPS = [
    { h: 0.040, yCenter: 0.020, zOff: -0.065 },
    { h: 0.090, yCenter: 0.045, zOff:  0.000 },
    { h: 0.150, yCenter: 0.075, zOff:  0.065 },
  ] as const;

  return (
    <group position={[x, 0, z]}>
      {STEPS.map((s, i) => (
        <mesh key={i} position={[0, s.yCenter, s.zOff]}>
          <boxGeometry args={[0.17, s.h, 0.065]} />
          <meshLambertMaterial color="#9A9578" />
        </mesh>
      ))}
    </group>
  );
}

// Elevator — extruded square frame + up/down arrow triangles
function ElevatorSymbol3D({ x, z }: { x: number; z: number }) {
  const s = 0.19, ft = 0.013, at = 0.040;

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
      frameGeo: new THREE.ExtrudeGeometry(frame,     EX_ELEV),
      upGeo:    new THREE.ExtrudeGeometry(upArrow,   EX_ELEV),
      downGeo:  new THREE.ExtrudeGeometry(downArrow, EX_ELEV),
    };
  }, []);

  return (
    <group position={[x, 0.02, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh geometry={frameGeo}><meshLambertMaterial color="#8A8A8A" /></mesh>
      <mesh geometry={upGeo}>  <meshLambertMaterial color="#8A8A8A" /></mesh>
      <mesh geometry={downGeo}><meshLambertMaterial color="#8A8A8A" /></mesh>
    </group>
  );
}

function OpeningMarker({ opening }: { opening: RoomOpening }) {
  const x = opening.x / 100;
  const z = opening.y / 100;
  if (opening.type === "door")    return <DoorSymbol3D     x={x} z={z} />;
  if (opening.type === "window")  return <WindowSymbol3D   x={x} z={z} />;
  if (opening.type === "stair")   return <StairSymbol3D    x={x} z={z} />;
  return                                 <ElevatorSymbol3D x={x} z={z} />;
}

// ── RoomMesh — walls as per-edge boxes, no ceiling ───────────────────────────
interface RoomMeshProps {
  points:   EditorPoint[];
  openings: RoomOpening[];
  floorY:   number;
  height:   number;
  floorBaseOffset: number;
  wallBaseOffset: number;
  floorPerimeterInset: number;
  color:    string;
  label:    string;
}

function RoomMesh({
  points,
  openings,
  floorY,
  height,
  floorBaseOffset,
  wallBaseOffset,
  floorPerimeterInset,
  color,
  label,
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
  const wallH = height * WALL_HEIGHT_SCALE;

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

  const labelX = points.reduce((s, p) => s + p.x, 0) / points.length / 100;
  const labelZ = points.reduce((s, p) => s + p.y, 0) / points.length / 100;

  return (
    <group position={[0, floorY * WALL_HEIGHT_SCALE, 0]}>
      {/* Wall assembly — softened segments and corners, no ceiling */}
      {wallMeshAssembly.meshes.map((wallMesh, index) => (
        <mesh
          key={`${wallMesh.source}-${index}`}
          geometry={wallMesh.geometry}
          position={wallMesh.position}
          rotation={wallMesh.rotation}
        >
          <meshStandardMaterial {...INTERIOR_WALL_SHADING} />
        </mesh>
      ))}

      {/* Floor plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, floorBaseOffset, 0]}>
        <shapeGeometry args={[shape]} />
        <meshLambertMaterial color={color} side={THREE.DoubleSide} />
      </mesh>

      {/* Room label — floats above wall tops */}
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

      {/* Opening markers */}
      {openings.map(op => (
        <OpeningMarker key={op.id} opening={op} />
      ))}
    </group>
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

// ── Exterior wall — wraps all floors ─────────────────────────────────────────
interface ExteriorWallProps {
  points: EditorPoint[];
  totalHeight: number;
}

function ExteriorWall({ points, totalHeight }: ExteriorWallProps) {
  const wallH = totalHeight * WALL_HEIGHT_SCALE;
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
      {wallMeshAssembly.meshes.map((wallMesh, index) => (
        <mesh
          key={`${wallMesh.source}-${index}`}
          geometry={wallMesh.geometry}
          position={wallMesh.position}
          rotation={wallMesh.rotation}
        >
          <meshStandardMaterial {...EXTERIOR_WALL_SHADING} />
        </mesh>
      ))}
    </group>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
interface Props {
  floors: EditorFloor[];
  activeFloorId: string | null;
  exteriorPolygon?: EditorPoint[] | null;
  floorBaseOffset?: number;
  wallBaseOffset?: number;
  floorPerimeterInset?: number;
}

export default function Viewer25D({
  floors,
  activeFloorId,
  exteriorPolygon,
  floorBaseOffset = DEFAULT_ROOM_LAYER_ELEVATIONS.floorBaseOffset,
  wallBaseOffset = DEFAULT_ROOM_LAYER_ELEVATIONS.wallBaseOffset,
  floorPerimeterInset = resolveFloorPerimeterInset({
    wallThickness: WALL_THICKNESS,
  }),
}: Props) {
  const sceneCenter = useMemo(() => computeSceneCenter(floors), [floors]);
  const sceneBounds = useMemo(
    () => computeSceneBounds(floors, exteriorPolygon),
    [exteriorPolygon, floors],
  );
  const shadowFootprints = useMemo(
    () =>
      createShadowFootprints(
        floors,
        exteriorPolygon,
        floorBaseOffset,
        wallBaseOffset,
      ),
    [exteriorPolygon, floorBaseOffset, floors, wallBaseOffset],
  );

  let cumulativeY = 0;
  const floorData = floors.map((floor, i) => {
    const y = cumulativeY;
    cumulativeY += floor.floorHeight;
    return { floor, y, colorIndex: i };
  });
  const totalHeight = floors.reduce((s, f) => s + f.floorHeight, 0);
  const wallTopHeight = totalHeight * WALL_HEIGHT_SCALE;
  const orbitTargetY = Math.max(wallTopHeight * 0.32, 0.2);
  const pedestalWidth = sceneBounds.width + VIEWER_PRESENTATION.pedestalMargin * 2;
  const pedestalDepth = sceneBounds.depth + VIEWER_PRESENTATION.pedestalMargin * 2;
  const pedestalY = -VIEWER_PRESENTATION.pedestalHeight / 2 - 0.035;

  return (
    <div className="w-full h-full bg-[#F7F6F2]">
      <Canvas
        camera={{
          position: [...VIEWER_PRESENTATION.cameraPosition],
          fov: VIEWER_PRESENTATION.cameraFov,
        }}
        shadows
        gl={{ preserveDrawingBuffer: true }}
      >
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
            {exteriorPolygon && exteriorPolygon.length >= 3 && (
              <ExteriorWall points={exteriorPolygon} totalHeight={totalHeight} />
            )}
            {floorData.map(({ floor, y, colorIndex }) =>
              floor.rooms.map(room => (
                <RoomMesh
                  key={room.roomId}
                  points={room.roomPolygon}
                  openings={room.openings ?? []}
                  floorY={y}
                  height={floor.floorHeight}
                  floorBaseOffset={floorBaseOffset}
                  wallBaseOffset={wallBaseOffset}
                  floorPerimeterInset={floorPerimeterInset}
                  color={FLOOR_COLORS[colorIndex % FLOOR_COLORS.length]}
                  label={room.roomName}
                />
              ))
            )}
          </group>
        </Suspense>

        <OrbitControls
          enablePan enableZoom enableRotate enableDamping
          dampingFactor={0.08} rotateSpeed={0.5} zoomSpeed={0.6}
          minPolarAngle={FIXED_POLAR} maxPolarAngle={FIXED_POLAR}
          target={[0, orbitTargetY, 0]}
        />
        <ScreenshotButton />
      </Canvas>
    </div>
  );
}
