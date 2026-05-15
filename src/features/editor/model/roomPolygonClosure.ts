import type { Point2D } from './roomPolygonValidation.ts';

const pointsMatch = (left: Point2D, right: Point2D): boolean =>
  left.x === right.x && left.y === right.y;

export const closeRoomOutline = <Point extends Point2D>(
  points: readonly Point[],
): Point[] => {
  if (points.length === 0) {
    return [];
  }

  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];

  if (pointsMatch(firstPoint, lastPoint)) {
    return [...points];
  }

  return [...points, firstPoint];
};
