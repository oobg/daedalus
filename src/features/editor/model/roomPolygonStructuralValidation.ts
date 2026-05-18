import {
  validateMinimumRoomPolygonVertices,
  type RoomPolygonVertexPoint,
} from './roomPolygonMinimumVertexValidation.ts';

export interface RoomPolygonStructuralPoint extends RoomPolygonVertexPoint {}

export type RoomPolygonStructuralValidationError =
  | 'polygon_requires_three_points'
  | 'polygon_points_must_be_finite'
  | 'polygon_must_be_closed'
  | 'polygon_requires_three_distinct_vertices';

export type RoomPolygonStructuralValidationResult =
  | {
      readonly ok: true;
      readonly distinctVertexCount: number;
    }
  | {
      readonly ok: false;
      readonly error: RoomPolygonStructuralValidationError;
    };

const pointsMatch = (
  left: RoomPolygonStructuralPoint,
  right: RoomPolygonStructuralPoint,
): boolean => left.x === right.x && left.y === right.y;

export const isClosedRoomPolygon = (
  points: readonly RoomPolygonStructuralPoint[],
): boolean =>
  points.length > 1 && pointsMatch(points[0], points[points.length - 1]);

export const validateRoomPolygonStructure = (
  points: readonly RoomPolygonStructuralPoint[],
): RoomPolygonStructuralValidationResult => {
  if (points.length < 4) {
    return {
      ok: false,
      error: 'polygon_requires_three_points',
    };
  }

  if (
    points.some(
      (point) => !Number.isFinite(point.x) || !Number.isFinite(point.y),
    )
  ) {
    return {
      ok: false,
      error: 'polygon_points_must_be_finite',
    };
  }

  if (!isClosedRoomPolygon(points)) {
    return {
      ok: false,
      error: 'polygon_must_be_closed',
    };
  }

  const minimumVertexValidation = validateMinimumRoomPolygonVertices(points);

  if (!minimumVertexValidation.ok) {
    return {
      ok: false,
      error: minimumVertexValidation.error,
    };
  }

  return {
    ok: true,
    distinctVertexCount: minimumVertexValidation.distinctVertexCount,
  };
};
