import assert from 'node:assert/strict';
import test from 'node:test';

import {
  calculateRoomPolygonSignedArea,
  roomPolygonHasZeroArea,
  validateRoomPolygonZeroArea,
} from './roomPolygonZeroAreaValidation.ts';

test('calculateRoomPolygonSignedArea returns the signed shoelace area for a closed polygon', () => {
  const area = calculateRoomPolygonSignedArea([
    { x: 0, y: 0 },
    { x: 8, y: 0 },
    { x: 8, y: 6 },
    { x: 0, y: 6 },
    { x: 0, y: 0 },
  ]);

  assert.equal(area, 48);
});

test('roomPolygonHasZeroArea detects collinear closed polygons as degenerate', () => {
  const hasZeroArea = roomPolygonHasZeroArea([
    { x: 0, y: 0 },
    { x: 4, y: 0 },
    { x: 8, y: 0 },
    { x: 0, y: 0 },
  ]);

  assert.equal(hasZeroArea, true);
});

test('validateRoomPolygonZeroArea rejects a degenerate polygon whose computed area is zero', () => {
  const result = validateRoomPolygonZeroArea([
    { x: 0, y: 0 },
    { x: 2, y: 2 },
    { x: 4, y: 4 },
    { x: 0, y: 0 },
  ]);

  assert.deepEqual(result, {
    ok: false,
    area: 0,
    error: 'polygon_area_must_be_non_zero',
  });
});

test('validateRoomPolygonZeroArea accepts polygons whose computed area is non-zero', () => {
  const result = validateRoomPolygonZeroArea([
    { x: 0, y: 0 },
    { x: 8, y: 0 },
    { x: 8, y: 6 },
    { x: 0, y: 6 },
    { x: 0, y: 0 },
  ]);

  assert.deepEqual(result, {
    ok: true,
    area: 48,
  });
});
