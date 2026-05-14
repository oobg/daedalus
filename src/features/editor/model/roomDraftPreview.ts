import type { DraftPoint } from './roomDraft.ts';

export const ROOM_DRAFT_CLOSE_THRESHOLD = 16;

export const canPreviewRoomDraftClosure = (
  draftPoints: readonly DraftPoint[],
  cursorPoint: DraftPoint | null,
): cursorPoint is DraftPoint =>
  cursorPoint !== null && draftPoints.length >= 3;

export const isRoomDraftClosureTargetActive = (
  draftPoints: readonly DraftPoint[],
  cursorPoint: DraftPoint | null,
  threshold = ROOM_DRAFT_CLOSE_THRESHOLD,
): boolean => {
  if (!canPreviewRoomDraftClosure(draftPoints, cursorPoint)) {
    return false;
  }

  const firstPoint = draftPoints[0];
  return (
    Math.hypot(cursorPoint.x - firstPoint.x, cursorPoint.y - firstPoint.y) <
    threshold
  );
};

export const getRoomDraftClosurePreviewPoints = (
  draftPoints: readonly DraftPoint[],
  cursorPoint: DraftPoint | null,
): readonly DraftPoint[] => {
  if (!canPreviewRoomDraftClosure(draftPoints, cursorPoint)) {
    return [];
  }

  return [cursorPoint, draftPoints[0]];
};
