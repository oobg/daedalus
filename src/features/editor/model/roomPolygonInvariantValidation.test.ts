import assert from 'node:assert/strict';
import test from 'node:test';

import { validateRoomPolygonVertexEditInvariant } from './roomPolygonInvariantValidation.ts';

test('validateRoomPolygonVertexEditInvariant accepts a valid edited polygon state', () => {
  const result = validateRoomPolygonVertexEditInvariant([
    { x: 0, y: 0 },
    { x: 8, y: 0 },
    { x: 8, y: 6 },
    { x: 2, y: 8 },
    { x: 0, y: 0 },
  ]);

  assert.deepEqual(result, {
    ok: true,
  });
});

test('validateRoomPolygonVertexEditInvariant rejects a self-intersecting edited polygon state', () => {
  const result = validateRoomPolygonVertexEditInvariant([
    { x: 0, y: 0 },
    { x: 8, y: 0 },
    { x: 2, y: 6 },
    { x: 8, y: 6 },
    { x: 0, y: 0 },
  ]);

  assert.deepEqual(result, {
    ok: false,
    error: 'invalid_polygon',
    validation: {
      code: 'polygon_self_intersects',
      message: 'A room polygon must not self-intersect.',
    },
  });
});

test('validateRoomPolygonVertexEditInvariant rejects a degenerate edited polygon state', () => {
  const result = validateRoomPolygonVertexEditInvariant([
    { x: 0, y: 0 },
    { x: 4, y: 4 },
    { x: 8, y: 8 },
    { x: 0, y: 0 },
  ]);

  assert.deepEqual(result, {
    ok: false,
    error: 'invalid_polygon',
    validation: {
      code: 'polygon_area_must_be_non_zero',
      message: 'A room polygon must define a valid simple closed shape.',
    },
  });
});
