import assert from 'node:assert/strict';
import test from 'node:test';

import {
  insertRoomPolygonVertexAt,
  type InsertRoomPolygonVertexTarget,
} from './roomPolygonVertexInsertion.ts';

const polygon = [
  { x: 0, y: 0 },
  { x: 8, y: 0 },
  { x: 8, y: 4 },
  { x: 0, y: 4 },
] as const;

test('insertRoomPolygonVertexAt inserts after the specified edge index in an open polygon', () => {
  const result = insertRoomPolygonVertexAt(
    polygon,
    { edgeIndex: 1 },
    { x: 10, y: 2 },
  );

  assert.deepEqual(result, [
    { x: 0, y: 0 },
    { x: 8, y: 0 },
    { x: 10, y: 2 },
    { x: 8, y: 4 },
    { x: 0, y: 4 },
  ]);
});

test('insertRoomPolygonVertexAt inserts after the specified vertex index in a closed polygon', () => {
  const result = insertRoomPolygonVertexAt(
    [...polygon, polygon[0]],
    { vertexIndex: 3 } satisfies InsertRoomPolygonVertexTarget,
    { x: -2, y: 2 },
  );

  assert.deepEqual(result, [
    { x: 0, y: 0 },
    { x: 8, y: 0 },
    { x: 8, y: 4 },
    { x: 0, y: 4 },
    { x: -2, y: 2 },
    { x: 0, y: 0 },
  ]);
});
