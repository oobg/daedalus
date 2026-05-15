import { roomPolygonHasSelfIntersection } from './roomPolygonSelfIntersection.ts';
import { validateMinimumRoomPolygonVertices } from './roomPolygonMinimumVertexValidation.ts';
import { validateRoomPolygonZeroArea } from './roomPolygonZeroAreaValidation.ts';

export interface Point2D {
  readonly x: number;
  readonly y: number;
}

export type RoomPolygonValidationError =
  | 'polygon_requires_three_points'
  | 'polygon_points_must_be_finite'
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

export interface RoomPolygonValidationFailure {
  readonly code: RoomPolygonValidationError;
  readonly message: string;
}

export type RoomPolygonOperationValidationResult =
  | {
      readonly ok: true;
    }
  | {
      readonly ok: false;
      readonly error: 'invalid_polygon';
      readonly validation: RoomPolygonValidationFailure;
    };

const pointsMatch = (left: Point2D, right: Point2D): boolean =>
  left.x === right.x && left.y === right.y;

export const hasSelfIntersection = (points: readonly Point2D[]): boolean =>
  roomPolygonHasSelfIntersection(points);

export const validateRoomPolygon = (
  points: readonly Point2D[],
): ValidateRoomPolygonResult => {
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

  if (!pointsMatch(points[0], points[points.length - 1])) {
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

  const zeroAreaValidation = validateRoomPolygonZeroArea(points);

  if (!zeroAreaValidation.ok) {
    return {
      ok: false,
      error: zeroAreaValidation.error,
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

export const getRoomPolygonValidationMessage = (
  error: RoomPolygonValidationError,
): string => {
  switch (error) {
    case 'polygon_requires_three_points':
      return 'A room polygon requires at least 3 points.';
    case 'polygon_points_must_be_finite':
      return 'A room polygon point must use finite x/y coordinates.';
    case 'polygon_must_be_closed':
      return 'A room polygon must be closed before room creation.';
    case 'polygon_requires_three_distinct_vertices':
      return 'A room polygon requires at least 3 distinct vertices.';
    case 'polygon_area_must_be_non_zero':
      return 'A room polygon must define a valid simple closed shape.';
    case 'polygon_self_intersects':
      return 'A room polygon must not self-intersect.';
  }
};

export const validateRoomPolygonForOperation = (
  points: readonly Point2D[],
): RoomPolygonOperationValidationResult => {
  const validation = validateRoomPolygon(points);

  if (validation.ok) {
    return validation;
  }

  return {
    ok: false,
    error: 'invalid_polygon',
    validation: {
      code: validation.error,
      message: getRoomPolygonValidationMessage(validation.error),
    },
  };
};
