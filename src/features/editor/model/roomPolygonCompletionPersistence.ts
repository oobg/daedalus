import {
  addEditorRoom,
  type EditorPoint,
  type EditorProject,
  type EditorRoom,
} from "../../../domain/editor-state.ts";
import { collectRoomDraftPoints, finalizeEditorRoomDraft } from "./roomDraft.ts";

export interface RoomPolygonCompletionPersistenceInput {
  readonly project: EditorProject;
  readonly floorId: string;
  readonly roomId: string;
  readonly roomName: string;
  readonly orderedVertices: readonly EditorPoint[];
}

export type PersistCompletedRoomPolygonResult =
  | {
      readonly ok: true;
      readonly project: EditorProject;
      readonly room: EditorRoom;
    }
  | {
      readonly ok: false;
      readonly error: "invalid_polygon";
    };

export const persistCompletedRoomPolygon = (
  input: RoomPolygonCompletionPersistenceInput,
): PersistCompletedRoomPolygonResult => {
  const roomDraft = collectRoomDraftPoints(input.roomId, input.orderedVertices);

  try {
    const roomInput = finalizeEditorRoomDraft(roomDraft, input.roomName);
    const project = addEditorRoom(input.project, input.floorId, roomInput);
    const room = getPersistedRoom(project, input.floorId, input.roomId);

    return {
      ok: true,
      project,
      room,
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
