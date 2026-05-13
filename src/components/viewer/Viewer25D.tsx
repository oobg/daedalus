"use client";

import { Suspense, useMemo, useRef, useCallback } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import type { EditorFloor, EditorPoint, RoomOpening } from "@/domain/editor-state";

const FLOOR_COLORS = ["#d4c9b8", "#c8bfae", "#bcb59e", "#b0ab8e", "#a4a17e"];
const WALL_COLOR = "#9a9690";
const WALL_HEIGHT_SCALE = 0.4;

const OPENING_COLORS: Record<string, string> = {
  door: "#4a7c6f",
  window: "#5599cc",
  stair: "#888860",
  elevator: "#888",
};

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

interface OpeningMarkerProps {
  opening: RoomOpening;
  floorY: number;
  wallHeight: number;
}

function OpeningMarker({ opening, floorY, wallHeight }: OpeningMarkerProps) {
  const color = OPENING_COLORS[opening.type] ?? "#888";
  const x = opening.x / 100;
  const z = -opening.y / 100;
  const y = floorY * WALL_HEIGHT_SCALE + 0.02;

  const size = opening.type === "door" ? 0.18 :
    opening.type === "window" ? 0.22 :
    opening.type === "stair" ? 0.20 : 0.18;

  return (
    <mesh position={[x, y, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[size, 16]} />
      <meshLambertMaterial color={color} side={THREE.DoubleSide} />
    </mesh>
  );
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
    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      depth: height * WALL_HEIGHT_SCALE,
      bevelEnabled: false,
    };
    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }, [shape, height]);

  const labelX = points.reduce((s, p) => s + p.x, 0) / points.length / 100;
  const labelZ = -points.reduce((s, p) => s + p.y, 0) / points.length / 100;

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
        position={[labelX, height * WALL_HEIGHT_SCALE + 0.05, labelZ]}
        center
        style={{
          pointerEvents: "none",
          userSelect: "none",
          fontSize: "11px",
          color: "#444",
          background: "rgba(255,255,255,0.75)",
          padding: "1px 4px",
          borderRadius: "3px",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </Html>
      {/* Openings */}
      {openings.map(op => (
        <OpeningMarker
          key={op.id}
          opening={op}
          floorY={0}
          wallHeight={height * WALL_HEIGHT_SCALE}
        />
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
          background: "#f0efeb",
          border: "1px solid #d4d4c8",
          borderRadius: "4px",
          cursor: "pointer",
          color: "#555548",
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
  let cumulativeY = 0;
  const floorData = floors.map((floor, i) => {
    const y = cumulativeY;
    cumulativeY += floor.floorHeight;
    return { floor, y, colorIndex: i };
  });

  return (
    <div className="w-full h-full bg-[#f0efeb]">
      <Canvas
        camera={{ position: [8, 8, 8], fov: 45 }}
        shadows
        gl={{ preserveDrawingBuffer: true }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 10, 5]} intensity={0.8} castShadow />

        <Suspense fallback={null}>
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
        </Suspense>

        <OrbitControls
          enablePan
          enableZoom
          enableRotate
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2.2}
          target={[0, 0, 0]}
        />
        <gridHelper args={[20, 20, "#ccc", "#eee"]} position={[0, -0.01, 0]} />
        <ScreenshotButton />
      </Canvas>
    </div>
  );
}
