import type { Viewer25DPoint2D } from "../../components/viewer/viewer25dGeometry.ts";
import {
  createWallMeshAssembly,
  type WallMeshAssembly,
  type WallMeshAssemblyOptions,
} from "./wall-mesh-assembly.ts";

const DEFAULT_EXTERIOR_WALL_CURVE_SEGMENTS = 7;
const DEFAULT_EXTERIOR_WALL_CORNER_SEGMENTS = 4;

export interface ExteriorWallMeshInput {
  height: number;
  baseOffset?: number;
  thickness?: number;
  topEdgeRadius?: number;
}

export function getExteriorWallMeshOptions(
  input: ExteriorWallMeshInput,
): Readonly<WallMeshAssemblyOptions> {
  return Object.freeze({
    baseOffset: input.baseOffset ?? 0,
    curveSegments: DEFAULT_EXTERIOR_WALL_CURVE_SEGMENTS,
    height: input.height,
    minimumWallCornerRadius: Math.max(input.thickness ?? 0, 0.22),
    thickness: input.thickness ?? 0.072,
    topEdgeRadius: input.topEdgeRadius ?? 0.018,
    wallCornerRadiusRatio: 4,
    wallCornerSegments: DEFAULT_EXTERIOR_WALL_CORNER_SEGMENTS,
    wallCornerStyle: "rounded",
  });
}

export function createExteriorWallMeshAssembly(
  points: readonly Viewer25DPoint2D[],
  input: ExteriorWallMeshInput,
): WallMeshAssembly {
  return createWallMeshAssembly(points, getExteriorWallMeshOptions(input));
}
