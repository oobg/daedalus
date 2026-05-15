import assert from 'node:assert/strict';
import test from 'node:test';

import { closeRoomOutline } from './roomPolygonClosure.ts';

test('closeRoomOutline appends the starting point to a valid ordered room outline', () => {
  const outline = [
    { x: 2, y: 2 },
    { x: 8, y: 2 },
    { x: 8, y: 6 },
    { x: 2, y: 6 },
  ] as const;

  const closedPolygon = closeRoomOutline(outline);

  assert.deepEqual(closedPolygon, [
    { x: 2, y: 2 },
    { x: 8, y: 2 },
    { x: 8, y: 6 },
    { x: 2, y: 6 },
    { x: 2, y: 2 },
  ]);
  assert.deepEqual(outline, [
    { x: 2, y: 2 },
    { x: 8, y: 2 },
    { x: 8, y: 6 },
    { x: 2, y: 6 },
  ]);
});
