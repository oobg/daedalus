import type { EditorPoint, RoomOpening } from '../../../domain/editor-state.ts';

export interface RoomGeometryHandleRoom {
  readonly roomId: string;
  readonly roomPolygon: readonly EditorPoint[];
}

export interface RoomGeometryMovableRoom extends RoomGeometryHandleRoom {
  readonly openings?: readonly RoomOpening[];
}

export interface RoomGeometryHandle {
  readonly id: string;
  readonly roomId: string;
  readonly vertexIndex: number;
  readonly position: EditorPoint;
}

export interface RoomGeometryEdgeHandle {
  readonly id: string;
  readonly roomId: string;
  readonly edgeIndex: number;
  readonly position: EditorPoint;
}

export interface RoomGeometrySelectionBounds {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface SelectedRoomGeometrySelection {
  readonly roomId: string;
  readonly polygonPoints: EditorPoint[];
  readonly bounds: RoomGeometrySelectionBounds;
  readonly vertexHandles: RoomGeometryHandle[];
  readonly edgeHandles: RoomGeometryEdgeHandle[];
}

export interface TranslatedRoomGeometrySource {
  readonly roomPolygon: EditorPoint[];
  readonly openings: RoomOpening[];
}

export interface RoomGeometryHandleState<
  Room extends RoomGeometryHandleRoom = RoomGeometryHandleRoom,
> {
  readonly rooms: readonly Room[];
  readonly selectedRoomId: string | null;
}

export const getSelectedRoomGeometrySelectionState = <
  Room extends RoomGeometryHandleRoom,
>(
  state: RoomGeometryHandleState<Room>,
): SelectedRoomGeometrySelection | null => {
  if (state.selectedRoomId === null) {
    return null;
  }

  const selectedRoom = state.rooms.find(
    (room) => room.roomId === state.selectedRoomId,
  );

  if (selectedRoom == null) {
    return null;
  }

  const polygonPoints = selectedRoom.roomPolygon.map((point) => ({
    x: point.x,
    y: point.y,
  }));
  const vertexHandles = polygonPoints.map((point, vertexIndex) => ({
    id: `${selectedRoom.roomId}:vertex:${vertexIndex}`,
    roomId: selectedRoom.roomId,
    vertexIndex,
    position: {
      x: point.x,
      y: point.y,
    },
  }));
  const edgeHandles = polygonPoints.map((_, edgeIndex) => ({
    id: `${selectedRoom.roomId}:edge-insert:${edgeIndex}`,
    roomId: selectedRoom.roomId,
    edgeIndex,
    position: getEdgeMidpoint(polygonPoints, edgeIndex),
  }));

  return {
    roomId: selectedRoom.roomId,
    polygonPoints,
    bounds: getPolygonBounds(polygonPoints),
    vertexHandles,
    edgeHandles,
  };
};

export const getSelectedRoomGeometryHandles = <
  Room extends RoomGeometryHandleRoom,
>(
  state: RoomGeometryHandleState<Room>,
): RoomGeometryHandle[] => {
  return getSelectedRoomGeometrySelectionState(state)?.vertexHandles ?? [];
};

export const moveRoomGeometryHandleVertex = <
  Room extends RoomGeometryHandleRoom,
>(
  room: Room,
  handle: RoomGeometryHandle,
  nextPosition: EditorPoint,
): EditorPoint[] | null => {
  if (room.roomId !== handle.roomId) {
    return null;
  }

  if (
    handle.vertexIndex < 0 ||
    handle.vertexIndex >= room.roomPolygon.length
  ) {
    return null;
  }

  return room.roomPolygon.map((point, index) =>
    index === handle.vertexIndex
      ? {
          x: nextPosition.x,
          y: nextPosition.y,
        }
      : {
          x: point.x,
          y: point.y,
    },
  );
};

export const moveRoomGeometryPolygon = <
  Room extends RoomGeometryHandleRoom,
>(
  room: Room,
  delta: EditorPoint,
): EditorPoint[] | null => {
  if (!Number.isFinite(delta.x) || !Number.isFinite(delta.y)) {
    return null;
  }

  if (delta.x === 0 && delta.y === 0) {
    return room.roomPolygon.map((point) => ({
      x: point.x,
      y: point.y,
    }));
  }

  return room.roomPolygon.map((point) => ({
    x: point.x + delta.x,
    y: point.y + delta.y,
  }));
};

export const translateRoomGeometrySource = <
  Room extends RoomGeometryMovableRoom,
>(
  room: Room,
  delta: EditorPoint,
): TranslatedRoomGeometrySource | null => {
  const roomPolygon = moveRoomGeometryPolygon(room, delta);

  if (roomPolygon === null) {
    return null;
  }

  return {
    roomPolygon,
    openings: (room.openings ?? []).map((opening) => ({
      ...opening,
      x: opening.x + delta.x,
      y: opening.y + delta.y,
    })),
  };
};

export const insertRoomGeometryEdgeVertex = <
  Room extends RoomGeometryHandleRoom,
>(
  room: Room,
  edgeIndex: number,
  position: EditorPoint,
): EditorPoint[] | null => {
  if (edgeIndex < 0 || edgeIndex >= room.roomPolygon.length) {
    return null;
  }

  const insertionIndex = edgeIndex + 1;

  return [
    ...room.roomPolygon.slice(0, insertionIndex),
    {
      x: position.x,
      y: position.y,
    },
    ...room.roomPolygon.slice(insertionIndex),
  ];
};

export const removeRoomGeometryHandleVertex = <
  Room extends RoomGeometryHandleRoom,
>(
  room: Room,
  handle: RoomGeometryHandle,
): EditorPoint[] | null => {
  if (room.roomId !== handle.roomId) {
    return null;
  }

  if (
    handle.vertexIndex < 0 ||
    handle.vertexIndex >= room.roomPolygon.length ||
    room.roomPolygon.length <= 3
  ) {
    return null;
  }

  return room.roomPolygon
    .filter((_, index) => index !== handle.vertexIndex)
    .map((point) => ({
      x: point.x,
      y: point.y,
    }));
};

const getEdgeMidpoint = (
  points: readonly EditorPoint[],
  edgeIndex: number,
): EditorPoint => {
  const start = points[edgeIndex];
  const end = points[(edgeIndex + 1) % points.length];

  return {
    x: (start.x + end.x) / 2,
    y: (start.y + end.y) / 2,
  };
};

const getPolygonBounds = (
  points: readonly EditorPoint[],
): RoomGeometrySelectionBounds => {
  if (points.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  const bounds = points.reduce(
    (nextBounds, point) => ({
      minX: Math.min(nextBounds.minX, point.x),
      minY: Math.min(nextBounds.minY, point.y),
      maxX: Math.max(nextBounds.maxX, point.x),
      maxY: Math.max(nextBounds.maxY, point.y),
    }),
    {
      minX: points[0].x,
      minY: points[0].y,
      maxX: points[0].x,
      maxY: points[0].y,
    },
  );

  return {
    x: bounds.minX,
    y: bounds.minY,
    width: bounds.maxX - bounds.minX,
    height: bounds.maxY - bounds.minY,
  };
};
