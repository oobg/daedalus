import assert from 'node:assert/strict';
import test from 'node:test';

import {
  hitTestRoomPolygon,
  isPointInRoomPolygon,
} from './roomHitTesting.ts';

test('isPointInRoomPolygon detects points inside an existing room polygon', () => {
  const polygon = [
    { x: 10, y: 10 },
    { x: 90, y: 10 },
    { x: 90, y: 70 },
    { x: 10, y: 70 },
  ];

  assert.equal(isPointInRoomPolygon({ x: 32, y: 40 }, polygon), true);
  assert.equal(isPointInRoomPolygon({ x: 6, y: 40 }, polygon), false);
});

test('isPointInRoomPolygon treats room polygon boundaries as selectable hits', () => {
  const polygon = [
    { x: 10, y: 10 },
    { x: 90, y: 10 },
    { x: 90, y: 70 },
    { x: 10, y: 70 },
  ];

  assert.equal(isPointInRoomPolygon({ x: 10, y: 32 }, polygon), true);
  assert.equal(isPointInRoomPolygon({ x: 90, y: 70 }, polygon), true);
});

test('hitTestRoomPolygon returns the topmost room polygon at a canvas point', () => {
  const bottomRoom = {
    roomId: 'room-bottom',
    roomPolygon: [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ],
  };
  const topRoom = {
    roomId: 'room-top',
    roomPolygon: [
      { x: 50, y: 50 },
      { x: 130, y: 50 },
      { x: 130, y: 130 },
      { x: 50, y: 130 },
    ],
  };

  assert.equal(
    hitTestRoomPolygon({ rooms: [bottomRoom, topRoom] }, { x: 75, y: 75 }),
    topRoom,
  );
});

test('hitTestRoomPolygon returns null when no room polygon contains the canvas point', () => {
  assert.equal(
    hitTestRoomPolygon({
      rooms: [
        {
          roomId: 'room-a',
          roomPolygon: [
            { x: 0, y: 0 },
            { x: 20, y: 0 },
            { x: 20, y: 20 },
            { x: 0, y: 20 },
          ],
        },
      ],
    }, { x: 40, y: 40 }),
    null,
  );
});
