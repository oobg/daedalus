import assert from 'node:assert/strict';
import test from 'node:test';

import {
  normalizeRoomPolygonInput,
  normalizeRoomPolygonPoints,
} from './roomPolygonNormalization.ts';

test('normalizeRoomPolygonPoints returns the same canonical ordering for equivalent polygons', () => {
  const clockwiseShiftedPolygon = [
    { x: 8, y: 4 },
    { x: 8, y: 0 },
    { x: 2, y: 0 },
    { x: 2, y: 4 },
    { x: 8, y: 4 },
  ] as const;
  const counterClockwiseShiftedPolygon = [
    { x: 2, y: 4 },
    { x: 2, y: 0 },
    { x: 8, y: 0 },
    { x: 8, y: 4 },
    { x: 2, y: 4 },
  ] as const;

  const normalizedClockwise = normalizeRoomPolygonPoints(
    clockwiseShiftedPolygon,
  );
  const normalizedCounterClockwise = normalizeRoomPolygonPoints(
    counterClockwiseShiftedPolygon,
  );

  assert.deepEqual(normalizedClockwise, [
    { x: 2, y: 0 },
    { x: 8, y: 0 },
    { x: 8, y: 4 },
    { x: 2, y: 4 },
    { x: 2, y: 0 },
  ]);
  assert.deepEqual(normalizedCounterClockwise, normalizedClockwise);
});

test('normalizeRoomPolygonInput closes an open outline before canonical normalization', () => {
  const result = normalizeRoomPolygonInput([
    { x: 8, y: 4 },
    { x: 8, y: 0 },
    { x: 2, y: 0 },
    { x: 2, y: 4 },
  ]);

  assert.deepEqual(result, {
    ok: true,
    points: [
      { x: 2, y: 0 },
      { x: 8, y: 0 },
      { x: 8, y: 4 },
      { x: 2, y: 4 },
      { x: 2, y: 0 },
    ],
  });
});

test('normalizeRoomPolygonInput rejects polygons with fewer than three input points', () => {
  const result = normalizeRoomPolygonInput([
    { x: 0, y: 0 },
    { x: 4, y: 0 },
  ]);

  assert.deepEqual(result, {
    ok: false,
    error: 'polygon_requires_three_points',
  });
});

test('normalizeRoomPolygonInput rejects non-finite point coordinates', () => {
  const result = normalizeRoomPolygonInput([
    { x: 0, y: 0 },
    { x: 6, y: 0 },
    { x: Number.POSITIVE_INFINITY, y: 4 },
    { x: 0, y: 4 },
  ]);

  assert.deepEqual(result, {
    ok: false,
    error: 'polygon_points_must_be_finite',
  });
});

test('normalizeRoomPolygonInput rejects polygons without three distinct vertices after closure', () => {
  const result = normalizeRoomPolygonInput([
    { x: 0, y: 0 },
    { x: 8, y: 0 },
    { x: 8, y: 0 },
  ]);

  assert.deepEqual(result, {
    ok: false,
    error: 'polygon_requires_three_distinct_vertices',
  });
});

test('normalizeRoomPolygonInput rejects zero-area polygons', () => {
  const result = normalizeRoomPolygonInput([
    { x: 0, y: 0 },
    { x: 4, y: 4 },
    { x: 8, y: 8 },
  ]);

  assert.deepEqual(result, {
    ok: false,
    error: 'polygon_area_must_be_non_zero',
  });
});

test('normalizeRoomPolygonInput rejects self-intersecting polygons', () => {
  const result = normalizeRoomPolygonInput([
    { x: 0, y: 0 },
    { x: 6, y: 0 },
    { x: 2, y: 4 },
    { x: 6, y: 6 },
    { x: 0, y: 6 },
    { x: 4, y: 2 },
  ]);

  assert.deepEqual(result, {
    ok: false,
    error: 'polygon_self_intersects',
  });
});
