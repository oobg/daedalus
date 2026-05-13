import assert from 'node:assert/strict';
import test from 'node:test';

import { validateRoomPolygon } from './roomPolygonValidation.ts';

test('validateRoomPolygon accepts a simple closed room polygon', () => {
  const result = validateRoomPolygon([
    { x: 0, y: 0 },
    { x: 8, y: 0 },
    { x: 8, y: 6 },
    { x: 0, y: 6 },
    { x: 0, y: 0 },
  ]);

  assert.deepEqual(result, {
    ok: true,
  });
});

test('validateRoomPolygon rejects a self-intersecting room polygon', () => {
  const result = validateRoomPolygon([
    { x: 0, y: 0 },
    { x: 6, y: 0 },
    { x: 2, y: 4 },
    { x: 6, y: 6 },
    { x: 0, y: 6 },
    { x: 4, y: 2 },
    { x: 0, y: 0 },
  ]);

  assert.deepEqual(result, {
    ok: false,
    error: 'polygon_self_intersects',
  });
});
