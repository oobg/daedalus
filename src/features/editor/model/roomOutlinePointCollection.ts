import type { EditorPoint } from "../../../domain/editor-state.ts";
import {
  captureRoomPolygonCanvasClick,
  type CaptureRoomPolygonCanvasClickResult,
  type RoomPolygonDrawingState,
} from "./roomPolygonDrawingMode.ts";

export interface RoomOutlineCollectionEditorState
  extends RoomPolygonDrawingState {}

export interface CollectRoomOutlinePointResult
  extends CaptureRoomPolygonCanvasClickResult {}

export const collectRoomOutlinePoint = (
  state: RoomOutlineCollectionEditorState,
  point: EditorPoint,
): CollectRoomOutlinePointResult =>
  captureRoomPolygonCanvasClick(state, point);
