import type { EditorPoint } from '../../../domain/editor-state.ts';

export interface RoomHitTestRoom {
  readonly roomId: string;
  readonly roomPolygon: readonly EditorPoint[];
}

export interface RoomHitTestState<Room extends RoomHitTestRoom = RoomHitTestRoom> {
  readonly rooms: readonly Room[];
}

export interface RoomHitTestResult<Room extends RoomHitTestRoom = RoomHitTestRoom> {
  readonly room: Room;
  readonly kind: 'contains' | 'nearest';
  readonly distance: number;
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

export const resolveRoomHitTest = <Room extends RoomHitTestRoom>(
  state: RoomHitTestState<Room>,
  point: EditorPoint,
): RoomHitTestResult<Room> | null => {
  const containingRoom = hitTestRoomPolygon(state, point);

  if (containingRoom !== null) {
    return {
      room: containingRoom,
      kind: 'contains',
      distance: 0,
    };
  }

  let nearestRoom: Room | null = null;
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (let index = state.rooms.length - 1; index >= 0; index -= 1) {
    const room = state.rooms[index];

    const distance = getDistanceToRoomPolygon(point, room.roomPolygon);

    if (distance <= nearestDistance) {
      nearestRoom = room;
      nearestDistance = distance;
    }
  }

  if (nearestRoom === null) {
    return null;
  }

  return {
    room: nearestRoom,
    kind: 'nearest',
    distance: nearestDistance,
  };
};

const getDistanceToRoomPolygon = (
  point: EditorPoint,
  polygon: readonly EditorPoint[],
): number => {
  if (polygon.length === 0) {
    return Number.POSITIVE_INFINITY;
  }

  if (polygon.length === 1) {
    return Math.hypot(point.x - polygon[0].x, point.y - polygon[0].y);
  }

  let nearestDistance = Number.POSITIVE_INFINITY;

  for (let currentIndex = 0; currentIndex < polygon.length; currentIndex += 1) {
    const start = polygon[currentIndex];
    const end = polygon[(currentIndex + 1) % polygon.length];
    const distance = getDistanceToSegment(point, start, end);

    if (distance < nearestDistance) {
      nearestDistance = distance;
    }
  }

  return nearestDistance;
};

const getDistanceToSegment = (
  point: EditorPoint,
  start: EditorPoint,
  end: EditorPoint,
): number => {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) {
    return Math.hypot(point.x - start.x, point.y - start.y);
  }

  const projection = (
    ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared
  );
  const clampedProjection = Math.min(1, Math.max(0, projection));
  const nearestPoint = {
    x: start.x + clampedProjection * dx,
    y: start.y + clampedProjection * dy,
  };

  return Math.hypot(point.x - nearestPoint.x, point.y - nearestPoint.y);
};
