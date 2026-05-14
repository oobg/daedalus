export const DEFAULT_WALL_HEIGHT_SCALE = 0.3;
export const DEFAULT_WALL_THICKNESS = 0.045;
export const DEFAULT_FLOOR_BASE_OFFSET_RATIO = 0.35;
export const DEFAULT_FLOOR_BASE_OFFSET_MIN = 0.012;
export const DEFAULT_FLOOR_PERIMETER_INSET_RATIO = 0.22;
export const DEFAULT_FLOOR_PERIMETER_INSET_MIN = 0.008;

const PARALLEL_LINE_EPSILON = 1e-6;
const COORDINATE_PRECISION = 1e6;

export interface Viewer25DPoint2D {
  x: number;
  y: number;
}

export interface Viewer25DGeometryConfig {
  wallThickness?: number;
  floorBaseOffsetRatio?: number;
  minimumFloorBaseOffset?: number;
  floorPerimeterInsetRatio?: number;
  minimumFloorPerimeterInset?: number;
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

export function resolveFloorPerimeterInset(
  config: Viewer25DGeometryConfig = {},
): number {
  const wallThickness = config.wallThickness ?? DEFAULT_WALL_THICKNESS;
  const floorPerimeterInsetRatio =
    config.floorPerimeterInsetRatio ?? DEFAULT_FLOOR_PERIMETER_INSET_RATIO;
  const minimumFloorPerimeterInset =
    config.minimumFloorPerimeterInset ?? DEFAULT_FLOOR_PERIMETER_INSET_MIN;

  return Math.max(
    wallThickness * floorPerimeterInsetRatio,
    minimumFloorPerimeterInset,
  );
}

function computeSignedArea(points: readonly Viewer25DPoint2D[]): number {
  let area = 0;

  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    area += current.x * next.y - next.x * current.y;
  }

  return area / 2;
}

function intersectOffsetLines(
  pointA: Viewer25DPoint2D,
  directionA: Viewer25DPoint2D,
  pointB: Viewer25DPoint2D,
  directionB: Viewer25DPoint2D,
): Viewer25DPoint2D | null {
  const denominator =
    directionA.x * directionB.y - directionA.y * directionB.x;

  if (Math.abs(denominator) <= PARALLEL_LINE_EPSILON) {
    return null;
  }

  const pointDelta = {
    x: pointB.x - pointA.x,
    y: pointB.y - pointA.y,
  };
  const t =
    (pointDelta.x * directionB.y - pointDelta.y * directionB.x) / denominator;

  return {
    x: pointA.x + directionA.x * t,
    y: pointA.y + directionA.y * t,
  };
}

export function createInsetPolygon(
  points: readonly Viewer25DPoint2D[],
  inset: number,
): Viewer25DPoint2D[] {
  if (points.length < 3 || inset <= 0) {
    return [...points];
  }

  const signedArea = computeSignedArea(points);

  if (Math.abs(signedArea) <= PARALLEL_LINE_EPSILON) {
    return [...points];
  }

  const winding = signedArea > 0 ? 1 : -1;

  const insetPolygon = points.map((current, index) => {
    const previous = points[(index - 1 + points.length) % points.length];
    const next = points[(index + 1) % points.length];
    const previousDirection = {
      x: current.x - previous.x,
      y: current.y - previous.y,
    };
    const nextDirection = {
      x: next.x - current.x,
      y: next.y - current.y,
    };
    const previousLength = Math.hypot(
      previousDirection.x,
      previousDirection.y,
    );
    const nextLength = Math.hypot(nextDirection.x, nextDirection.y);

    if (
      previousLength <= PARALLEL_LINE_EPSILON ||
      nextLength <= PARALLEL_LINE_EPSILON
    ) {
      return current;
    }

    const previousOffsetPoint = {
      x:
        current.x +
        ((-previousDirection.y / previousLength) * inset * winding),
      y:
        current.y +
        ((previousDirection.x / previousLength) * inset * winding),
    };
    const nextOffsetPoint = {
      x: current.x + ((-nextDirection.y / nextLength) * inset * winding),
      y: current.y + ((nextDirection.x / nextLength) * inset * winding),
    };

    const intersection =
      intersectOffsetLines(
        previousOffsetPoint,
        previousDirection,
        nextOffsetPoint,
        nextDirection,
      ) ?? nextOffsetPoint;

    return {
      x: roundCoordinate(intersection.x),
      y: roundCoordinate(intersection.y),
    };
  });

  const insetArea = computeSignedArea(insetPolygon);

  if (Math.abs(insetArea) <= PARALLEL_LINE_EPSILON || insetArea * signedArea <= 0) {
    return [...points];
  }

  return insetPolygon;
}
function roundCoordinate(value: number): number {
  return Math.round(value * COORDINATE_PRECISION) / COORDINATE_PRECISION;
}
