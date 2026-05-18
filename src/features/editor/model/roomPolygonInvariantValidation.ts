import {
  validateAcceptedRoomPolygon,
} from './roomPolygonAcceptance.ts';
import type {
  Point2D,
  RoomPolygonOperationValidationResult,
} from './roomPolygonValidation.ts';

export type RoomPolygonVertexEditInvariantResult =
  RoomPolygonOperationValidationResult;

export const validateRoomPolygonVertexEditInvariant = (
  points: readonly Point2D[],
): RoomPolygonVertexEditInvariantResult =>
  validateAcceptedRoomPolygon(points);
