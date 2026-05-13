import type { Point2D } from './roomPolygonValidation.ts';

const pointsMatch = (left: Point2D, right: Point2D): boolean =>
  left.x === right.x && left.y === right.y;

const comparePoints = (left: Point2D, right: Point2D): number => {
  if (left.y !== right.y) {
    return left.y - right.y;
  }

  return left.x - right.x;
};

const polygonSignedArea = (points: readonly Point2D[]): number => {
  let area = 0;

  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    area += current.x * next.y - next.x * current.y;
  }

  return area / 2;
};

const rotatePoints = <Point extends Point2D>(
  points: readonly Point[],
  startIndex: number,
): Point[] => [
  ...points.slice(startIndex),
  ...points.slice(0, startIndex),
];

export const normalizeRoomPolygonPoints = <Point extends Point2D>(
  points: readonly Point[],
): Point[] => {
  if (points.length === 0) {
    return [];
  }

  const openPoints =
    points.length > 1 && pointsMatch(points[0], points[points.length - 1])
      ? [...points.slice(0, -1)]
      : [...points];

  if (openPoints.length === 0) {
    return [];
  }

  const counterClockwisePoints =
    polygonSignedArea(openPoints) < 0 ? [...openPoints].reverse() : openPoints;

  let canonicalStartIndex = 0;

  for (let index = 1; index < counterClockwisePoints.length; index += 1) {
    if (
      comparePoints(
        counterClockwisePoints[index],
        counterClockwisePoints[canonicalStartIndex],
      ) < 0
    ) {
      canonicalStartIndex = index;
    }
  }

  const orderedPoints = rotatePoints(
    counterClockwisePoints,
    canonicalStartIndex,
  );

  return [...orderedPoints, orderedPoints[0]];
};
