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
  readonly completed?: boolean;
  readonly error?: 'invalid_point' | 'duplicate_point';
}

export interface RoomPolygonDraftRenderState {
  readonly vertexPoints: readonly DraftPoint[];
  readonly placedEdgePoints: number[];
  readonly activeEdgePoints: number[];
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

const isRoomDraftClosingClick = (
  draftPoints: readonly DraftPoint[],
  point: DraftPoint,
): boolean => {
  const firstPoint = draftPoints[0] ?? null;

  return (
    firstPoint !== null &&
    draftPoints.length >= 3 &&
    pointsMatch(firstPoint, point)
  );
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

  if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) {
    return {
      handled: true,
      state,
      error: 'invalid_point',
    };
  }

  if (state.isDrawing && isRoomDraftClosingClick(state.draftPoints, point)) {
    return {
      handled: true,
      completed: true,
      state: {
        ...state,
        isDrawing: false,
      },
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

export const getRoomPolygonDraftRenderState = (
  draftPoints: readonly DraftPoint[],
  cursorPoint: DraftPoint | null,
): RoomPolygonDraftRenderState => {
  const placedEdgePoints = draftPoints.flatMap((point) => [point.x, point.y]);
  const lastPoint = draftPoints[draftPoints.length - 1] ?? null;
  const activeEdgePoints =
    lastPoint !== null && cursorPoint !== null
      ? [lastPoint.x, lastPoint.y, cursorPoint.x, cursorPoint.y]
      : [];

  return {
    vertexPoints: draftPoints.map((point) => ({
      x: point.x,
      y: point.y,
    })),
    placedEdgePoints,
    activeEdgePoints,
  };
};
