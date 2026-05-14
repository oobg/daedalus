import * as THREE from "three";

import {
  createSoftenedWallCornerPaths,
  type Viewer25DGeometryConfig,
  type Viewer25DPoint2D,
} from "../../components/viewer/viewer25dGeometry.ts";
import {
  createWallSegmentGeometry,
  type WallProfileOptions,
} from "./wall-profile.ts";

const MIN_SEGMENT_LENGTH = 0.001;

export interface WallCornerMeshOptions
  extends WallProfileOptions,
    Viewer25DGeometryConfig {
  baseOffset?: number;
}

export interface WallCornerSegmentMesh {
  angle: number;
  cornerIndex: number;
  cornerPathPointCount: number;
  geometry: THREE.ExtrudeGeometry;
  length: number;
  originalCorner: Viewer25DPoint2D;
  path: Viewer25DPoint2D[];
  position: [number, number, number];
  rotation: [number, number, number];
  source: "softened-corner-path";
}

export function createWallCornerMeshes(
  points: readonly Viewer25DPoint2D[],
  options: WallCornerMeshOptions,
): WallCornerSegmentMesh[] {
  const baseOffset = options.baseOffset ?? 0;
  const cornerPaths = createSoftenedWallCornerPaths(points, options);
  const meshes: WallCornerSegmentMesh[] = [];

  for (const cornerPath of cornerPaths) {
    if (!cornerPath.isSoftened || cornerPath.path.length < 2) {
      continue;
    }

    for (let index = 0; index < cornerPath.path.length - 1; index += 1) {
      const start = cornerPath.path[index];
      const end = cornerPath.path[index + 1];
      const dx = end.x - start.x;
      const dz = end.y - start.y;
      const length = Math.hypot(dx, dz);

      if (length <= MIN_SEGMENT_LENGTH) {
        continue;
      }

      meshes.push({
        angle: -Math.atan2(dz, dx),
        cornerIndex: cornerPath.index,
        cornerPathPointCount: cornerPath.path.length,
        geometry: createWallSegmentGeometry(length, options),
        length,
        originalCorner: cornerPath.originalCorner,
        path: cornerPath.path,
        position: [(start.x + end.x) / 2, baseOffset, (start.y + end.y) / 2],
        rotation: [0, -Math.atan2(dz, dx), 0],
        source: "softened-corner-path",
      });
    }
  }

  return meshes;
}
