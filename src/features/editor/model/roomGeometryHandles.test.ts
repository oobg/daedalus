import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getSelectedRoomGeometryHandles,
  insertRoomGeometryEdgeVertex,
  moveRoomGeometryHandleVertex,
  removeRoomGeometryHandleVertex,
} from './roomGeometryHandles.ts';

test('getSelectedRoomGeometryHandles returns one editable handle per selected room polygon vertex', () => {
  const rooms = [
    {
      roomId: 'room-a',
      roomPolygon: [
        { x: 0, y: 0 },
        { x: 80, y: 0 },
        { x: 80, y: 60 },
        { x: 0, y: 60 },
      ],
    },
    {
      roomId: 'room-b',
      roomPolygon: [
        { x: 120, y: 0 },
        { x: 180, y: 0 },
        { x: 180, y: 40 },
        { x: 120, y: 40 },
      ],
    },
  ];

  const handles = getSelectedRoomGeometryHandles({
    rooms,
    selectedRoomId: 'room-b',
  });

  assert.deepEqual(handles, [
    {
      id: 'room-b:vertex:0',
      roomId: 'room-b',
      vertexIndex: 0,
      position: { x: 120, y: 0 },
    },
    {
      id: 'room-b:vertex:1',
      roomId: 'room-b',
      vertexIndex: 1,
      position: { x: 180, y: 0 },
    },
    {
      id: 'room-b:vertex:2',
      roomId: 'room-b',
      vertexIndex: 2,
      position: { x: 180, y: 40 },
    },
    {
      id: 'room-b:vertex:3',
      roomId: 'room-b',
      vertexIndex: 3,
      position: { x: 120, y: 40 },
    },
  ]);
});

test('getSelectedRoomGeometryHandles hides handles when no existing room is selected', () => {
  const rooms = [
    {
      roomId: 'room-a',
      roomPolygon: [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
      ],
    },
  ];

  assert.deepEqual(
    getSelectedRoomGeometryHandles({ rooms, selectedRoomId: null }),
    [],
  );
  assert.deepEqual(
    getSelectedRoomGeometryHandles({ rooms, selectedRoomId: 'missing-room' }),
    [],
  );
});

test('getSelectedRoomGeometryHandles copies handle positions from source polygon points', () => {
  const rooms = [
    {
      roomId: 'room-a',
      roomPolygon: [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
      ],
    },
  ];

  const handles = getSelectedRoomGeometryHandles({
    rooms,
    selectedRoomId: 'room-a',
  });

  handles[0].position.x = 999;

  assert.equal(rooms[0].roomPolygon[0].x, 0);
});

test('moveRoomGeometryHandleVertex returns a polygon with only the dragged vertex moved', () => {
  const room = {
    roomId: 'room-a',
    roomPolygon: [
      { x: 0, y: 0 },
      { x: 80, y: 0 },
      { x: 80, y: 60 },
      { x: 0, y: 60 },
    ],
  };

  const nextPolygon = moveRoomGeometryHandleVertex(
    room,
    {
      id: 'room-a:vertex:2',
      roomId: 'room-a',
      vertexIndex: 2,
      position: { x: 80, y: 60 },
    },
    { x: 96, y: 72 },
  );

  assert.deepEqual(nextPolygon, [
    { x: 0, y: 0 },
    { x: 80, y: 0 },
    { x: 96, y: 72 },
    { x: 0, y: 60 },
  ]);
  assert.deepEqual(room.roomPolygon[2], { x: 80, y: 60 });
});

test('moveRoomGeometryHandleVertex ignores handles that do not belong to the room polygon', () => {
  const room = {
    roomId: 'room-a',
    roomPolygon: [
      { x: 0, y: 0 },
      { x: 80, y: 0 },
      { x: 80, y: 60 },
      { x: 0, y: 60 },
    ],
  };

  assert.equal(
    moveRoomGeometryHandleVertex(
      room,
      {
        id: 'room-b:vertex:2',
        roomId: 'room-b',
        vertexIndex: 2,
        position: { x: 80, y: 60 },
      },
      { x: 96, y: 72 },
    ),
    null,
  );
  assert.equal(
    moveRoomGeometryHandleVertex(
      room,
      {
        id: 'room-a:vertex:99',
        roomId: 'room-a',
        vertexIndex: 99,
        position: { x: 80, y: 60 },
      },
      { x: 96, y: 72 },
    ),
    null,
  );
});

test('insertRoomGeometryEdgeVertex adds a vertex after the selected edge index', () => {
  const room = {
    roomId: 'room-a',
    roomPolygon: [
      { x: 0, y: 0 },
      { x: 80, y: 0 },
      { x: 80, y: 60 },
      { x: 0, y: 60 },
    ],
  };

  const nextPolygon = insertRoomGeometryEdgeVertex(room, 1, {
    x: 96,
    y: 32,
  });

  assert.deepEqual(nextPolygon, [
    { x: 0, y: 0 },
    { x: 80, y: 0 },
    { x: 96, y: 32 },
    { x: 80, y: 60 },
    { x: 0, y: 60 },
  ]);
  assert.deepEqual(room.roomPolygon, [
    { x: 0, y: 0 },
    { x: 80, y: 0 },
    { x: 80, y: 60 },
    { x: 0, y: 60 },
  ]);
});

test('insertRoomGeometryEdgeVertex can split the closing edge', () => {
  const room = {
    roomId: 'room-a',
    roomPolygon: [
      { x: 0, y: 0 },
      { x: 80, y: 0 },
      { x: 80, y: 60 },
      { x: 0, y: 60 },
    ],
  };

  assert.deepEqual(insertRoomGeometryEdgeVertex(room, 3, { x: -8, y: 24 }), [
    { x: 0, y: 0 },
    { x: 80, y: 0 },
    { x: 80, y: 60 },
    { x: 0, y: 60 },
    { x: -8, y: 24 },
  ]);
});

test('insertRoomGeometryEdgeVertex ignores out-of-range edge indexes', () => {
  const room = {
    roomId: 'room-a',
    roomPolygon: [
      { x: 0, y: 0 },
      { x: 80, y: 0 },
      { x: 80, y: 60 },
    ],
  };

  assert.equal(insertRoomGeometryEdgeVertex(room, -1, { x: 1, y: 1 }), null);
  assert.equal(insertRoomGeometryEdgeVertex(room, 3, { x: 1, y: 1 }), null);
});

test('removeRoomGeometryHandleVertex removes one selected vertex without mutating the room', () => {
  const room = {
    roomId: 'room-a',
    roomPolygon: [
      { x: 0, y: 0 },
      { x: 80, y: 0 },
      { x: 96, y: 32 },
      { x: 80, y: 60 },
      { x: 0, y: 60 },
    ],
  };

  const nextPolygon = removeRoomGeometryHandleVertex(room, {
    id: 'room-a:vertex:2',
    roomId: 'room-a',
    vertexIndex: 2,
    position: { x: 96, y: 32 },
  });

  assert.deepEqual(nextPolygon, [
    { x: 0, y: 0 },
    { x: 80, y: 0 },
    { x: 80, y: 60 },
    { x: 0, y: 60 },
  ]);
  assert.deepEqual(room.roomPolygon[2], { x: 96, y: 32 });
});

test('removeRoomGeometryHandleVertex keeps a minimum three-vertex room polygon', () => {
  const room = {
    roomId: 'room-a',
    roomPolygon: [
      { x: 0, y: 0 },
      { x: 80, y: 0 },
      { x: 80, y: 60 },
    ],
  };

  assert.equal(
    removeRoomGeometryHandleVertex(room, {
      id: 'room-a:vertex:1',
      roomId: 'room-a',
      vertexIndex: 1,
      position: { x: 80, y: 0 },
    }),
    null,
  );
});
