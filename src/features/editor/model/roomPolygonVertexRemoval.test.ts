import assert from 'node:assert/strict';
import test from 'node:test';

import {
  removeRoomPolygonVertexAt,
  removeRoomPolygonVertexWithInvariantValidation,
} from './roomPolygonVertexRemoval.ts';

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

test('removeRoomPolygonVertexWithInvariantValidation returns a validated reduced polygon for an existing room polygon', () => {
  const polygon = [
    { x: 0, y: 0 },
    { x: 8, y: 0 },
    { x: 8, y: 4 },
    { x: 4, y: 6 },
    { x: 0, y: 4 },
    { x: 0, y: 0 },
  ] as const;

  const result = removeRoomPolygonVertexWithInvariantValidation(polygon, 2);

  assert.deepEqual(result, {
    ok: true,
    points: [
      { x: 0, y: 0 },
      { x: 8, y: 0 },
      { x: 4, y: 6 },
      { x: 0, y: 4 },
      { x: 0, y: 0 },
    ],
  });
});

test('removeRoomPolygonVertexWithInvariantValidation rejects removals that collapse the polygon invariants', () => {
  const polygon = [
    { x: 0, y: 0 },
    { x: 4, y: 0 },
    { x: 8, y: 0 },
    { x: 0, y: 0 },
  ] as const;

  const result = removeRoomPolygonVertexWithInvariantValidation(polygon, 1);

  assert.deepEqual(result, {
    ok: false,
    error: 'invalid_polygon',
    validation: {
      code: 'polygon_requires_three_points',
      message: 'A room polygon requires at least 3 points.',
    },
  });
});

test('removeRoomPolygonVertexWithInvariantValidation rejects out-of-range vertex indexes', () => {
  const polygon = [
    { x: 0, y: 0 },
    { x: 8, y: 0 },
    { x: 8, y: 4 },
    { x: 0, y: 4 },
    { x: 0, y: 0 },
  ] as const;

  const result = removeRoomPolygonVertexWithInvariantValidation(polygon, 4);

  assert.deepEqual(result, {
    ok: false,
    error: 'vertex_index_out_of_range',
  });
});
