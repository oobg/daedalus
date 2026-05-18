import { closeRoomOutline } from './roomPolygonClosure.ts';
import {
  validateRoomPolygon,
  type Point2D,
  type RoomPolygonValidationError,
} from './roomPolygonValidation.ts';

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

const toCanonicalRoomPolygonPoints = <Point extends Point2D>(
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

export type RoomPolygonNormalizationError = Exclude<
  RoomPolygonValidationError,
  'polygon_must_be_closed'
>;

export type NormalizeRoomPolygonResult<Point extends Point2D = Point2D> =
  | {
      readonly ok: true;
      readonly points: Point[];
    }
  | {
      readonly ok: false;
      readonly error: RoomPolygonNormalizationError;
    };

export const normalizeRoomPolygonInput = <Point extends Point2D>(
  points: readonly Point[],
): NormalizeRoomPolygonResult<Point> => {
  const closedPoints = closeRoomOutline(points);
  const validation = validateRoomPolygon(closedPoints);

  if (!validation.ok) {
    if (validation.error === 'polygon_must_be_closed') {
      throw new Error(
        'normalizeRoomPolygonInput received an unexpectedly open polygon after closure.',
      );
    }

    return {
      ok: false,
      error: validation.error,
    };
  }

  return {
    ok: true,
    points: toCanonicalRoomPolygonPoints(closedPoints),
  };
};

export const normalizeRoomPolygonPoints = <Point extends Point2D>(
  points: readonly Point[],
): Point[] => {
  const normalized = normalizeRoomPolygonInput(points);

  if (!normalized.ok) {
    throw new Error(
      `normalizeRoomPolygonPoints requires a valid polygon input. Received "${normalized.error}".`,
    );
  }

  return normalized.points;
};
