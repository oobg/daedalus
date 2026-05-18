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

test('validateRoomPolygon rejects polygons with fewer than three points before closure', () => {
  const result = validateRoomPolygon([
    { x: 0, y: 0 },
    { x: 8, y: 0 },
    { x: 0, y: 0 },
  ]);

  assert.deepEqual(result, {
    ok: false,
    error: 'polygon_requires_three_points',
  });
});

test('validateRoomPolygon rejects unclosed polygons', () => {
  const result = validateRoomPolygon([
    { x: 0, y: 0 },
    { x: 8, y: 0 },
    { x: 8, y: 6 },
    { x: 0, y: 6 },
  ]);

  assert.deepEqual(result, {
    ok: false,
    error: 'polygon_must_be_closed',
  });
});

test('validateRoomPolygon rejects closed polygons with fewer than three distinct vertices', () => {
  const result = validateRoomPolygon([
    { x: 0, y: 0 },
    { x: 8, y: 0 },
    { x: 8, y: 0 },
    { x: 0, y: 0 },
  ]);

  assert.deepEqual(result, {
    ok: false,
    error: 'polygon_requires_three_distinct_vertices',
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

test('validateRoomPolygon rejects non-finite vertex coordinates', () => {
  const result = validateRoomPolygon([
    { x: 0, y: 0 },
    { x: 8, y: 0 },
    { x: 8, y: Number.NaN },
    { x: 0, y: 0 },
  ]);

  assert.deepEqual(result, {
    ok: false,
    error: 'polygon_points_must_be_finite',
  });
});

test('validateRoomPolygon rejects degenerate closed polygons whose area collapses to zero', () => {
  const result = validateRoomPolygon([
    { x: 0, y: 0 },
    { x: 4, y: 4 },
    { x: 8, y: 8 },
    { x: 0, y: 0 },
  ]);

  assert.deepEqual(result, {
    ok: false,
    error: 'polygon_area_must_be_non_zero',
  });
});
