import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getSelectedRoomGeometryHandles,
  getSelectedRoomGeometrySelectionState,
  insertRoomGeometryEdgeVertex,
  moveRoomGeometryHandleVertex,
  moveRoomGeometryPolygon,
  removeRoomGeometryHandleVertex,
  translateRoomGeometrySource,
} from './roomGeometryHandles.ts';

test('getSelectedRoomGeometrySelectionState describes the editable selected room object', () => {
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
        { x: 120, y: 24 },
        { x: 180, y: 0 },
        { x: 190, y: 40 },
        { x: 130, y: 72 },
      ],
    },
  ];

  const selection = getSelectedRoomGeometrySelectionState({
    rooms,
    selectedRoomId: 'room-b',
  });

  assert.deepEqual(selection, {
    roomId: 'room-b',
    polygonPoints: [
      { x: 120, y: 24 },
      { x: 180, y: 0 },
      { x: 190, y: 40 },
      { x: 130, y: 72 },
    ],
    bounds: {
      x: 120,
      y: 0,
      width: 70,
      height: 72,
    },
    vertexHandles: [
      {
        id: 'room-b:vertex:0',
        roomId: 'room-b',
        vertexIndex: 0,
        position: { x: 120, y: 24 },
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
        position: { x: 190, y: 40 },
      },
      {
        id: 'room-b:vertex:3',
        roomId: 'room-b',
        vertexIndex: 3,
        position: { x: 130, y: 72 },
      },
    ],
    edgeHandles: [
      {
        id: 'room-b:edge-insert:0',
        roomId: 'room-b',
        edgeIndex: 0,
        position: { x: 150, y: 12 },
      },
      {
        id: 'room-b:edge-insert:1',
        roomId: 'room-b',
        edgeIndex: 1,
        position: { x: 185, y: 20 },
      },
      {
        id: 'room-b:edge-insert:2',
        roomId: 'room-b',
        edgeIndex: 2,
        position: { x: 160, y: 56 },
      },
      {
        id: 'room-b:edge-insert:3',
        roomId: 'room-b',
        edgeIndex: 3,
        position: { x: 125, y: 48 },
      },
    ],
  });
});

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

test('moveRoomGeometryPolygon translates every vertex by the same delta without changing shape', () => {
  const room = {
    roomId: 'room-a',
    roomPolygon: [
      { x: 0, y: 0 },
      { x: 80, y: 0 },
      { x: 96, y: 40 },
      { x: 0, y: 60 },
    ],
  };

  const nextPolygon = moveRoomGeometryPolygon(room, { x: 12, y: -8 });

  assert.deepEqual(nextPolygon, [
    { x: 12, y: -8 },
    { x: 92, y: -8 },
    { x: 108, y: 32 },
    { x: 12, y: 52 },
  ]);
  assert.deepEqual(room.roomPolygon, [
    { x: 0, y: 0 },
    { x: 80, y: 0 },
    { x: 96, y: 40 },
    { x: 0, y: 60 },
  ]);

  const originalEdgeVectors = room.roomPolygon.map((point, index) => {
    const nextPoint = room.roomPolygon[(index + 1) % room.roomPolygon.length];
    return { x: nextPoint.x - point.x, y: nextPoint.y - point.y };
  });
  const movedEdgeVectors = nextPolygon!.map((point, index) => {
    const nextPoint = nextPolygon![(index + 1) % nextPolygon!.length];
    return { x: nextPoint.x - point.x, y: nextPoint.y - point.y };
  });

  assert.deepEqual(movedEdgeVectors, originalEdgeVectors);
});

test('moveRoomGeometryPolygon ignores non-finite movement deltas', () => {
  const room = {
    roomId: 'room-a',
    roomPolygon: [
      { x: 0, y: 0 },
      { x: 80, y: 0 },
      { x: 80, y: 60 },
    ],
  };

  assert.equal(moveRoomGeometryPolygon(room, { x: Number.NaN, y: 4 }), null);
  assert.equal(
    moveRoomGeometryPolygon(room, { x: 4, y: Number.POSITIVE_INFINITY }),
    null,
  );
});

test('translateRoomGeometrySource writes whole-room movement into the source polygon', () => {
  const room = {
    roomId: 'room-a',
    roomPolygon: [
      { x: 10, y: 10 },
      { x: 50, y: 10 },
      { x: 50, y: 30 },
      { x: 10, y: 30 },
    ],
    openings: [
      {
        id: 'opening-a',
        type: 'door' as const,
        x: 30,
        y: 10,
        angle: 0,
      },
    ],
  };

  const translated = translateRoomGeometrySource(room, { x: -4, y: 12 });

  assert.deepEqual(translated, {
    roomPolygon: [
      { x: 6, y: 22 },
      { x: 46, y: 22 },
      { x: 46, y: 42 },
      { x: 6, y: 42 },
    ],
    openings: [
      {
        id: 'opening-a',
        type: 'door',
        x: 26,
        y: 22,
        angle: 0,
      },
    ],
  });
  assert.deepEqual(room.roomPolygon[0], { x: 10, y: 10 });
  assert.deepEqual(room.openings[0], {
    id: 'opening-a',
    type: 'door',
    x: 30,
    y: 10,
    angle: 0,
  });
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
