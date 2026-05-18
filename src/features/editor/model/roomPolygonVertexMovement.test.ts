import assert from 'node:assert/strict';
import test from 'node:test';

import {
  moveRoomPolygonVertexAt,
  moveRoomPolygonVertexWithInvariantValidation,
} from './roomPolygonVertexMovement.ts';

test('moveRoomPolygonVertexAt updates the targeted vertex in an open polygon', () => {
  const polygon = [
    { x: 0, y: 0 },
    { x: 8, y: 0 },
    { x: 8, y: 4 },
    { x: 0, y: 4 },
  ] as const;

  const result = moveRoomPolygonVertexAt(polygon, 2, { x: 10, y: 6 });

  assert.deepEqual(result, [
    { x: 0, y: 0 },
    { x: 8, y: 0 },
    { x: 10, y: 6 },
    { x: 0, y: 4 },
  ]);
  assert.deepEqual(polygon, [
    { x: 0, y: 0 },
    { x: 8, y: 0 },
    { x: 8, y: 4 },
    { x: 0, y: 4 },
  ]);
});

test('moveRoomPolygonVertexAt preserves closure when the first vertex is moved in a closed polygon', () => {
  const polygon = [
    { x: 0, y: 0 },
    { x: 8, y: 0 },
    { x: 8, y: 4 },
    { x: 0, y: 4 },
    { x: 0, y: 0 },
  ] as const;

  const result = moveRoomPolygonVertexAt(polygon, 0, { x: -2, y: 1 });

  assert.deepEqual(result, [
    { x: -2, y: 1 },
    { x: 8, y: 0 },
    { x: 8, y: 4 },
    { x: 0, y: 4 },
    { x: -2, y: 1 },
  ]);
});

test('moveRoomPolygonVertexWithInvariantValidation rejects vertex moves that invalidate the room polygon', () => {
  const polygon = [
    { x: 0, y: 0 },
    { x: 8, y: 0 },
    { x: 8, y: 8 },
    { x: 0, y: 8 },
    { x: 0, y: 0 },
  ] as const;

  const result = moveRoomPolygonVertexWithInvariantValidation(
    polygon,
    2,
    { x: -2, y: 2 },
  );

  assert.deepEqual(result, {
    ok: false,
    error: 'invalid_polygon',
    validation: {
      code: 'polygon_area_must_be_non_zero',
      message: 'A room polygon must define a valid simple closed shape.',
    },
  });
  assert.deepEqual(polygon, [
    { x: 0, y: 0 },
    { x: 8, y: 0 },
    { x: 8, y: 8 },
    { x: 0, y: 8 },
    { x: 0, y: 0 },
  ]);
});

test('moveRoomPolygonVertexWithInvariantValidation returns a validated moved point set for an existing room polygon', () => {
  const polygon = [
    { x: 0, y: 0 },
    { x: 8, y: 0 },
    { x: 8, y: 4 },
    { x: 0, y: 4 },
    { x: 0, y: 0 },
  ] as const;

  const result = moveRoomPolygonVertexWithInvariantValidation(
    polygon,
    1,
    { x: 10, y: 1 },
  );

  assert.deepEqual(result, {
    ok: true,
    points: [
      { x: 0, y: 0 },
      { x: 10, y: 1 },
      { x: 8, y: 4 },
      { x: 0, y: 4 },
      { x: 0, y: 0 },
    ],
  });
});

test('moveRoomPolygonVertexWithInvariantValidation validates open editor polygons by temporarily closing them', () => {
  const polygon = [
    { x: 0, y: 0 },
    { x: 8, y: 0 },
    { x: 8, y: 4 },
    { x: 0, y: 4 },
  ] as const;

  const result = moveRoomPolygonVertexWithInvariantValidation(
    polygon,
    2,
    { x: 10, y: 6 },
  );

  assert.deepEqual(result, {
    ok: true,
    points: [
      { x: 0, y: 0 },
      { x: 8, y: 0 },
      { x: 10, y: 6 },
      { x: 0, y: 4 },
    ],
  });
});
