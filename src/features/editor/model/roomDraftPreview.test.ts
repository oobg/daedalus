import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ROOM_DRAFT_CLOSE_THRESHOLD,
  canPreviewRoomDraftClosure,
  getRoomDraftClosurePreviewPoints,
  isRoomDraftClosureTargetActive,
} from './roomDraftPreview.ts';

const triangleDraft = [
  { x: 20, y: 20 },
  { x: 80, y: 20 },
  { x: 80, y: 80 },
];

test('canPreviewRoomDraftClosure requires at least three placed vertices and a cursor', () => {
  assert.equal(
    canPreviewRoomDraftClosure(
      [
        { x: 20, y: 20 },
        { x: 80, y: 20 },
      ],
      { x: 40, y: 40 },
    ),
    false,
  );
  assert.equal(canPreviewRoomDraftClosure(triangleDraft, null), false);
  assert.equal(
    canPreviewRoomDraftClosure(triangleDraft, { x: 40, y: 40 }),
    true,
  );
});

test('getRoomDraftClosurePreviewPoints returns the cursor-to-first closing edge', () => {
  assert.deepEqual(
    getRoomDraftClosurePreviewPoints(triangleDraft, { x: 48, y: 64 }),
    [
      { x: 48, y: 64 },
      { x: 20, y: 20 },
    ],
  );
});

test('getRoomDraftClosurePreviewPoints stays empty until closure preview is eligible', () => {
  assert.deepEqual(
    getRoomDraftClosurePreviewPoints(
      [
        { x: 20, y: 20 },
        { x: 80, y: 20 },
      ],
      { x: 48, y: 64 },
    ),
    [],
  );
});

test('isRoomDraftClosureTargetActive activates near the first vertex threshold', () => {
  assert.equal(
    isRoomDraftClosureTargetActive(triangleDraft, {
      x: 20 + ROOM_DRAFT_CLOSE_THRESHOLD - 1,
      y: 20,
    }),
    true,
  );
  assert.equal(
    isRoomDraftClosureTargetActive(triangleDraft, {
      x: 20 + ROOM_DRAFT_CLOSE_THRESHOLD,
      y: 20,
    }),
    false,
  );
});
