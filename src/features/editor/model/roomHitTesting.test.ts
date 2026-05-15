import assert from 'node:assert/strict';
import test from 'node:test';

import {
  hitTestRoomPolygon,
  isPointInRoomPolygon,
  resolveRoomHitTest,
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

test('resolveRoomHitTest returns the topmost overlapping room when the pointer is inside multiple polygons', () => {
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
      { x: 40, y: 40 },
      { x: 120, y: 40 },
      { x: 120, y: 120 },
      { x: 40, y: 120 },
    ],
  };

  assert.deepEqual(
    resolveRoomHitTest({ rooms: [bottomRoom, topRoom] }, { x: 60, y: 60 }),
    {
      room: topRoom,
      kind: 'contains',
      distance: 0,
    },
  );
});

test('resolveRoomHitTest returns the nearest room polygon when the pointer misses every room', () => {
  const leftRoom = {
    roomId: 'room-left',
    roomPolygon: [
      { x: 0, y: 0 },
      { x: 20, y: 0 },
      { x: 20, y: 20 },
      { x: 0, y: 20 },
    ],
  };
  const rightRoom = {
    roomId: 'room-right',
    roomPolygon: [
      { x: 60, y: 0 },
      { x: 80, y: 0 },
      { x: 80, y: 20 },
      { x: 60, y: 20 },
    ],
  };

  const result = resolveRoomHitTest(
    { rooms: [leftRoom, rightRoom] },
    { x: 48, y: 10 },
  );

  assert.notEqual(result, null);
  assert.equal(result?.room, rightRoom);
  assert.equal(result?.kind, 'nearest');
  assert.equal(result?.distance, 12);
});

test('resolveRoomHitTest returns null when there are no room polygons to test', () => {
  assert.equal(resolveRoomHitTest({ rooms: [] }, { x: 10, y: 10 }), null);
});
