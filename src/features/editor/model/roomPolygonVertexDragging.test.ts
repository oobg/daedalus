import assert from 'node:assert/strict';
import test from 'node:test';

import {
  beginRoomPolygonVertexDragging,
  completeRoomPolygonVertexDragging,
  updateRoomPolygonVertexDragging,
} from './roomPolygonVertexDragging.ts';

const ROOM = {
  roomId: 'room-a',
  roomPolygon: [
    { x: 0, y: 0 },
    { x: 80, y: 0 },
    { x: 80, y: 60 },
    { x: 0, y: 60 },
  ],
};

const HANDLE = {
  id: 'room-a:vertex:2',
  roomId: 'room-a',
  vertexIndex: 2,
  position: { x: 80, y: 60 },
};

test('beginRoomPolygonVertexDragging starts a drag session only for an existing selected-room vertex', () => {
  const begin = beginRoomPolygonVertexDragging(
    {
      activeTool: 'select',
      activeFloorId: 'floor-1',
      selectedRoom: ROOM,
      dragSession: null,
    },
    HANDLE,
    { x: 80, y: 60 },
  );

  assert.equal(begin.handled, true);
  assert.deepEqual(begin.state.dragSession, {
    floorId: 'floor-1',
    roomId: 'room-a',
    handle: HANDLE,
    originPolygon: [
      { x: 0, y: 0 },
      { x: 80, y: 0 },
      { x: 80, y: 60 },
      { x: 0, y: 60 },
    ],
    pointerDownPoint: { x: 80, y: 60 },
    pointerCurrentPoint: { x: 80, y: 60 },
    committedPoint: { x: 80, y: 60 },
  });
  assert.deepEqual(ROOM.roomPolygon[2], { x: 80, y: 60 });
});

test('updateRoomPolygonVertexDragging maps drag movement into a room polygon update', () => {
  const begun = beginRoomPolygonVertexDragging(
    {
      activeTool: 'select',
      activeFloorId: 'floor-1',
      selectedRoom: ROOM,
      dragSession: null,
    },
    HANDLE,
    { x: 80, y: 60 },
  );

  const moved = updateRoomPolygonVertexDragging(
    begun.state,
    { x: 96, y: 72 },
  );

  assert.deepEqual(moved.roomUpdate, {
    floorId: 'floor-1',
    roomId: 'room-a',
    roomPolygon: [
      { x: 0, y: 0 },
      { x: 80, y: 0 },
      { x: 96, y: 72 },
      { x: 0, y: 60 },
    ],
  });
  assert.deepEqual(moved.state.dragSession?.committedPoint, {
    x: 96,
    y: 72,
  });
  assert.deepEqual(ROOM.roomPolygon[2], { x: 80, y: 60 });
});

test('updateRoomPolygonVertexDragging recomputes from the original polygon across repeated pointer moves', () => {
  const begun = beginRoomPolygonVertexDragging(
    {
      activeTool: 'select',
      activeFloorId: 'floor-1',
      selectedRoom: ROOM,
      dragSession: null,
    },
    HANDLE,
    { x: 80, y: 60 },
  );

  const firstMove = updateRoomPolygonVertexDragging(
    begun.state,
    { x: 96, y: 72 },
  );
  const secondMove = updateRoomPolygonVertexDragging(
    firstMove.state,
    { x: 104, y: 68 },
  );

  assert.deepEqual(secondMove.roomUpdate, {
    floorId: 'floor-1',
    roomId: 'room-a',
    roomPolygon: [
      { x: 0, y: 0 },
      { x: 80, y: 0 },
      { x: 104, y: 68 },
      { x: 0, y: 60 },
    ],
  });
});

test('updateRoomPolygonVertexDragging preserves the last committed vertex when an invalid drag crosses the polygon', () => {
  const begun = beginRoomPolygonVertexDragging(
    {
      activeTool: 'select',
      activeFloorId: 'floor-1',
      selectedRoom: ROOM,
      dragSession: null,
    },
    HANDLE,
    { x: 80, y: 60 },
  );

  const firstMove = updateRoomPolygonVertexDragging(
    begun.state,
    { x: 96, y: 72 },
  );
  const invalidMove = updateRoomPolygonVertexDragging(
    firstMove.state,
    { x: -20, y: 20 },
  );

  assert.equal(invalidMove.roomUpdate, undefined);
  assert.equal(invalidMove.error, 'invalid_move');
  assert.deepEqual(invalidMove.state.dragSession?.committedPoint, {
    x: 96,
    y: 72,
  });
  assert.deepEqual(invalidMove.state.dragSession?.pointerCurrentPoint, {
    x: -20,
    y: 20,
  });
});

test('completeRoomPolygonVertexDragging clears the drag session and returns the final room update', () => {
  const begun = beginRoomPolygonVertexDragging(
    {
      activeTool: 'select',
      activeFloorId: 'floor-1',
      selectedRoom: ROOM,
      dragSession: null,
    },
    HANDLE,
    { x: 80, y: 60 },
  );

  const completed = completeRoomPolygonVertexDragging(
    begun.state,
    { x: 108, y: 76 },
  );

  assert.deepEqual(completed.roomUpdate, {
    floorId: 'floor-1',
    roomId: 'room-a',
    roomPolygon: [
      { x: 0, y: 0 },
      { x: 80, y: 0 },
      { x: 108, y: 76 },
      { x: 0, y: 60 },
    ],
  });
  assert.equal(completed.state.dragSession, null);
});
