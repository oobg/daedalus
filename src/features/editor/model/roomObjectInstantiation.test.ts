import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createRoomObjectFromClosedPolygon,
  tryCreateRoomObjectFromClosedPolygon,
} from './roomObjectInstantiation.ts';

test('createRoomObjectFromClosedPolygon creates editor room state from a closed polygon and stores an open polygon source', () => {
  const room = createRoomObjectFromClosedPolygon({
    roomId: 'room-closed-1',
    roomName: 'North Lobby',
    closedPolygon: [
      { x: 0, y: 0 },
      { x: 12, y: 0 },
      { x: 12, y: 8 },
      { x: 0, y: 8 },
      { x: 0, y: 0 },
    ],
  });

  assert.deepEqual(room, {
    roomId: 'room-closed-1',
    roomName: 'North Lobby',
    roomPolygon: [
      { x: 0, y: 0 },
      { x: 12, y: 0 },
      { x: 12, y: 8 },
      { x: 0, y: 8 },
    ],
    sharedBoundaries: [],
    area: 96,
    labelPosition: {
      x: 6,
      y: 4,
    },
    openings: [],
  });
});

test('createRoomObjectFromClosedPolygon rejects polygons that are not closed', () => {
  assert.throws(
    () =>
      createRoomObjectFromClosedPolygon({
        roomId: 'room-open-1',
        roomName: 'Open Shape',
        closedPolygon: [
          { x: 0, y: 0 },
          { x: 4, y: 0 },
          { x: 4, y: 4 },
          { x: 0, y: 4 },
        ],
      }),
    /must be closed before room creation/,
  );
});

test('tryCreateRoomObjectFromClosedPolygon returns a structured validation result for invalid room geometry', () => {
  const result = tryCreateRoomObjectFromClosedPolygon({
    roomId: 'room-invalid-1',
    roomName: 'Invalid Shape',
    closedPolygon: [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 4, y: 4 },
      { x: 0, y: 4 },
    ],
  });

  assert.deepEqual(result, {
    ok: false,
    error: 'invalid_polygon',
    validation: {
      code: 'polygon_must_be_closed',
      message: 'A room polygon must be closed before room creation.',
    },
  });
});
