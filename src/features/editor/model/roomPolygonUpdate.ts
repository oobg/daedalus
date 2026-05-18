import {
  collectRoomDraftPoints,
  deleteRoomPolygonVertex,
  finalizeRoomDraftPolygon,
  insertRoomPolygonVertex,
  insertRoomPolygonEdgeVertex,
  moveRoomPolygonEdge,
  moveRoomPolygonVertex,
  type DeleteRoomPolygonVertexResult,
  type DraftPoint,
  type InsertRoomPolygonEdgeVertexResult,
  type InsertRoomPolygonVertexResult,
  type MoveRoomPolygonEdgeResult,
  type MoveRoomPolygonVertexResult,
  type RoomPolygon,
} from './roomDraft.ts';
import { calculatePolygonArea } from '../../../domain/editor-state.ts';
import {
  deriveRoomLabel,
  type DerivedRoomLabel,
} from './roomLabelDerivation.ts';

export interface RoomPolygonEditorRoom {
  readonly id: string;
  readonly polygon: RoomPolygon;
  readonly area?: number;
  readonly labelPosition?: DerivedRoomLabel['position'];
}

export interface RoomPolygonUpdateState<
  Room extends RoomPolygonEditorRoom = RoomPolygonEditorRoom,
> {
  readonly rooms: readonly Room[];
  readonly activeRoomId: string | null;
}

export interface UpdateActiveRoomPolygonResult<
  Room extends RoomPolygonEditorRoom = RoomPolygonEditorRoom,
> {
  readonly state: RoomPolygonUpdateState<Room>;
  readonly room: Room;
}

export interface CreateRoomPolygonResult {
  readonly polygon: RoomPolygon;
}

export type EditActiveRoomPolygonResult<
  Room extends RoomPolygonEditorRoom,
  GeometryResult,
> =
  | ({
      readonly ok: true;
      readonly geometry: GeometryResult;
    } & UpdateActiveRoomPolygonResult<Room>)
  | ({
      readonly ok: false;
      readonly error: GeometryResult extends { readonly error: infer ErrorCode }
        ? ErrorCode
        : never;
    } & (GeometryResult extends { readonly validation?: infer Validation }
      ? {
          readonly validation?: Validation;
        }
      : {}));

export const createRoomPolygon = (
  roomId: string,
  points: readonly DraftPoint[],
): CreateRoomPolygonResult => ({
  polygon: finalizeRoomDraftPolygon(collectRoomDraftPoints(roomId, points)),
});

export const updateActiveRoomPolygon = <Room extends RoomPolygonEditorRoom>(
  state: RoomPolygonUpdateState<Room>,
  transform: (polygon: RoomPolygon) => RoomPolygon,
): UpdateActiveRoomPolygonResult<Room> => {
  if (state.activeRoomId === null) {
    throw new Error('An active room must be selected before updating its polygon.');
  }

  let updatedRoom: Room | null = null;

  const rooms = state.rooms.map((room) => {
    if (room.id !== state.activeRoomId) {
      return room;
    }

    const nextPolygon = transform(room.polygon);

    if (nextPolygon === room.polygon) {
      updatedRoom = room;
      return room;
    }

    const nextRoom = deriveUpdatedRoom(room, nextPolygon);

    updatedRoom = nextRoom;
    return nextRoom;
  });

  if (updatedRoom === null) {
    throw new Error(`Room "${state.activeRoomId}" was not found.`);
  }

  return {
    state: {
      rooms,
      activeRoomId: state.activeRoomId,
    },
    room: updatedRoom,
  };
};

const deriveUpdatedRoom = <Room extends RoomPolygonEditorRoom>(
  room: Room,
  polygon: RoomPolygon,
): Room => {
  const nextRoom = {
    ...room,
    polygon,
  } as Room;

  const nextLabel = deriveRoomLabel(polygon);

  if (typeof room.area !== 'number') {
    if (room.labelPosition === undefined) {
      return nextRoom;
    }

    return {
      ...nextRoom,
      labelPosition: nextLabel.position,
    };
  }

  const nextRoomWithArea = {
    ...nextRoom,
    area: calculatePolygonArea(polygon.points),
  };

  if (room.labelPosition === undefined) {
    return nextRoomWithArea;
  }

  return {
    ...nextRoomWithArea,
    labelPosition: nextLabel.position,
  };
};

const editActiveRoomPolygon = <
  Room extends RoomPolygonEditorRoom,
  GeometryResult extends
    | MoveRoomPolygonEdgeResult
    | MoveRoomPolygonVertexResult
    | InsertRoomPolygonEdgeVertexResult
    | InsertRoomPolygonVertexResult
    | DeleteRoomPolygonVertexResult,
>(
  state: RoomPolygonUpdateState<Room>,
  mutate: (polygon: RoomPolygon) => GeometryResult,
): EditActiveRoomPolygonResult<Room, GeometryResult> => {
  let geometryResult: GeometryResult | null = null;

  const updated = updateActiveRoomPolygon(state, (polygon) => {
    const nextGeometry = mutate(polygon);
    geometryResult = nextGeometry;
    return nextGeometry.ok ? (nextGeometry.polygon ?? polygon) : polygon;
  });

  if (geometryResult === null) {
    throw new Error('Room polygon edit did not return a geometry result.');
  }

  const result = geometryResult as GeometryResult;

  if (!result.ok) {
    return {
      ok: false,
      error: result.error,
      ...('validation' in result && result.validation !== undefined
        ? {
            validation: result.validation,
          }
        : {}),
    } as EditActiveRoomPolygonResult<Room, GeometryResult>;
  }

  return {
    ok: true,
    state: updated.state,
    room: updated.room,
    geometry: result,
  };
};

export const moveActiveRoomPolygonVertex = <
  Room extends RoomPolygonEditorRoom,
>(
  state: RoomPolygonUpdateState<Room>,
  vertexIndex: number,
  nextPoint: DraftPoint,
): EditActiveRoomPolygonResult<Room, MoveRoomPolygonVertexResult> =>
  editActiveRoomPolygon(state, (polygon) =>
    moveRoomPolygonVertex(polygon, vertexIndex, nextPoint),
  );

export const moveActiveRoomPolygonEdge = <
  Room extends RoomPolygonEditorRoom,
>(
  state: RoomPolygonUpdateState<Room>,
  edgeIndex: number,
  delta: DraftPoint,
): EditActiveRoomPolygonResult<Room, MoveRoomPolygonEdgeResult> =>
  editActiveRoomPolygon(state, (polygon) =>
    moveRoomPolygonEdge(polygon, edgeIndex, delta),
  );

export const insertActiveRoomPolygonVertex = <
  Room extends RoomPolygonEditorRoom,
>(
  state: RoomPolygonUpdateState<Room>,
  vertexIndex: number,
  nextPoint: DraftPoint,
): EditActiveRoomPolygonResult<Room, InsertRoomPolygonVertexResult> =>
  editActiveRoomPolygon(state, (polygon) =>
    insertRoomPolygonVertex(polygon, vertexIndex, nextPoint),
  );

export const insertActiveRoomPolygonEdgeVertex = <
  Room extends RoomPolygonEditorRoom,
>(
  state: RoomPolygonUpdateState<Room>,
  edgeIndex: number,
  nextPoint: DraftPoint,
): EditActiveRoomPolygonResult<Room, InsertRoomPolygonEdgeVertexResult> =>
  editActiveRoomPolygon(state, (polygon) =>
    insertRoomPolygonEdgeVertex(polygon, edgeIndex, nextPoint),
  );

export const deleteActiveRoomPolygonVertex = <
  Room extends RoomPolygonEditorRoom,
>(
  state: RoomPolygonUpdateState<Room>,
  vertexIndex: number,
): EditActiveRoomPolygonResult<Room, DeleteRoomPolygonVertexResult> =>
  editActiveRoomPolygon(state, (polygon) =>
    deleteRoomPolygonVertex(polygon, vertexIndex),
  );
