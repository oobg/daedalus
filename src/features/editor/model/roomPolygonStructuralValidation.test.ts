import assert from 'node:assert/strict';
import test from 'node:test';

import {
  isClosedRoomPolygon,
  validateRoomPolygonStructure,
} from './roomPolygonStructuralValidation.ts';

test('isClosedRoomPolygon identifies canonical closed room polygons', () => {
  assert.equal(
    isClosedRoomPolygon([
      { x: 0, y: 0 },
      { x: 8, y: 0 },
      { x: 8, y: 6 },
      { x: 0, y: 6 },
      { x: 0, y: 0 },
    ]),
    true,
  );
});

test('validateRoomPolygonStructure accepts a canonical closed polygon with the minimum distinct vertices', () => {
  const result = validateRoomPolygonStructure([
    { x: 0, y: 0 },
    { x: 8, y: 0 },
    { x: 0, y: 6 },
    { x: 0, y: 0 },
  ]);

  assert.deepEqual(result, {
    ok: true,
    distinctVertexCount: 3,
  });
});

test('validateRoomPolygonStructure rejects polygons with fewer than three points before closure', () => {
  const result = validateRoomPolygonStructure([
    { x: 0, y: 0 },
    { x: 8, y: 0 },
    { x: 0, y: 0 },
  ]);

  assert.deepEqual(result, {
    ok: false,
    error: 'polygon_requires_three_points',
  });
});

test('validateRoomPolygonStructure rejects polygons that are not closed', () => {
  const result = validateRoomPolygonStructure([
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

test('validateRoomPolygonStructure rejects polygons with fewer than three distinct vertices', () => {
  const result = validateRoomPolygonStructure([
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

test('validateRoomPolygonStructure rejects polygons with non-finite coordinates', () => {
  const result = validateRoomPolygonStructure([
    { x: 0, y: 0 },
    { x: 8, y: 0 },
    { x: 8, y: Number.POSITIVE_INFINITY },
    { x: 0, y: 0 },
  ]);

  assert.deepEqual(result, {
    ok: false,
    error: 'polygon_points_must_be_finite',
  });
});
