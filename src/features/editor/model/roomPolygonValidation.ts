export interface Point2D {
  readonly x: number;
  readonly y: number;
}

export type RoomPolygonValidationError =
  | 'polygon_requires_three_points'
  | 'polygon_must_be_closed'
  | 'polygon_requires_three_distinct_vertices'
  | 'polygon_area_must_be_non_zero'
  | 'polygon_self_intersects';

export type ValidateRoomPolygonResult =
  | {
      readonly ok: true;
    }
  | {
      readonly ok: false;
      readonly error: RoomPolygonValidationError;
    };

const pointsMatch = (left: Point2D, right: Point2D): boolean =>
  left.x === right.x && left.y === right.y;

const countDistinctPoints = (points: readonly Point2D[]): number =>
  new Set(points.map((point) => `${point.x},${point.y}`)).size;

const crossProduct = (
  origin: Point2D,
  left: Point2D,
  right: Point2D,
): number =>
  (left.x - origin.x) * (right.y - origin.y) -
  (left.y - origin.y) * (right.x - origin.x);

const polygonArea = (points: readonly Point2D[]): number => {
  let area = 0;

  for (let index = 0; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    area += current.x * next.y - next.x * current.y;
  }

  return area / 2;
};

const isPointOnSegment = (
  point: Point2D,
  start: Point2D,
  end: Point2D,
): boolean => {
  const minX = Math.min(start.x, end.x);
  const maxX = Math.max(start.x, end.x);
  const minY = Math.min(start.y, end.y);
  const maxY = Math.max(start.y, end.y);

  return (
    point.x >= minX &&
    point.x <= maxX &&
    point.y >= minY &&
    point.y <= maxY
  );
};

const segmentsIntersect = (
  startA: Point2D,
  endA: Point2D,
  startB: Point2D,
  endB: Point2D,
): boolean => {
  const orientation1 = crossProduct(startA, endA, startB);
  const orientation2 = crossProduct(startA, endA, endB);
  const orientation3 = crossProduct(startB, endB, startA);
  const orientation4 = crossProduct(startB, endB, endA);

  if (
    ((orientation1 > 0 && orientation2 < 0) ||
      (orientation1 < 0 && orientation2 > 0)) &&
    ((orientation3 > 0 && orientation4 < 0) ||
      (orientation3 < 0 && orientation4 > 0))
  ) {
    return true;
  }

  if (orientation1 === 0 && isPointOnSegment(startB, startA, endA)) {
    return true;
  }

  if (orientation2 === 0 && isPointOnSegment(endB, startA, endA)) {
    return true;
  }

  if (orientation3 === 0 && isPointOnSegment(startA, startB, endB)) {
    return true;
  }

  if (orientation4 === 0 && isPointOnSegment(endA, startB, endB)) {
    return true;
  }

  return false;
};

export const hasSelfIntersection = (points: readonly Point2D[]): boolean => {
  const edgeCount = points.length - 1;

  for (let index = 0; index < edgeCount; index += 1) {
    const startA = points[index];
    const endA = points[index + 1];

    for (
      let compareIndex = index + 1;
      compareIndex < edgeCount;
      compareIndex += 1
    ) {
      const startB = points[compareIndex];
      const endB = points[compareIndex + 1];
      const areSameEdge = index === compareIndex;
      const areAdjacentEdges =
        Math.abs(index - compareIndex) === 1 ||
        (index === 0 && compareIndex === edgeCount - 1);

      if (areSameEdge || areAdjacentEdges) {
        continue;
      }

      if (segmentsIntersect(startA, endA, startB, endB)) {
        return true;
      }
    }
  }

  return false;
};

export const validateRoomPolygon = (
  points: readonly Point2D[],
): ValidateRoomPolygonResult => {
  if (points.length < 4) {
    return {
      ok: false,
      error: 'polygon_requires_three_points',
    };
  }

  if (!pointsMatch(points[0], points[points.length - 1])) {
    return {
      ok: false,
      error: 'polygon_must_be_closed',
    };
  }

  if (countDistinctPoints(points.slice(0, -1)) < 3) {
    return {
      ok: false,
      error: 'polygon_requires_three_distinct_vertices',
    };
  }

  if (polygonArea(points) === 0) {
    return {
      ok: false,
      error: 'polygon_area_must_be_non_zero',
    };
  }

  if (hasSelfIntersection(points)) {
    return {
      ok: false,
      error: 'polygon_self_intersects',
    };
  }

  return {
    ok: true,
  };
};
