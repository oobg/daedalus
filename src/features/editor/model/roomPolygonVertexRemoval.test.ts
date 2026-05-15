import assert from 'node:assert/strict';
import test from 'node:test';

import { removeRoomPolygonVertexAt } from './roomPolygonVertexRemoval.ts';

test('removeRoomPolygonVertexAt removes the specified vertex from a closed polygon and preserves closure', () => {
  const polygon = [
    { x: 0, y: 0 },
    { x: 8, y: 0 },
    { x: 8, y: 4 },
    { x: 4, y: 6 },
    { x: 0, y: 4 },
    { x: 0, y: 0 },
  ] as const;

  const result = removeRoomPolygonVertexAt(polygon, 2);

  assert.deepEqual(result, [
    { x: 0, y: 0 },
    { x: 8, y: 0 },
    { x: 4, y: 6 },
    { x: 0, y: 4 },
    { x: 0, y: 0 },
  ]);
});

test('removeRoomPolygonVertexAt removes the specified vertex from an open polygon', () => {
  const polygon = [
    { x: 0, y: 0 },
    { x: 8, y: 0 },
    { x: 8, y: 4 },
    { x: 0, y: 4 },
  ] as const;

  const result = removeRoomPolygonVertexAt(polygon, 1);

  assert.deepEqual(result, [
    { x: 0, y: 0 },
    { x: 8, y: 4 },
    { x: 0, y: 4 },
  ]);
});
