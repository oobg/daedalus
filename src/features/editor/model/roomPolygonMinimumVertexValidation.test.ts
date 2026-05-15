import assert from 'node:assert/strict';
import test from 'node:test';

import {
  MINIMUM_ROOM_POLYGON_DISTINCT_VERTICES,
  countDistinctRoomPolygonVertices,
  validateMinimumRoomPolygonVertices,
} from './roomPolygonMinimumVertexValidation.ts';

test('countDistinctRoomPolygonVertices ignores the duplicated closing vertex', () => {
  const distinctVertexCount = countDistinctRoomPolygonVertices([
    { x: 0, y: 0 },
    { x: 8, y: 0 },
    { x: 0, y: 6 },
    { x: 0, y: 0 },
  ]);

  assert.equal(
    distinctVertexCount,
    MINIMUM_ROOM_POLYGON_DISTINCT_VERTICES,
  );
});

test('validateMinimumRoomPolygonVertices accepts a polygon with exactly three distinct vertices', () => {
  const result = validateMinimumRoomPolygonVertices([
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

test('validateMinimumRoomPolygonVertices rejects a closed polygon with fewer than three distinct vertices', () => {
  const result = validateMinimumRoomPolygonVertices([
    { x: 0, y: 0 },
    { x: 8, y: 0 },
    { x: 0, y: 0 },
  ]);

  assert.deepEqual(result, {
    ok: false,
    distinctVertexCount: 2,
    requiredDistinctVertices: 3,
    error: 'polygon_requires_three_distinct_vertices',
  });
});

test('validateMinimumRoomPolygonVertices rejects repeated open-polygon points that do not reach the minimum distinct vertex count', () => {
  const result = validateMinimumRoomPolygonVertices([
    { x: 0, y: 0 },
    { x: 8, y: 0 },
    { x: 8, y: 0 },
    { x: 0, y: 0 },
  ]);

  assert.deepEqual(result, {
    ok: false,
    distinctVertexCount: 2,
    requiredDistinctVertices: 3,
    error: 'polygon_requires_three_distinct_vertices',
  });
});
