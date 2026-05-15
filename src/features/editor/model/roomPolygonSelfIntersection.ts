export interface PolygonPoint2D {
  readonly x: number;
  readonly y: number;
}

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
    point.x >= minX &&
    point.x <= maxX &&
    point.y >= minY &&
    point.y <= maxY
  );
};

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
