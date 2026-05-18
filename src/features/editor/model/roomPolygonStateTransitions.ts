import {
  addEditorRoom,
  updateEditorRoom,
  type EditorPoint,
  type EditorProject,
  type EditorRoom,
} from "../../../domain/editor-state.ts";

export interface CreateRoomPolygonStateInput {
  readonly project: EditorProject;
  readonly floorId: string;
  readonly roomId: string;
  readonly roomName: string;
  readonly roomPolygon: readonly EditorPoint[];
}

export interface UpdateRoomPolygonStateInput {
  readonly project: EditorProject;
  readonly floorId: string;
  readonly roomId: string;
  readonly roomPolygon: readonly EditorPoint[];
}

export type RoomPolygonStateTransitionResult =
  | {
      readonly ok: true;
      readonly project: EditorProject;
      readonly room: EditorRoom;
    }
  | {
      readonly ok: false;
      readonly error: "invalid_polygon";
    };

export const createRoomPolygonState = (
  input: CreateRoomPolygonStateInput,
): RoomPolygonStateTransitionResult => {
  try {
    const project = addEditorRoom(input.project, input.floorId, {
      roomId: input.roomId,
      roomName: input.roomName,
      roomPolygon: input.roomPolygon,
    });

    return {
      ok: true,
      project,
      room: getPersistedRoom(project, input.floorId, input.roomId),
    };
  } catch {
    return {
      ok: false,
      error: "invalid_polygon",
    };
  }
};

export const updateRoomPolygonState = (
  input: UpdateRoomPolygonStateInput,
): RoomPolygonStateTransitionResult => {
  try {
    const project = updateEditorRoom(
      input.project,
      input.floorId,
      input.roomId,
      {
        roomPolygon: input.roomPolygon,
      },
    );

    return {
      ok: true,
      project,
      room: getPersistedRoom(project, input.floorId, input.roomId),
    };
  } catch {
    return {
      ok: false,
      error: "invalid_polygon",
    };
  }
};

function getPersistedRoom(
  project: EditorProject,
  floorId: string,
  roomId: string,
): EditorRoom {
  const floor = project.floors.find((candidateFloor) => candidateFloor.floorId === floorId);

  if (floor == null) {
    throw new Error(`Floor "${floorId}" was not found.`);
  }

  const room = floor.rooms.find((candidateRoom) => candidateRoom.roomId === roomId);

  if (room == null) {
    throw new Error(`Room "${roomId}" was not found on floor "${floorId}".`);
  }

  return room;
}
