import type { EditorPoint } from "../../../domain/editor-state.ts";
import {
  captureRoomPolygonCanvasClick,
  type CaptureRoomPolygonCanvasClickResult,
  type RoomPolygonDrawingState,
} from "./roomPolygonDrawingMode.ts";
import { extendActiveRoomPolygonDraft } from "./roomPolygonVertexExtension.ts";

export interface RoomOutlineCollectionEditorState
  extends RoomPolygonDrawingState {}

export interface CollectRoomOutlinePointResult
  extends CaptureRoomPolygonCanvasClickResult {}

export const collectRoomOutlinePoint = (
  state: RoomOutlineCollectionEditorState,
  point: EditorPoint,
): CollectRoomOutlinePointResult =>
  state.isDrawing
    ? extendActiveRoomPolygonDraft(state, point)
    : captureRoomPolygonCanvasClick(state, point);
