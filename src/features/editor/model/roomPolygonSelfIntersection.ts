export interface PolygonPoint2D {
  readonly x: number;
  readonly y: number;
}

const GEOMETRY_EPSILON = 1e-9;

const crossProduct = (
  origin: PolygonPoint2D,
  left: PolygonPoint2D,
  right: PolygonPoint2D,
): number =>
  (left.x - origin.x) * (right.y - origin.y) -
  (left.y - origin.y) * (right.x - origin.x);

const isPointOnSegment = (
  point: PolygonPoint2D,
  start: PolygonPoint2D,
  end: PolygonPoint2D,
): boolean => {
  const minX = Math.min(start.x, end.x);
  const maxX = Math.max(start.x, end.x);
  const minY = Math.min(start.y, end.y);
  const maxY = Math.max(start.y, end.y);

  return (
    point.x >= minX - GEOMETRY_EPSILON &&
    point.x <= maxX + GEOMETRY_EPSILON &&
    point.y >= minY - GEOMETRY_EPSILON &&
    point.y <= maxY + GEOMETRY_EPSILON
  );
};

const isZero = (value: number): boolean => Math.abs(value) <= GEOMETRY_EPSILON;

const segmentsIntersect = (
  startA: PolygonPoint2D,
  endA: PolygonPoint2D,
  startB: PolygonPoint2D,
  endB: PolygonPoint2D,
): boolean => {
  const orientation1 = crossProduct(startA, endA, startB);
  const orientation2 = crossProduct(startA, endA, endB);
  const orientation3 = crossProduct(startB, endB, startA);
  const orientation4 = crossProduct(startB, endB, endA);

  if (
    ((orientation1 > GEOMETRY_EPSILON && orientation2 < -GEOMETRY_EPSILON) ||
      (orientation1 < -GEOMETRY_EPSILON && orientation2 > GEOMETRY_EPSILON)) &&
    ((orientation3 > GEOMETRY_EPSILON && orientation4 < -GEOMETRY_EPSILON) ||
      (orientation3 < -GEOMETRY_EPSILON && orientation4 > GEOMETRY_EPSILON))
  ) {
    return true;
  }

  if (isZero(orientation1) && isPointOnSegment(startB, startA, endA)) {
    return true;
  }

  if (isZero(orientation2) && isPointOnSegment(endB, startA, endA)) {
    return true;
  }

  if (isZero(orientation3) && isPointOnSegment(startA, startB, endB)) {
    return true;
  }

  if (isZero(orientation4) && isPointOnSegment(endA, startB, endB)) {
    return true;
  }

  return false;
};

export const roomPolygonHasSelfIntersection = (
  points: readonly PolygonPoint2D[],
): boolean => {
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
      const areAdjacentEdges =
        Math.abs(index - compareIndex) === 1 ||
        (index === 0 && compareIndex === edgeCount - 1);

      if (areAdjacentEdges) {
        continue;
      }

      if (segmentsIntersect(startA, endA, startB, endB)) {
        return true;
      }
    }
  }

  return false;
};
