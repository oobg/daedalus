import type { EditorPoint } from '../../../domain/editor-state.ts';
import {
  moveRoomGeometryHandleVertex,
  type RoomGeometryHandle,
  type RoomGeometryHandleRoom,
} from './roomGeometryHandles.ts';

export interface RoomPolygonVertexDragRoom extends RoomGeometryHandleRoom {}

export interface RoomPolygonVertexDragSession {
  readonly floorId: string;
  readonly roomId: string;
  readonly handle: RoomGeometryHandle;
  readonly originPolygon: EditorPoint[];
  readonly pointerDownPoint: EditorPoint;
  readonly pointerCurrentPoint: EditorPoint;
  readonly committedPoint: EditorPoint;
}

export interface RoomPolygonVertexDragState {
  readonly activeTool: string;
  readonly activeFloorId: string | null;
  readonly selectedRoom: RoomPolygonVertexDragRoom | null;
  readonly dragSession: RoomPolygonVertexDragSession | null;
}

export interface RoomPolygonVertexDragUpdate {
  readonly floorId: string;
  readonly roomId: string;
  readonly roomPolygon: EditorPoint[];
}

export interface RoomPolygonVertexDragResult {
  readonly handled: boolean;
  readonly state: RoomPolygonVertexDragState;
  readonly roomUpdate?: RoomPolygonVertexDragUpdate;
  readonly error?:
    | 'drag_unavailable'
    | 'invalid_point'
    | 'invalid_move';
}

const clonePoint = (point: EditorPoint): EditorPoint => ({
  x: point.x,
  y: point.y,
});

const clonePolygon = (points: readonly EditorPoint[]): EditorPoint[] =>
  points.map(clonePoint);

const isFinitePoint = (point: EditorPoint): boolean =>
  Number.isFinite(point.x) && Number.isFinite(point.y);

const buildRoomUpdate = (
  session: RoomPolygonVertexDragSession,
  point: EditorPoint,
): RoomPolygonVertexDragUpdate | null => {
  const roomPolygon = moveRoomGeometryHandleVertex(
    {
      roomId: session.roomId,
      roomPolygon: session.originPolygon,
    },
    session.handle,
    point,
  );

  if (roomPolygon === null) {
    return null;
  }

  return {
    floorId: session.floorId,
    roomId: session.roomId,
    roomPolygon,
  };
};

export const beginRoomPolygonVertexDragging = (
  state: RoomPolygonVertexDragState,
  handle: RoomGeometryHandle,
  point: EditorPoint,
): RoomPolygonVertexDragResult => {
  if (
    state.activeTool !== 'select' ||
    state.activeFloorId === null ||
    state.selectedRoom === null ||
    state.selectedRoom.roomId !== handle.roomId
  ) {
    return {
      handled: false,
      state,
      error: 'drag_unavailable',
    };
  }

  if (!isFinitePoint(point)) {
    return {
      handled: true,
      state,
      error: 'invalid_point',
    };
  }

  return {
    handled: true,
    state: {
      ...state,
      dragSession: {
        floorId: state.activeFloorId,
        roomId: state.selectedRoom.roomId,
        handle,
        originPolygon: clonePolygon(state.selectedRoom.roomPolygon),
        pointerDownPoint: clonePoint(point),
        pointerCurrentPoint: clonePoint(point),
        committedPoint: clonePoint(handle.position),
      },
    },
  };
};

export const updateRoomPolygonVertexDragging = (
  state: RoomPolygonVertexDragState,
  point: EditorPoint,
): RoomPolygonVertexDragResult => {
  if (state.dragSession === null) {
    return {
      handled: false,
      state,
      error: 'drag_unavailable',
    };
  }

  if (!isFinitePoint(point)) {
    return {
      handled: true,
      state,
      error: 'invalid_point',
    };
  }

  const roomUpdate = buildRoomUpdate(state.dragSession, point);

  if (roomUpdate === null) {
    return {
      handled: true,
      state: {
        ...state,
        dragSession: {
          ...state.dragSession,
          pointerCurrentPoint: clonePoint(point),
        },
      },
      error: 'invalid_move',
    };
  }

  return {
    handled: true,
    roomUpdate,
    state: {
      ...state,
      dragSession: {
        ...state.dragSession,
        pointerCurrentPoint: clonePoint(point),
        committedPoint: clonePoint(point),
      },
    },
  };
};

export const completeRoomPolygonVertexDragging = (
  state: RoomPolygonVertexDragState,
  point: EditorPoint,
): RoomPolygonVertexDragResult => {
  if (state.dragSession === null) {
    return {
      handled: false,
      state,
      error: 'drag_unavailable',
    };
  }

  const update = updateRoomPolygonVertexDragging(state, point);

  return {
    ...update,
    state: {
      ...update.state,
      dragSession: null,
    },
  };
};
