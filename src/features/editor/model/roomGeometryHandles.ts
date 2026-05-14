import type { EditorPoint } from '../../../domain/editor-state.ts';

export interface RoomGeometryHandleRoom {
  readonly roomId: string;
  readonly roomPolygon: readonly EditorPoint[];
}

export interface RoomGeometryHandle {
  readonly id: string;
  readonly roomId: string;
  readonly vertexIndex: number;
  readonly position: EditorPoint;
}

export interface RoomGeometryHandleState<
  Room extends RoomGeometryHandleRoom = RoomGeometryHandleRoom,
> {
  readonly rooms: readonly Room[];
  readonly selectedRoomId: string | null;
}

export const getSelectedRoomGeometryHandles = <
  Room extends RoomGeometryHandleRoom,
>(
  state: RoomGeometryHandleState<Room>,
): RoomGeometryHandle[] => {
  if (state.selectedRoomId === null) {
    return [];
  }

  const selectedRoom = state.rooms.find(
    (room) => room.roomId === state.selectedRoomId,
  );

  if (selectedRoom == null) {
    return [];
  }

  return selectedRoom.roomPolygon.map((point, vertexIndex) => ({
    id: `${selectedRoom.roomId}:vertex:${vertexIndex}`,
    roomId: selectedRoom.roomId,
    vertexIndex,
    position: {
      x: point.x,
      y: point.y,
    },
  }));
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
