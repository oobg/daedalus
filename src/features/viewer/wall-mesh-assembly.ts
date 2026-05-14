import type { Viewer25DPoint2D } from "../../components/viewer/viewer25dGeometry.ts";
import { createWallSegmentGeometry } from "./wall-profile.ts";
import {
  createWallJunctionAssembly,
  type WallJunctionAssemblyOptions,
} from "./wall-junction-assembly.ts";
import type { WallCornerSegmentMesh } from "./wall-corner-mesh.ts";
import type { StraightWallSegmentMesh } from "./wall-segment-mesh.ts";

export interface WallMeshAssemblyOptions
  extends WallJunctionAssemblyOptions {}

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
  const junctionAssembly = createWallJunctionAssembly(points, options);
  const meshes: AssembledWallMesh[] = [];

  for (const section of junctionAssembly.sections) {
    const geometry = createWallSegmentGeometry(section.length, options);

    if (section.kind === "corner") {
      meshes.push({
        angle: section.angle,
        cornerIndex: section.cornerIndex,
        cornerPathPointCount: section.cornerPathPointCount,
        geometry,
        length: section.length,
        originalCorner: section.originalCorner,
        path: [...section.path],
        position: [
          (section.start.x + section.end.x) / 2,
          options.baseOffset ?? 0,
          (section.start.y + section.end.y) / 2,
        ],
        rotation: [0, section.angle, 0],
        source: "softened-corner-path",
      });
      continue;
    }

    meshes.push({
      angle: section.angle,
      center: {
        x: (section.start.x + section.end.x) / 2,
        z: (section.start.y + section.end.y) / 2,
      },
      geometry,
      length: section.length,
      position: [
        (section.start.x + section.end.x) / 2,
        options.baseOffset ?? 0,
        (section.start.y + section.end.y) / 2,
      ],
      profilePointCount: readProfilePointCount(geometry),
      rotation: [0, section.angle, 0],
      source: "softened-straight-segment",
    });
  }

  return {
    meshes,
    cornerMeshCount: junctionAssembly.cornerSectionCount,
    straightMeshCount: junctionAssembly.straightSectionCount,
    usesOnlySoftenedGeometryPipeline: meshes.every(
      (mesh) =>
        mesh.source === "softened-straight-segment" ||
        mesh.source === "softened-corner-path",
    ),
  };
}

function readProfilePointCount(geometry: WallCornerSegmentMesh["geometry"]): number {
  const shape = Array.isArray(geometry.parameters.shapes)
    ? geometry.parameters.shapes[0]
    : geometry.parameters.shapes;

  return shape.extractPoints(12).shape.length;
}
