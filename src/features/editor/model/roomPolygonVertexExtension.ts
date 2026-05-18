import type { DraftPoint } from "./roomDraft.ts";
import {
  captureRoomPolygonCanvasClick,
  type CaptureRoomPolygonCanvasClickResult,
  type RoomPolygonDrawingState,
} from "./roomPolygonDrawingMode.ts";

export interface ActiveRoomPolygonDraftState extends RoomPolygonDrawingState {}

export interface ExtendActiveRoomPolygonDraftResult
  extends CaptureRoomPolygonCanvasClickResult {}

export const extendActiveRoomPolygonDraft = (
  state: ActiveRoomPolygonDraftState,
  point: DraftPoint,
): ExtendActiveRoomPolygonDraftResult => {
  if (state.isDrawing === false || state.draftPoints.length === 0) {
    return {
      handled: false,
      state,
    };
  }

  return captureRoomPolygonCanvasClick(state, point);
};
