import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DEFAULT_HANDLE_HIT_RADIUS,
  findNearestHandle,
  hitTestRoomHandles,
} from './roomVertexHandleHitTesting.ts';

const VERTEX_HANDLES = [
  { id: 'room-1:vertex:0', roomId: 'room-1', vertexIndex: 0, position: { x: 0, y: 0 } },
  { id: 'room-1:vertex:1', roomId: 'room-1', vertexIndex: 1, position: { x: 100, y: 0 } },
  { id: 'room-1:vertex:2', roomId: 'room-1', vertexIndex: 2, position: { x: 100, y: 60 } },
];

const EDGE_HANDLES = [
  { id: 'room-1:edge-insert:0', roomId: 'room-1', edgeIndex: 0, position: { x: 50, y: 0 } },
  { id: 'room-1:edge-insert:1', roomId: 'room-1', edgeIndex: 1, position: { x: 100, y: 30 } },
];

test('hitTestRoomHandles returns a vertex hit when the pointer is within the hit radius of a vertex handle', () => {
  const result = hitTestRoomHandles(
    { x: 3, y: 3 },
    VERTEX_HANDLES,
    EDGE_HANDLES,
  );

  assert.notEqual(result, null);
  assert.equal(result?.kind, 'vertex');
  assert.equal(result?.handle.id, 'room-1:vertex:0');
});

test('hitTestRoomHandles returns an edge hit when the pointer is near an edge midpoint and no vertex is closer', () => {
  const result = hitTestRoomHandles(
    { x: 52, y: 2 },
    VERTEX_HANDLES,
    EDGE_HANDLES,
  );

  assert.notEqual(result, null);
  assert.equal(result?.kind, 'edge');
  assert.equal(result?.handle.id, 'room-1:edge-insert:0');
});

test('hitTestRoomHandles returns null when the pointer is outside the hit radius of all handles', () => {
  const result = hitTestRoomHandles(
    { x: 50, y: 50 },
    VERTEX_HANDLES,
    EDGE_HANDLES,
  );

  assert.equal(result, null);
});

test('hitTestRoomHandles prioritizes vertex handles over edge handles when both are within the hit radius', () => {
  const vertex = { id: 'room-1:vertex:0', roomId: 'room-1', vertexIndex: 0, position: { x: 50, y: 0 } };
  const edge = { id: 'room-1:edge-insert:0', roomId: 'room-1', edgeIndex: 0, position: { x: 50, y: 0 } };

  const result = hitTestRoomHandles(
    { x: 50, y: 0 },
    [vertex],
    [edge],
  );

  assert.notEqual(result, null);
  assert.equal(result?.kind, 'vertex');
});

test('hitTestRoomHandles respects a custom hit radius', () => {
  const outOfDefaultRadius = hitTestRoomHandles(
    { x: 20, y: 0 },
    VERTEX_HANDLES,
    EDGE_HANDLES,
    DEFAULT_HANDLE_HIT_RADIUS,
  );
  const withinCustomRadius = hitTestRoomHandles(
    { x: 20, y: 0 },
    VERTEX_HANDLES,
    EDGE_HANDLES,
    25,
  );

  assert.equal(outOfDefaultRadius, null);
  assert.notEqual(withinCustomRadius, null);
  assert.equal(withinCustomRadius?.kind, 'vertex');
});

test('findNearestHandle returns the closest vertex handle when within radius', () => {
  const result = findNearestHandle(
    { x: 5, y: 0 },
    VERTEX_HANDLES,
    EDGE_HANDLES,
  );

  assert.notEqual(result, null);
  assert.equal(result?.kind, 'vertex');
  assert.equal(result?.handle.id, 'room-1:vertex:0');
});

test('findNearestHandle returns null when no handles are within the radius', () => {
  const result = findNearestHandle(
    { x: 200, y: 200 },
    VERTEX_HANDLES,
    EDGE_HANDLES,
  );

  assert.equal(result, null);
});
