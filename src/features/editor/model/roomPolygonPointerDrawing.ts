import type { DraftPoint } from "./roomDraft.ts";
import {
  ROOM_DRAFT_CLOSE_THRESHOLD,
  isRoomDraftClosureTargetActive,
} from "./roomDraftPreview.ts";
import { isRoomPolygonDrawingTool, type RoomPolygonDrawingState } from "./roomPolygonDrawingMode.ts";

export interface RoomPolygonPointerSession {
  readonly pointerDownPoint: DraftPoint;
  readonly pointerCurrentPoint: DraftPoint;
}

export interface RoomPolygonPointerDrawingState
  extends RoomPolygonDrawingState {
  readonly pointerSession: RoomPolygonPointerSession | null;
}

export interface RoomPolygonPointerResult {
  readonly handled: boolean;
  readonly state: RoomPolygonPointerDrawingState;
  readonly completed?: boolean;
  readonly placementPoint?: DraftPoint;
  readonly error?: "invalid_point" | "duplicate_point";
}

const clonePoint = (point: DraftPoint): DraftPoint => ({
  x: point.x,
  y: point.y,
});

const pointsMatch = (left: DraftPoint, right: DraftPoint): boolean =>
  left.x === right.x && left.y === right.y;

const isFinitePoint = (point: DraftPoint): boolean =>
  Number.isFinite(point.x) && Number.isFinite(point.y);

const clearPointerSession = (
  state: RoomPolygonPointerDrawingState,
): RoomPolygonPointerDrawingState => ({
  ...state,
  pointerSession: null,
});

export const beginRoomPolygonPointerDrawing = (
  state: RoomPolygonPointerDrawingState,
  point: DraftPoint,
): RoomPolygonPointerResult => {
  if (!isRoomPolygonDrawingTool(state.activeTool)) {
    return {
      handled: false,
      state,
    };
  }

  if (!isFinitePoint(point)) {
    return {
      handled: true,
      state,
      error: "invalid_point",
    };
  }

  return {
    handled: true,
    state: {
      ...state,
      pointerSession: {
        pointerDownPoint: clonePoint(point),
        pointerCurrentPoint: clonePoint(point),
      },
    },
  };
};

export const updateRoomPolygonPointerDrawing = (
  state: RoomPolygonPointerDrawingState,
  point: DraftPoint,
): RoomPolygonPointerResult => {
  if (!isRoomPolygonDrawingTool(state.activeTool) || state.pointerSession === null) {
    return {
      handled: false,
      state,
    };
  }

  if (!isFinitePoint(point)) {
    return {
      handled: true,
      state,
      error: "invalid_point",
    };
  }

  return {
    handled: true,
    state: {
      ...state,
      pointerSession: {
        ...state.pointerSession,
        pointerCurrentPoint: clonePoint(point),
      },
    },
  };
};

export const completeRoomPolygonPointerDrawing = (
  state: RoomPolygonPointerDrawingState,
  point: DraftPoint,
  closeThreshold = ROOM_DRAFT_CLOSE_THRESHOLD,
): RoomPolygonPointerResult => {
  if (!isRoomPolygonDrawingTool(state.activeTool) || state.pointerSession === null) {
    return {
      handled: false,
      state,
    };
  }

  if (!isFinitePoint(point)) {
    return {
      handled: true,
      state: clearPointerSession(state),
      error: "invalid_point",
    };
  }

  const placementPoint = clonePoint(point);

  if (
    state.draftPoints.length >= 3 &&
    isRoomDraftClosureTargetActive(
      state.draftPoints,
      placementPoint,
      closeThreshold,
    )
  ) {
    return {
      handled: true,
      completed: true,
      state: {
        ...clearPointerSession(state),
        isDrawing: false,
      },
    };
  }

  if (state.draftPoints.some((draftPoint) => pointsMatch(draftPoint, placementPoint))) {
    return {
      handled: true,
      state: clearPointerSession(state),
      error: "duplicate_point",
    };
  }

  return {
    handled: true,
    placementPoint,
    state: {
      ...clearPointerSession(state),
      isDrawing: true,
      draftPoints: [...state.draftPoints, placementPoint],
    },
  };
};
