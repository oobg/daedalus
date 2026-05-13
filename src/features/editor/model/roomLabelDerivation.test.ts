import assert from 'node:assert/strict';
import test from 'node:test';

import {
  collectRoomDraftPoints,
  finalizeRoomDraftPolygon,
} from './roomDraft.ts';
import { deriveRoomLabel } from './roomLabelDerivation.ts';

test('deriveRoomLabel ignores the duplicated closing vertex in closed editor polygons', () => {
  const polygon = finalizeRoomDraftPolygon(
    collectRoomDraftPoints('room-a', [
      { x: 0, y: 0 },
      { x: 8, y: 0 },
      { x: 8, y: 4 },
      { x: 0, y: 4 },
    ]),
  );

  assert.deepEqual(deriveRoomLabel(polygon), {
    position: {
      x: 4,
      y: 2,
    },
  });
});

test('deriveRoomLabel returns null when no polygon points are available', () => {
  assert.deepEqual(
    deriveRoomLabel({
      roomId: 'room-empty',
      points: [],
    }),
    {
      position: null,
    },
  );
});
