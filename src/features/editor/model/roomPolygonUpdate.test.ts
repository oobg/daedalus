import assert from 'node:assert/strict';
import test from 'node:test';

import {
  collectRoomDraftPoints,
  finalizeRoomDraftPolygon,
  type RoomPolygon,
} from './roomDraft.ts';
import {
  createRoomPolygon,
  deleteActiveRoomPolygonEdge,
  deleteActiveRoomPolygonVertex,
  insertActiveRoomPolygonEdgeVertex,
  insertActiveRoomPolygonVertex,
  moveActiveRoomPolygonEdge,
  moveActiveRoomPolygonVertex,
  updateActiveRoomPolygon,
  type RoomPolygonUpdateState,
} from './roomPolygonUpdate.ts';

interface TestRoom {
  readonly id: string;
  readonly name: string;
  readonly polygon: RoomPolygon;
  readonly area: number;
  readonly labelPosition: {
    readonly x: number;
    readonly y: number;
  } | null;
}

const createPolygon = (roomId: string, originX: number): RoomPolygon =>
  finalizeRoomDraftPolygon(
    collectRoomDraftPoints(roomId, [
      { x: originX, y: 0 },
      { x: originX + 4, y: 0 },
      { x: originX + 4, y: 3 },
      { x: originX, y: 3 },
    ]),
  );

test('createRoomPolygon finalizes ordered draft points into normalized room geometry', () => {
  const result = createRoomPolygon('room-a', [
    { x: 4, y: 3 },
    { x: 0, y: 3 },
    { x: 0, y: 0 },
    { x: 4, y: 0 },
  ]);

  assert.deepEqual(result, {
    polygon: {
      roomId: 'room-a',
      points: [
        { x: 0, y: 0 },
        { x: 4, y: 0 },
        { x: 4, y: 3 },
        { x: 0, y: 3 },
        { x: 0, y: 0 },
      ],
    },
  });
});

test('updateActiveRoomPolygon applies the edit only to the active room polygon', () => {
  const roomA: TestRoom = {
    id: 'room-a',
    name: 'Lobby',
    polygon: createPolygon('room-a', 0),
    area: 12,
    labelPosition: { x: 2, y: 1.5 },
  };
  const roomB: TestRoom = {
    id: 'room-b',
    name: 'Office',
    polygon: createPolygon('room-b', 10),
    area: 12,
    labelPosition: { x: 12, y: 1.5 },
  };
  const roomC: TestRoom = {
    id: 'room-c',
    name: 'Storage',
    polygon: createPolygon('room-c', 20),
    area: 12,
    labelPosition: { x: 22, y: 1.5 },
  };
  const state: RoomPolygonUpdateState<TestRoom> = {
    rooms: [roomA, roomB, roomC],
    activeRoomId: 'room-b',
  };

  const result = updateActiveRoomPolygon(state, (polygon) => ({
    ...polygon,
    points: polygon.points.map((point, index) =>
      index === 1
        ? {
            x: point.x + 2,
            y: point.y + 1,
          }
        : point,
    ),
  }));

  assert.equal(result.state.activeRoomId, 'room-b');
  assert.equal(result.state.rooms[0], roomA);
  assert.equal(result.state.rooms[2], roomC);
  assert.notEqual(result.state.rooms[1], roomB);
  assert.notEqual(result.state.rooms[1].polygon, roomB.polygon);
  assert.deepEqual(result.room, result.state.rooms[1]);
  assert.deepEqual(result.state.rooms[1], {
    id: 'room-b',
    name: 'Office',
    polygon: {
      roomId: 'room-b',
      points: [
        { x: 10, y: 0 },
        { x: 16, y: 1 },
        { x: 14, y: 3 },
        { x: 10, y: 3 },
        { x: 10, y: 0 },
      ],
    },
    area: 13,
    labelPosition: {
      x: 12.5,
      y: 1.75,
    },
  });
  assert.deepEqual(state, {
    rooms: [roomA, roomB, roomC],
    activeRoomId: 'room-b',
  });
});

test('moveActiveRoomPolygonVertex edits only the active room and returns updated geometry', () => {
  const roomA: TestRoom = {
    id: 'room-a',
    name: 'Lobby',
    polygon: createPolygon('room-a', 0),
    area: 12,
    labelPosition: { x: 2, y: 1.5 },
  };
  const roomB: TestRoom = {
    id: 'room-b',
    name: 'Office',
    polygon: createPolygon('room-b', 10),
    area: 12,
    labelPosition: { x: 12, y: 1.5 },
  };
  const state: RoomPolygonUpdateState<TestRoom> = {
    rooms: [roomA, roomB],
    activeRoomId: 'room-b',
  };

  const result = moveActiveRoomPolygonVertex(state, 1, { x: 16, y: 1 });

  assert.equal(result.ok, true);

  if (!result.ok) {
    return;
  }

  assert.equal(result.state.rooms[0], roomA);
  assert.notEqual(result.state.rooms[1], roomB);
  assert.deepEqual(result.geometry, {
    ok: true,
    polygon: {
      roomId: 'room-b',
      points: [
        { x: 10, y: 0 },
        { x: 16, y: 1 },
        { x: 14, y: 3 },
        { x: 10, y: 3 },
        { x: 10, y: 0 },
      ],
    },
  });
  assert.deepEqual(result.room, {
    id: 'room-b',
    name: 'Office',
    polygon: result.geometry.polygon,
    area: 13,
    labelPosition: {
      x: 12.5,
      y: 1.75,
    },
  });
  assert.deepEqual(state, {
    rooms: [roomA, roomB],
    activeRoomId: 'room-b',
  });
});

test('moveActiveRoomPolygonEdge translates only the active room edge and recalculates derived metadata', () => {
  const roomA: TestRoom = {
    id: 'room-a',
    name: 'Lobby',
    polygon: createPolygon('room-a', 0),
    area: 12,
    labelPosition: { x: 2, y: 1.5 },
  };
  const roomB: TestRoom = {
    id: 'room-b',
    name: 'Office',
    polygon: createPolygon('room-b', 10),
    area: 12,
    labelPosition: { x: 12, y: 1.5 },
  };
  const state: RoomPolygonUpdateState<TestRoom> = {
    rooms: [roomA, roomB],
    activeRoomId: 'room-b',
  };

  const result = moveActiveRoomPolygonEdge(state, 1, { x: 2, y: 1 });

  assert.equal(result.ok, true);

  if (!result.ok) {
    return;
  }

  assert.equal(result.state.rooms[0], roomA);
  assert.notEqual(result.state.rooms[1], roomB);
  assert.deepEqual(result.geometry, {
    ok: true,
    polygon: {
      roomId: 'room-b',
      points: [
        { x: 10, y: 0 },
        { x: 16, y: 1 },
        { x: 16, y: 4 },
        { x: 10, y: 3 },
        { x: 10, y: 0 },
      ],
    },
  });
  assert.deepEqual(result.room, {
    id: 'room-b',
    name: 'Office',
    polygon: result.geometry.polygon,
    area: 18,
    labelPosition: {
      x: 13,
      y: 2,
    },
  });
  assert.deepEqual(state, {
    rooms: [roomA, roomB],
    activeRoomId: 'room-b',
  });
});

test('insertActiveRoomPolygonVertex inserts a new active-room vertex without mutating the previous state', () => {
  const room: TestRoom = {
    id: 'room-a',
    name: 'Lobby',
    polygon: createPolygon('room-a', 0),
    area: 12,
    labelPosition: { x: 2, y: 1.5 },
  };
  const state: RoomPolygonUpdateState<TestRoom> = {
    rooms: [room],
    activeRoomId: 'room-a',
  };

  const result = insertActiveRoomPolygonVertex(state, 1, { x: 6, y: 2 });

  assert.equal(result.ok, true);

  if (!result.ok) {
    return;
  }

  assert.deepEqual(result.room.polygon.points, [
    { x: 0, y: 0 },
    { x: 4, y: 0 },
    { x: 6, y: 2 },
    { x: 4, y: 3 },
    { x: 0, y: 3 },
    { x: 0, y: 0 },
  ]);
  assert.equal(result.room.area, 15);
  assert.deepEqual(result.room.labelPosition, {
    x: 2.8,
    y: 1.6,
  });
  assert.deepEqual(room.polygon.points, [
    { x: 0, y: 0 },
    { x: 4, y: 0 },
    { x: 4, y: 3 },
    { x: 0, y: 3 },
    { x: 0, y: 0 },
  ]);
});

test('insertActiveRoomPolygonEdgeVertex inserts along the targeted edge and updates active-room derived metadata', () => {
  const room: TestRoom = {
    id: 'room-a',
    name: 'Lobby',
    polygon: createPolygon('room-a', 0),
    area: 12,
    labelPosition: { x: 2, y: 1.5 },
  };
  const state: RoomPolygonUpdateState<TestRoom> = {
    rooms: [room],
    activeRoomId: 'room-a',
  };

  const result = insertActiveRoomPolygonEdgeVertex(state, 1, { x: 6, y: 2 });

  assert.equal(result.ok, true);

  if (!result.ok) {
    return;
  }

  assert.deepEqual(result.geometry, {
    ok: true,
    polygon: {
      roomId: 'room-a',
      points: [
        { x: 0, y: 0 },
        { x: 4, y: 0 },
        { x: 6, y: 2 },
        { x: 4, y: 3 },
        { x: 0, y: 3 },
        { x: 0, y: 0 },
      ],
    },
  });
  assert.equal(result.room.area, 15);
  assert.deepEqual(result.room.labelPosition, {
    x: 2.8,
    y: 1.6,
  });
  assert.deepEqual(room.polygon.points, [
    { x: 0, y: 0 },
    { x: 4, y: 0 },
    { x: 4, y: 3 },
    { x: 0, y: 3 },
    { x: 0, y: 0 },
  ]);
});

test('deleteActiveRoomPolygonVertex removes the active-room vertex and returns the reduced polygon', () => {
  const polygon = finalizeRoomDraftPolygon(
    collectRoomDraftPoints('room-a', [
      { x: 0, y: 0 },
      { x: 8, y: 0 },
      { x: 8, y: 4 },
      { x: 4, y: 6 },
      { x: 0, y: 4 },
    ]),
  );
  const room: TestRoom = {
    id: 'room-a',
    name: 'Lobby',
    polygon,
    area: 40,
    labelPosition: { x: 4, y: 2.8 },
  };
  const state: RoomPolygonUpdateState<TestRoom> = {
    rooms: [room],
    activeRoomId: 'room-a',
  };

  const result = deleteActiveRoomPolygonVertex(state, 0);

  assert.equal(result.ok, true);

  if (!result.ok) {
    return;
  }

  assert.deepEqual(result.geometry, {
    ok: true,
    polygon: {
      roomId: 'room-a',
      points: [
        { x: 8, y: 0 },
        { x: 8, y: 4 },
        { x: 4, y: 6 },
        { x: 0, y: 4 },
        { x: 8, y: 0 },
      ],
    },
  });
  assert.equal(result.room.area, 24);
  assert.deepEqual(result.room.labelPosition, {
    x: 5,
    y: 3.5,
  });
});

test('deleteActiveRoomPolygonEdge collapses the targeted active-room edge and recalculates derived metadata', () => {
  const polygon = finalizeRoomDraftPolygon(
    collectRoomDraftPoints('room-a', [
      { x: 0, y: 0 },
      { x: 8, y: 0 },
      { x: 8, y: 4 },
      { x: 4, y: 6 },
      { x: 0, y: 4 },
    ]),
  );
  const room: TestRoom = {
    id: 'room-a',
    name: 'Lobby',
    polygon,
    area: 40,
    labelPosition: { x: 4, y: 2.8 },
  };
  const state: RoomPolygonUpdateState<TestRoom> = {
    rooms: [room],
    activeRoomId: 'room-a',
  };

  const result = deleteActiveRoomPolygonEdge(state, 1);

  assert.equal(result.ok, true);

  if (!result.ok) {
    return;
  }

  assert.deepEqual(result.geometry, {
    ok: true,
    polygon: {
      roomId: 'room-a',
      points: [
        { x: 0, y: 0 },
        { x: 8, y: 0 },
        { x: 4, y: 6 },
        { x: 0, y: 4 },
        { x: 0, y: 0 },
      ],
    },
  });
  assert.equal(result.room.area, 32);
  assert.deepEqual(result.room.labelPosition, {
    x: 3,
    y: 2.5,
  });
});

test('moveActiveRoomPolygonVertex returns an error and preserves state when the edit is invalid', () => {
  const room: TestRoom = {
    id: 'room-a',
    name: 'Lobby',
    polygon: finalizeRoomDraftPolygon(
      collectRoomDraftPoints('room-a', [
        { x: 0, y: 0 },
        { x: 8, y: 0 },
        { x: 8, y: 8 },
        { x: 0, y: 8 },
      ]),
    ),
    area: 64,
    labelPosition: { x: 4, y: 4 },
  };
  const state: RoomPolygonUpdateState<TestRoom> = {
    rooms: [room],
    activeRoomId: 'room-a',
  };

  const result = moveActiveRoomPolygonVertex(state, 2, { x: -2, y: 2 });

  assert.deepEqual(result, {
    ok: false,
    error: 'invalid_polygon',
    validation: {
      code: 'polygon_area_must_be_non_zero',
      message: 'A room polygon must define a valid simple closed shape.',
    },
  });
  assert.deepEqual(state, {
    rooms: [room],
    activeRoomId: 'room-a',
  });
});

test('updateActiveRoomPolygon recalculates stored area from the edited polygon', () => {
  const room: TestRoom = {
    id: 'room-a',
    name: 'Lobby',
    polygon: createPolygon('room-a', 0),
    area: 12,
    labelPosition: { x: 2, y: 1.5 },
  };
  const state: RoomPolygonUpdateState<TestRoom> = {
    rooms: [room],
    activeRoomId: 'room-a',
  };

  const result = updateActiveRoomPolygon(state, (polygon) => ({
    ...polygon,
    points: [
      { x: 0, y: 0 },
      { x: 6, y: 0 },
      { x: 6, y: 4 },
      { x: 0, y: 4 },
      { x: 0, y: 0 },
    ],
  }));

  assert.equal(result.room.area, 24);
  assert.equal(result.state.rooms[0].area, 24);
  assert.deepEqual(result.room.labelPosition, {
    x: 3,
    y: 2,
  });
  assert.deepEqual(result.state.rooms[0].labelPosition, {
    x: 3,
    y: 2,
  });
  assert.equal(room.area, 12);
  assert.deepEqual(room.labelPosition, {
    x: 2,
    y: 1.5,
  });
});
