import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveEditTarget } from './roomEditTargetResolution.ts';

const ROOM_A = {
  roomId: 'room-a',
  roomPolygon: [
    { x: 0, y: 0 },
    { x: 80, y: 0 },
    { x: 80, y: 60 },
    { x: 0, y: 60 },
  ],
};

const ROOM_B = {
  roomId: 'room-b',
  roomPolygon: [
    { x: 40, y: 20 },
    { x: 120, y: 20 },
    { x: 120, y: 80 },
    { x: 40, y: 80 },
  ],
};

const VERTEX_HANDLES = [
  { id: 'room-a:vertex:0', roomId: 'room-a', vertexIndex: 0, position: { x: 0, y: 0 } },
  { id: 'room-a:vertex:1', roomId: 'room-a', vertexIndex: 1, position: { x: 80, y: 0 } },
];

const EDGE_HANDLES = [
  { id: 'room-a:edge-insert:0', roomId: 'room-a', edgeIndex: 0, position: { x: 40, y: 0 } },
];

test('resolveEditTarget returns vertex-handle when pointer hits a vertex handle', () => {
  const result = resolveEditTarget(
    { x: 2, y: 2 },
    [ROOM_A, ROOM_B],
    { vertexHandles: VERTEX_HANDLES, edgeHandles: EDGE_HANDLES },
  );

  assert.equal(result.kind, 'vertex-handle');
  if (result.kind === 'vertex-handle') {
    assert.equal(result.handle.id, 'room-a:vertex:0');
  }
});

test('resolveEditTarget returns edge-handle when pointer hits an edge midpoint handle but no vertex', () => {
  const result = resolveEditTarget(
    { x: 42, y: 1 },
    [ROOM_A, ROOM_B],
    { vertexHandles: VERTEX_HANDLES, edgeHandles: EDGE_HANDLES },
  );

  assert.equal(result.kind, 'edge-handle');
  if (result.kind === 'edge-handle') {
    assert.equal(result.handle.id, 'room-a:edge-insert:0');
  }
});

test('resolveEditTarget returns room when pointer is inside a room polygon and no handle is hit', () => {
  const result = resolveEditTarget(
    { x: 30, y: 30 },
    [ROOM_A, ROOM_B],
    { vertexHandles: VERTEX_HANDLES, edgeHandles: EDGE_HANDLES },
  );

  assert.equal(result.kind, 'room');
  if (result.kind === 'room') {
    assert.equal(result.room.roomId, 'room-a');
  }
});

test('resolveEditTarget returns topmost room when pointer is inside overlapping rooms', () => {
  const result = resolveEditTarget(
    { x: 60, y: 40 },
    [ROOM_A, ROOM_B],
    { vertexHandles: [], edgeHandles: [] },
  );

  assert.equal(result.kind, 'room');
  if (result.kind === 'room') {
    assert.equal(result.room.roomId, 'room-b');
  }
});

test('resolveEditTarget returns none when pointer misses all handles and rooms', () => {
  const result = resolveEditTarget(
    { x: 200, y: 200 },
    [ROOM_A, ROOM_B],
    { vertexHandles: VERTEX_HANDLES, edgeHandles: EDGE_HANDLES },
  );

  assert.equal(result.kind, 'none');
});

test('resolveEditTarget prioritizes vertex handle over room body even when pointer is inside a room', () => {
  const vertexInsideRoom = {
    id: 'room-a:vertex:inside',
    roomId: 'room-a',
    vertexIndex: 99,
    position: { x: 30, y: 30 },
  };

  const result = resolveEditTarget(
    { x: 30, y: 30 },
    [ROOM_A],
    { vertexHandles: [vertexInsideRoom], edgeHandles: [] },
  );

  assert.equal(result.kind, 'vertex-handle');
});
