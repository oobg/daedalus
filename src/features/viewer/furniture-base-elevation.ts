import { DEFAULT_WALL_BASE_OFFSET } from "../../components/viewer/viewer25dGeometry.ts";

export const DEFAULT_FURNITURE_LAYER_OFFSET = DEFAULT_WALL_BASE_OFFSET;

export interface FurnitureBaseElevationOptions {
  layerOffset?: number;
}

export interface FurnitureVerticalPlacementOptions
  extends FurnitureBaseElevationOptions {
  height: number;
}

export interface FurnitureVerticalPlacement {
  baseElevation: number;
  centerElevation: number;
  topElevation: number;
  height: number;
  layerOffset: number;
}

export function resolveFurnitureBaseElevation(
  floorElevation: number,
  options: FurnitureBaseElevationOptions = {},
): number {
  return floorElevation + (options.layerOffset ?? DEFAULT_FURNITURE_LAYER_OFFSET);
}

export function resolveFurnitureVerticalPlacement(
  floorElevation: number,
  options: FurnitureVerticalPlacementOptions,
): FurnitureVerticalPlacement {
  const layerOffset = options.layerOffset ?? DEFAULT_FURNITURE_LAYER_OFFSET;
  const baseElevation = resolveFurnitureBaseElevation(floorElevation, {
    layerOffset,
  });

  return {
    baseElevation: roundElevation(baseElevation),
    centerElevation: roundElevation(baseElevation + options.height / 2),
    topElevation: roundElevation(baseElevation + options.height),
    height: roundElevation(options.height),
    layerOffset: roundElevation(layerOffset),
  };
}

function roundElevation(value: number): number {
  return Math.round(value * 1e6) / 1e6;
}
