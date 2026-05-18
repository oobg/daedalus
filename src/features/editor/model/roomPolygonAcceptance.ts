import { normalizeRoomPolygonInput } from './roomPolygonNormalization.ts';
import {
  getRoomPolygonValidationMessage,
  validateRoomPolygonForOperation,
  type Point2D,
  type RoomPolygonOperationValidationResult,
  type RoomPolygonValidationFailure,
} from './roomPolygonValidation.ts';

export type RoomPolygonAcceptanceResult<Point extends Point2D = Point2D> =
  | {
      readonly ok: true;
      readonly points: Point[];
    }
  | {
      readonly ok: false;
      readonly error: 'invalid_polygon';
      readonly validation: RoomPolygonValidationFailure;
    };

export const acceptRoomPolygon = <Point extends Point2D>(
  points: readonly Point[],
): RoomPolygonAcceptanceResult<Point> => {
  const normalized = normalizeRoomPolygonInput(points);

  if (!normalized.ok) {
    return {
      ok: false,
      error: 'invalid_polygon',
      validation: {
        code: normalized.error,
        message: getRoomPolygonValidationMessage(normalized.error),
      },
    };
  }

  const validation = validateRoomPolygonForOperation(normalized.points);

  if (!validation.ok) {
    return validation;
  }

  return {
    ok: true,
    points: normalized.points,
  };
};

export const validateAcceptedRoomPolygon = (
  points: readonly Point2D[],
): RoomPolygonOperationValidationResult => {
  const acceptance = acceptRoomPolygon(points);

  if (!acceptance.ok) {
    return acceptance;
  }

  return {
    ok: true,
  };
};
