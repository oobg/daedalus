import assert from 'node:assert/strict';
import test from 'node:test';

import { selectRoom, type RoomSelectionState } from './roomSelection.ts';

interface TestRoom {
  readonly id: string;
  readonly name: string;
  readonly isActive: boolean;
}

test('selectRoom marks the requested room as active without mutating other room objects', () => {
  const roomA: TestRoom = {
    id: 'room-a',
    name: 'Lobby',
    isActive: false,
  };
  const roomB: TestRoom = {
    id: 'room-b',
    name: 'Office',
    isActive: false,
  };
  const state: RoomSelectionState<TestRoom> = {
    rooms: [roomA, roomB],
    activeRoomId: null,
  };

  const result = selectRoom(state, 'room-b');

  assert.equal(result.state.activeRoomId, 'room-b');
  assert.deepEqual(result.activeRoom, {
    id: 'room-b',
    name: 'Office',
    isActive: true,
  });
  assert.equal(result.state.rooms[0], roomA);
  assert.notEqual(result.state.rooms[1], roomB);
  assert.deepEqual(result.state.rooms, [
    roomA,
    {
      id: 'room-b',
      name: 'Office',
      isActive: true,
    },
  ]);
  assert.deepEqual(state, {
    rooms: [roomA, roomB],
    activeRoomId: null,
  });
});
