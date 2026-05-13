"use client";

import { Suspense, useMemo, useCallback } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import type { EditorFloor, EditorPoint, RoomOpening } from "@/domain/editor-state";

// Visual direction palette — warm neutrals, low saturation
const FLOOR_COLORS = ["#DDD8CF", "#D1CCC3", "#C5C0B7", "#B9B4AC", "#AEA9A2"];
const WALL_COLOR    = "#B8B3AC";   // primary matte wall face
const WALL_DARK     = "#A8A39C";   // shadow/side face (used via directional light)
const WALL_HEIGHT_SCALE = 0.3;

// Camera [8,8,8]: polar angle from Y-axis = acos(8 / sqrt(8²+8²+8²)) = acos(1/√3)
// Locking min===max prevents vertical tilting; only horizontal orbit allowed.
const FIXED_POLAR = Math.acos(1 / Math.sqrt(3));

// Coordinate mapping:
//   polygonToShape uses (canvasX/100, -canvasY/100) in shape XY plane.
//   Mesh rotation [-PI/2, 0, 0] maps shape (x, y) → world (x, 0, -(-canvasY/100))
//   So:  world X = canvasX / 100
//        world Z = canvasY / 100   ← positive, NOT negated

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
  let minX = Infinity, maxX = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;
  for (const floor of floors) {
    for (const room of floor.rooms) {
      for (const pt of room.roomPolygon) {
        const wx = pt.x / 100;
        const wz = pt.y / 100;  // world Z = canvasY / 100
        if (wx < minX) minX = wx;
        if (wx > maxX) maxX = wx;
        if (wz < minZ) minZ = wz;
        if (wz > maxZ) maxZ = wz;
      }
    }
  }
  if (!isFinite(minX)) return { x: 0, z: 0 };
  return { x: (minX + maxX) / 2, z: (minZ + maxZ) / 2 };
}

// ── Floor-plan opening symbols ────────────────────────────────────────────
// All symbols lie flat on the floor: rotation={[-PI/2, 0, 0]}
// y = 0.025 puts them just above the floor plane (floor plane at y=0.01)

// Door — thin panel rectangle + arc sweep sector (architectural floor plan symbol)
function DoorSymbol3D({ x, z }: { x: number; z: number }) {
  const r = 0.18, ri = 0.155, t = 0.022;

  const panelShape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, -t / 2); s.lineTo(r, -t / 2);
    s.lineTo(r,  t / 2); s.lineTo(0,  t / 2);
    s.closePath();
    return s;
  }, []);

  const arcShape = useMemo(() => {
    // Annular sector: outer radius r, inner radius ri, 0–90°
    const s = new THREE.Shape();
    s.moveTo(ri, 0);
    s.lineTo(r, 0);
    s.absarc(0, 0, r,  0,           Math.PI / 2, false);
    s.lineTo(0, ri);
    s.absarc(0, 0, ri, Math.PI / 2, 0,           true);
    s.closePath();
    return s;
  }, []);

  return (
    <group position={[x, 0.025, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh><shapeGeometry args={[panelShape]} /><meshLambertMaterial color="#5E8A7C" side={THREE.DoubleSide} /></mesh>
      <mesh><shapeGeometry args={[arcShape]}  /><meshLambertMaterial color="#5E8A7C" transparent opacity={0.38} side={THREE.DoubleSide} /></mesh>
    </group>
  );
}

// Window — elongated frame + center divider (glass pane plan symbol)
function WindowSymbol3D({ x, z }: { x: number; z: number }) {
  const w = 0.24, h = 0.07, ft = 0.013, lt = 0.010;

  const frameShape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-w / 2, -h / 2); s.lineTo(w / 2, -h / 2);
    s.lineTo( w / 2,  h / 2); s.lineTo(-w / 2, h / 2);
    s.closePath();
    const hole = new THREE.Path();
    hole.moveTo(-w / 2 + ft, -h / 2 + ft); hole.lineTo(w / 2 - ft, -h / 2 + ft);
    hole.lineTo( w / 2 - ft,  h / 2 - ft); hole.lineTo(-w / 2 + ft, h / 2 - ft);
    hole.closePath();
    s.holes.push(hole);
    return s;
  }, []);

  const dividerShape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-w / 2 + ft, -lt / 2); s.lineTo(w / 2 - ft, -lt / 2);
    s.lineTo( w / 2 - ft,  lt / 2); s.lineTo(-w / 2 + ft, lt / 2);
    s.closePath();
    return s;
  }, []);

  return (
    <group position={[x, 0.025, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh><shapeGeometry args={[frameShape]}   /><meshLambertMaterial color="#7A9EB5" side={THREE.DoubleSide} /></mesh>
      <mesh><shapeGeometry args={[dividerShape]} /><meshLambertMaterial color="#7A9EB5" side={THREE.DoubleSide} /></mesh>
    </group>
  );
}

// Stair — frame + horizontal step lines
function StairSymbol3D({ x, z }: { x: number; z: number }) {
  const w = 0.20, h = 0.22, ft = 0.013, lt = 0.010, steps = 4;

  const shapes = useMemo(() => {
    const result: THREE.Shape[] = [];

    const frame = new THREE.Shape();
    frame.moveTo(-w / 2, -h / 2); frame.lineTo(w / 2, -h / 2);
    frame.lineTo( w / 2,  h / 2); frame.lineTo(-w / 2, h / 2);
    frame.closePath();
    const hole = new THREE.Path();
    hole.moveTo(-w / 2 + ft, -h / 2 + ft); hole.lineTo(w / 2 - ft, -h / 2 + ft);
    hole.lineTo( w / 2 - ft,  h / 2 - ft); hole.lineTo(-w / 2 + ft, h / 2 - ft);
    hole.closePath();
    frame.holes.push(hole);
    result.push(frame);

    const innerH = h - 2 * ft;
    const stepH  = innerH / steps;
    for (let i = 1; i < steps; i++) {
      const y = -h / 2 + ft + i * stepH;
      const line = new THREE.Shape();
      line.moveTo(-w / 2 + ft, y - lt / 2); line.lineTo(w / 2 - ft, y - lt / 2);
      line.lineTo( w / 2 - ft, y + lt / 2); line.lineTo(-w / 2 + ft, y + lt / 2);
      line.closePath();
      result.push(line);
    }
    return result;
  }, []);

  return (
    <group position={[x, 0.025, z]} rotation={[-Math.PI / 2, 0, 0]}>
      {shapes.map((shape, i) => (
        <mesh key={i}><shapeGeometry args={[shape]} /><meshLambertMaterial color="#9A9578" side={THREE.DoubleSide} /></mesh>
      ))}
    </group>
  );
}

// Elevator — square frame + up/down arrow triangles
function ElevatorSymbol3D({ x, z }: { x: number; z: number }) {
  const s = 0.20, ft = 0.013, at = 0.042;

  const shapes = useMemo(() => {
    const result: THREE.Shape[] = [];

    const frame = new THREE.Shape();
    frame.moveTo(-s / 2, -s / 2); frame.lineTo(s / 2, -s / 2);
    frame.lineTo( s / 2,  s / 2); frame.lineTo(-s / 2, s / 2);
    frame.closePath();
    const hole = new THREE.Path();
    hole.moveTo(-s / 2 + ft, -s / 2 + ft); hole.lineTo(s / 2 - ft, -s / 2 + ft);
    hole.lineTo( s / 2 - ft,  s / 2 - ft); hole.lineTo(-s / 2 + ft, s / 2 - ft);
    hole.closePath();
    frame.holes.push(hole);
    result.push(frame);

    // Up arrow (upper half)
    const up = new THREE.Shape();
    up.moveTo(-at, 0.018); up.lineTo(0, 0.018 + at * 1.1); up.lineTo(at, 0.018);
    up.closePath();
    result.push(up);

    // Down arrow (lower half)
    const down = new THREE.Shape();
    down.moveTo(-at, -0.018); down.lineTo(0, -0.018 - at * 1.1); down.lineTo(at, -0.018);
    down.closePath();
    result.push(down);

    return result;
  }, []);

  return (
    <group position={[x, 0.025, z]} rotation={[-Math.PI / 2, 0, 0]}>
      {shapes.map((shape, i) => (
        <mesh key={i}><shapeGeometry args={[shape]} /><meshLambertMaterial color="#8A8A8A" side={THREE.DoubleSide} /></mesh>
      ))}
    </group>
  );
}

interface OpeningMarkerProps {
  opening: RoomOpening;
  floorY: number;
}

function OpeningMarker({ opening }: OpeningMarkerProps) {
  const x = opening.x / 100;
  const z = opening.y / 100;  // world Z = canvasY / 100 (no negation)
  // floorY is always 0 here — offset already applied by parent RoomMesh group

  if (opening.type === "door")     return <DoorSymbol3D     x={x} z={z} />;
  if (opening.type === "window")   return <WindowSymbol3D   x={x} z={z} />;
  if (opening.type === "stair")    return <StairSymbol3D    x={x} z={z} />;
  return                                  <ElevatorSymbol3D x={x} z={z} />;
}

interface RoomMeshProps {
  points: EditorPoint[];
  openings: RoomOpening[];
  floorY: number;
  height: number;
  color: string;
  label: string;
}

function RoomMesh({ points, openings, floorY, height, color, label }: RoomMeshProps) {
  const shape = useMemo(() => polygonToShape(points), [points]);

  const geometry = useMemo(() => {
    return new THREE.ExtrudeGeometry(shape, {
      depth: height * WALL_HEIGHT_SCALE,
      bevelEnabled: false,
    });
  }, [shape, height]);

  // Label at polygon centroid — world coords: x/100, z=y/100
  const labelX = points.reduce((s, p) => s + p.x, 0) / points.length / 100;
  const labelZ = points.reduce((s, p) => s + p.y, 0) / points.length / 100;

  return (
    <group position={[0, floorY * WALL_HEIGHT_SCALE, 0]}>
      {/* Extruded walls */}
      <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]}>
        <meshLambertMaterial color={WALL_COLOR} />
      </mesh>
      {/* Floor plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <shapeGeometry args={[shape]} />
        <meshLambertMaterial color={color} side={THREE.DoubleSide} />
      </mesh>
      {/* Room label */}
      <Html
        position={[labelX, height * WALL_HEIGHT_SCALE + 0.1, labelZ]}
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
        }}
      >
        {label}
      </Html>
      {/* Opening markers */}
      {openings.map(op => (
        <OpeningMarker key={op.id} opening={op} floorY={0} />
      ))}
    </group>
  );
}

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
        }}
      >
        2.5D PNG 저장
      </button>
    </Html>
  );
}

interface Props {
  floors: EditorFloor[];
  activeFloorId: string | null;
}

export default function Viewer25D({ floors, activeFloorId }: Props) {
  const sceneCenter = useMemo(() => computeSceneCenter(floors), [floors]);

  let cumulativeY = 0;
  const floorData = floors.map((floor, i) => {
    const y = cumulativeY;
    cumulativeY += floor.floorHeight;
    return { floor, y, colorIndex: i };
  });

  return (
    <div className="w-full h-full bg-[#F7F6F2]">
      <Canvas
        camera={{ position: [8, 8, 8], fov: 38 }}
        shadows
        gl={{ preserveDrawingBuffer: true }}
      >
        <ambientLight intensity={0.85} color="#fff8f0" />
        <directionalLight position={[4, 12, 6]} intensity={0.45} castShadow
          shadow-mapSize-width={1024} shadow-mapSize-height={1024}
          shadow-camera-near={0.5} shadow-camera-far={40}
          shadow-bias={-0.001}
        />

        <Suspense fallback={null}>
          {/* Offset entire scene so building center sits at world origin */}
          <group position={[-sceneCenter.x, 0, -sceneCenter.z]}>
            {floorData.map(({ floor, y, colorIndex }) =>
              floor.rooms.map(room => (
                <RoomMesh
                  key={room.roomId}
                  points={room.roomPolygon}
                  openings={room.openings ?? []}
                  floorY={y}
                  height={floor.floorHeight}
                  color={FLOOR_COLORS[colorIndex % FLOOR_COLORS.length]}
                  label={room.roomName}
                />
              ))
            )}
          </group>
        </Suspense>

        <OrbitControls
          enablePan
          enableZoom
          enableRotate
          enableDamping
          dampingFactor={0.08}
          rotateSpeed={0.5}
          zoomSpeed={0.6}
          minPolarAngle={FIXED_POLAR}
          maxPolarAngle={FIXED_POLAR}
          target={[0, 0, 0]}
        />
        <gridHelper args={[30, 30, "#DEDAD3", "#EEEAE3"]} position={[0, -0.01, 0]} />
        <ScreenshotButton />
      </Canvas>
    </div>
  );
}
