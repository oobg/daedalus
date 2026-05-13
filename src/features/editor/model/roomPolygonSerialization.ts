import { normalizeRoomPolygonPoints } from './roomPolygonNormalization.ts';
import type { RoomPolygon } from './roomDraft.ts';

export interface SerializedRoomPolygonPoint {
  x: number;
  y: number;
}

export interface SerializedRoomPolygon {
  roomId: string;
  points: SerializedRoomPolygonPoint[];
}

const serializePoint = (
  point: SerializedRoomPolygonPoint,
): SerializedRoomPolygonPoint => ({
  x: point.x,
  y: point.y,
});

export const serializeRoomPolygon = (
  polygon: RoomPolygon,
): SerializedRoomPolygon => ({
  roomId: polygon.roomId,
  points: normalizeRoomPolygonPoints(polygon.points).map(serializePoint),
});
