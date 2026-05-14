import type { DraftPoint } from './roomDraft.ts';

export const ROOM_POLYGON_DRAWING_TOOL = 'room';

export interface RoomPolygonDrawingState {
  readonly activeTool: string;
  readonly isDrawing: boolean;
  readonly draftPoints: readonly DraftPoint[];
}

export interface CaptureRoomPolygonCanvasClickResult {
  readonly handled: boolean;
  readonly state: RoomPolygonDrawingState;
  readonly error?: 'invalid_point' | 'duplicate_point';
}

export const isRoomPolygonDrawingTool = (
  activeTool: string,
): activeTool is typeof ROOM_POLYGON_DRAWING_TOOL =>
  activeTool === ROOM_POLYGON_DRAWING_TOOL;

const pointsMatch = (left: DraftPoint, right: DraftPoint): boolean =>
  left.x === right.x && left.y === right.y;

const validateDraftPointPlacement = (
  draftPoints: readonly DraftPoint[],
  point: DraftPoint,
): CaptureRoomPolygonCanvasClickResult['error'] | null => {
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) {
    return 'invalid_point';
  }

  if (draftPoints.some((draftPoint) => pointsMatch(draftPoint, point))) {
    return 'duplicate_point';
  }

  return null;
};

export const captureRoomPolygonCanvasClick = (
  state: RoomPolygonDrawingState,
  point: DraftPoint,
): CaptureRoomPolygonCanvasClickResult => {
  if (!isRoomPolygonDrawingTool(state.activeTool)) {
    return {
      handled: false,
      state,
    };
  }

  const placementError = validateDraftPointPlacement(state.draftPoints, point);

  if (placementError != null) {
    return {
      handled: true,
      state,
      error: placementError,
    };
  }

  return {
    handled: true,
    state: {
      ...state,
      isDrawing: true,
      draftPoints: [
        ...state.draftPoints,
        {
          x: point.x,
          y: point.y,
        },
      ],
    },
  };
};
