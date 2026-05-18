import assert from 'node:assert/strict';
import test from 'node:test';

import {
  acceptRoomPolygon,
  validateAcceptedRoomPolygon,
} from './roomPolygonAcceptance.ts';

test('acceptRoomPolygon accepts a valid created polygon by closing and canonicalizing it', () => {
  const result = acceptRoomPolygon([
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

test('acceptRoomPolygon accepts a valid edited polygon when every editor rule passes', () => {
  const result = acceptRoomPolygon([
    { x: 0, y: 0 },
    { x: 8, y: 0 },
    { x: 8, y: 6 },
    { x: 2, y: 8 },
    { x: 0, y: 0 },
  ]);

  assert.equal(result.ok, true);

  if (!result.ok) {
    return;
  }

  assert.deepEqual(result.points, [
    { x: 0, y: 0 },
    { x: 8, y: 0 },
    { x: 8, y: 6 },
    { x: 2, y: 8 },
    { x: 0, y: 0 },
  ]);
});

test('acceptRoomPolygon rejects an invalid polygon when normalization still leaves editor rule violations', () => {
  const result = acceptRoomPolygon([
    { x: 0, y: 0 },
    { x: 6, y: 0 },
    { x: 2, y: 4 },
    { x: 6, y: 6 },
    { x: 0, y: 6 },
    { x: 4, y: 2 },
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

test('validateAcceptedRoomPolygon rejects invalid edited polygons with the shared invalid_polygon contract', () => {
  const result = validateAcceptedRoomPolygon([
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
