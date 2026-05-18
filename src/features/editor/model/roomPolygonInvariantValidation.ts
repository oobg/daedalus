import {
  validateRoomPolygonForOperation,
  type Point2D,
  type RoomPolygonOperationValidationResult,
} from './roomPolygonValidation.ts';

export type RoomPolygonVertexEditInvariantResult =
  RoomPolygonOperationValidationResult;

export const validateRoomPolygonVertexEditInvariant = (
  points: readonly Point2D[],
): RoomPolygonVertexEditInvariantResult =>
  validateRoomPolygonForOperation(points);
