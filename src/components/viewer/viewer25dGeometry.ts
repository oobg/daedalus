export const DEFAULT_WALL_HEIGHT_SCALE = 0.3;
export const DEFAULT_WALL_THICKNESS = 0.045;
export const DEFAULT_FLOOR_BASE_OFFSET_RATIO = 0.35;
export const DEFAULT_FLOOR_BASE_OFFSET_MIN = 0.012;

export interface Viewer25DGeometryConfig {
  wallThickness?: number;
  floorBaseOffsetRatio?: number;
  minimumFloorBaseOffset?: number;
}

export function resolveFloorBaseElevationOffset(
  config: Viewer25DGeometryConfig = {},
): number {
  const wallThickness = config.wallThickness ?? DEFAULT_WALL_THICKNESS;
  const floorBaseOffsetRatio =
    config.floorBaseOffsetRatio ?? DEFAULT_FLOOR_BASE_OFFSET_RATIO;
  const minimumFloorBaseOffset =
    config.minimumFloorBaseOffset ?? DEFAULT_FLOOR_BASE_OFFSET_MIN;

  return -Math.max(wallThickness * floorBaseOffsetRatio, minimumFloorBaseOffset);
}
