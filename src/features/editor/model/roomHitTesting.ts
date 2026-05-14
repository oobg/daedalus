import type { EditorPoint } from '../../../domain/editor-state.ts';

export interface RoomHitTestRoom {
  readonly roomId: string;
  readonly roomPolygon: readonly EditorPoint[];
}

export interface RoomHitTestState<Room extends RoomHitTestRoom = RoomHitTestRoom> {
  readonly rooms: readonly Room[];
}

const DEFAULT_BOUNDARY_TOLERANCE = 0.001;

const pointIsOnSegment = (
  point: EditorPoint,
  start: EditorPoint,
  end: EditorPoint,
  tolerance: number,
): boolean => {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) {
    return Math.hypot(point.x - start.x, point.y - start.y) <= tolerance;
  }

  const cross = (point.x - start.x) * dy - (point.y - start.y) * dx;
  if (Math.abs(cross) > tolerance * Math.sqrt(lengthSquared)) {
    return false;
  }

  const dot = (point.x - start.x) * dx + (point.y - start.y) * dy;
  return dot >= -tolerance && dot <= lengthSquared + tolerance;
};

export const isPointInRoomPolygon = (
  point: EditorPoint,
  polygon: readonly EditorPoint[],
  boundaryTolerance = DEFAULT_BOUNDARY_TOLERANCE,
): boolean => {
  if (polygon.length < 3) {
    return false;
  }

  let inside = false;

  for (let currentIndex = 0, previousIndex = polygon.length - 1;
    currentIndex < polygon.length;
    previousIndex = currentIndex++
  ) {
    const current = polygon[currentIndex];
    const previous = polygon[previousIndex];

    if (pointIsOnSegment(point, previous, current, boundaryTolerance)) {
      return true;
    }

    const edgeCrossesHorizontalRay =
      (current.y > point.y) !== (previous.y > point.y);

    if (
      edgeCrossesHorizontalRay &&
      point.x < ((previous.x - current.x) * (point.y - current.y)) /
        (previous.y - current.y) + current.x
    ) {
      inside = !inside;
    }
  }

  return inside;
};

export const hitTestRoomPolygon = <Room extends RoomHitTestRoom>(
  state: RoomHitTestState<Room>,
  point: EditorPoint,
): Room | null => {
  for (let index = state.rooms.length - 1; index >= 0; index -= 1) {
    const room = state.rooms[index];

    if (isPointInRoomPolygon(point, room.roomPolygon)) {
      return room;
    }
  }

  return null;
};
