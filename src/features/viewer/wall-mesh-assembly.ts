import {
  createSoftenedWallCornerPaths,
  type Viewer25DGeometryConfig,
  type Viewer25DPoint2D,
} from "../../components/viewer/viewer25dGeometry.ts";
import {
  createWallCornerMeshes,
  type WallCornerSegmentMesh,
} from "./wall-corner-mesh.ts";
import {
  createStraightWallSegmentMeshes,
  type StraightWallSegmentMesh,
} from "./wall-segment-mesh.ts";
import type { WallProfileOptions } from "./wall-profile.ts";

export interface WallMeshAssemblyOptions
  extends WallProfileOptions,
    Viewer25DGeometryConfig {
  baseOffset?: number;
}

export type AssembledWallMesh =
  | StraightWallSegmentMesh
  | WallCornerSegmentMesh;

export interface WallMeshAssembly {
  meshes: AssembledWallMesh[];
  cornerMeshCount: number;
  straightMeshCount: number;
  usesOnlySoftenedGeometryPipeline: boolean;
}

export function createWallMeshAssembly(
  points: readonly Viewer25DPoint2D[],
  options: WallMeshAssemblyOptions,
): WallMeshAssembly {
  if (points.length < 2) {
    return {
      meshes: [],
      cornerMeshCount: 0,
      straightMeshCount: 0,
      usesOnlySoftenedGeometryPipeline: true,
    };
  }

  if (points.length === 2) {
    const meshes = createStraightWallSegmentMeshes(points, {
      ...options,
      closeLoop: false,
    });

    return {
      meshes,
      cornerMeshCount: 0,
      straightMeshCount: meshes.length,
      usesOnlySoftenedGeometryPipeline: meshes.every(
        (mesh) => mesh.source === "softened-straight-segment",
      ),
    };
  }

  const cornerPaths = createSoftenedWallCornerPaths(points, options);
  const cornerMeshesByIndex = groupCornerMeshesByIndex(
    createWallCornerMeshes(points, options),
  );
  const meshes: AssembledWallMesh[] = [];
  let straightMeshCount = 0;
  let cornerMeshCount = 0;

  for (let index = 0; index < cornerPaths.length; index += 1) {
    const currentCornerMeshes = cornerMeshesByIndex.get(index) ?? [];
    meshes.push(...currentCornerMeshes);
    cornerMeshCount += currentCornerMeshes.length;

    const currentPath = cornerPaths[index];
    const nextPath = cornerPaths[(index + 1) % cornerPaths.length];
    const straightMeshes = createStraightWallSegmentMeshes(
      [readTerminalPoint(currentPath.path), nextPath.path[0] ?? nextPath.originalCorner],
      {
        ...options,
        closeLoop: false,
      },
    );

    meshes.push(...straightMeshes);
    straightMeshCount += straightMeshes.length;
  }

  return {
    meshes,
    cornerMeshCount,
    straightMeshCount,
    usesOnlySoftenedGeometryPipeline: meshes.every(
      (mesh) =>
        mesh.source === "softened-straight-segment" ||
        mesh.source === "softened-corner-path",
    ),
  };
}

function groupCornerMeshesByIndex(
  meshes: readonly WallCornerSegmentMesh[],
): Map<number, WallCornerSegmentMesh[]> {
  const grouped = new Map<number, WallCornerSegmentMesh[]>();

  for (const mesh of meshes) {
    const group = grouped.get(mesh.cornerIndex);

    if (group == null) {
      grouped.set(mesh.cornerIndex, [mesh]);
      continue;
    }

    group.push(mesh);
  }

  return grouped;
}

function readTerminalPoint(
  path: readonly Viewer25DPoint2D[],
): Viewer25DPoint2D {
  return path[path.length - 1] ?? path[0] ?? { x: 0, y: 0 };
}
