import * as THREE from "three";

import {
  createWallSegmentGeometry,
  type WallProfileOptions,
} from "./wall-profile.ts";

const MIN_SEGMENT_LENGTH = 0.001;

export interface StraightWallSegmentPoint {
  x: number;
  y: number;
}

export interface StraightWallSegmentMeshOptions extends WallProfileOptions {
  baseOffset?: number;
  closeLoop?: boolean;
}

export interface StraightWallSegmentMesh {
  angle: number;
  center: {
    x: number;
    z: number;
  };
  geometry: THREE.ExtrudeGeometry;
  length: number;
  position: [number, number, number];
  profilePointCount: number;
  rotation: [number, number, number];
  source: "softened-straight-segment";
}

export function createStraightWallSegmentMeshes(
  points: readonly StraightWallSegmentPoint[],
  options: StraightWallSegmentMeshOptions,
): StraightWallSegmentMesh[] {
  if (points.length < 2) {
    return [];
  }

  const closeLoop = options.closeLoop ?? true;
  const segmentCount = closeLoop ? points.length : points.length - 1;
  const meshes: StraightWallSegmentMesh[] = [];
  const baseOffset = options.baseOffset ?? 0;

  for (let index = 0; index < segmentCount; index += 1) {
    const start = points[index];
    const end = points[(index + 1) % points.length];
    const dx = end.x - start.x;
    const dz = end.y - start.y;
    const length = Math.hypot(dx, dz);

    if (length <= MIN_SEGMENT_LENGTH) {
      continue;
    }

    const geometry = createWallSegmentGeometry(length, options);

    meshes.push({
      angle: -Math.atan2(dz, dx),
      center: {
        x: (start.x + end.x) / 2,
        z: (start.y + end.y) / 2,
      },
      geometry,
      length,
      position: [(start.x + end.x) / 2, baseOffset, (start.y + end.y) / 2],
      profilePointCount: readProfilePointCount(geometry),
      rotation: [0, -Math.atan2(dz, dx), 0],
      source: "softened-straight-segment",
    });
  }

  return meshes;
}

function readProfilePointCount(geometry: THREE.ExtrudeGeometry): number {
  const shape = Array.isArray(geometry.parameters.shapes)
    ? geometry.parameters.shapes[0]
    : geometry.parameters.shapes;

  return shape.extractPoints(12).shape.length;
}
