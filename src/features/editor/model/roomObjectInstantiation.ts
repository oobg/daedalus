import {
  createEditorRoom,
  type EditorPoint,
  type EditorRoom,
  type SharedBoundaryRef,
} from '../../../domain/editor-state.ts';
import {
  getRoomPolygonValidationMessage,
  validateRoomPolygonForOperation,
  type RoomPolygonOperationValidationResult,
} from './roomPolygonValidation.ts';

export interface RoomObjectInstantiationInput {
  readonly roomId: string;
  readonly roomName: string;
  readonly closedPolygon: readonly EditorPoint[];
  readonly sharedBoundaries?: readonly SharedBoundaryRef[];
}

export type CreateRoomObjectFromClosedPolygonResult =
  | {
      readonly ok: true;
      readonly room: EditorRoom;
    }
  | Extract<RoomPolygonOperationValidationResult, { readonly ok: false }>;

export const tryCreateRoomObjectFromClosedPolygon = (
  input: RoomObjectInstantiationInput,
): CreateRoomObjectFromClosedPolygonResult => {
  const validation = validateRoomPolygonForOperation(input.closedPolygon);

  if (!validation.ok) {
    return validation;
  }

  return {
    ok: true,
    room: createEditorRoom({
      roomId: input.roomId,
      roomName: input.roomName,
      roomPolygon: input.closedPolygon.slice(0, -1),
      sharedBoundaries: input.sharedBoundaries ?? [],
    }),
  };
};

export const createRoomObjectFromClosedPolygon = (
  input: RoomObjectInstantiationInput,
): EditorRoom => {
  const result = tryCreateRoomObjectFromClosedPolygon(input);

  if (!result.ok) {
    throw new Error(getRoomPolygonValidationMessage(result.validation.code));
  }

  return result.room;
};
