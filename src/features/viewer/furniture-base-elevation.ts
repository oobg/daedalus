import { DEFAULT_WALL_BASE_OFFSET } from "../../components/viewer/viewer25dGeometry.ts";

export const DEFAULT_FURNITURE_LAYER_OFFSET = DEFAULT_WALL_BASE_OFFSET;

export interface FurnitureBaseElevationOptions {
  layerOffset?: number;
}

export function resolveFurnitureBaseElevation(
  floorElevation: number,
  options: FurnitureBaseElevationOptions = {},
): number {
  return floorElevation + (options.layerOffset ?? DEFAULT_FURNITURE_LAYER_OFFSET);
}
