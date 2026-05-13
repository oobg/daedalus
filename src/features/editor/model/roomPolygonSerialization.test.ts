import assert from 'node:assert/strict';
import test from 'node:test';

import {
  finalizeRoomDraftPolygon,
  type RoomPolygon,
} from './roomDraft.ts';
import { serializeRoomPolygon } from './roomPolygonSerialization.ts';

test('serializeRoomPolygon emits stable JSON-safe polygon data', () => {
  const polygon = finalizeRoomDraftPolygon({
    roomId: 'room-atrium',
    points: [
      { x: 12, y: 8 },
      { x: 12, y: 2 },
      { x: 4, y: 2 },
      { x: 4, y: 8 },
    ],
  });

  const serialized = serializeRoomPolygon(polygon);
  const roundTripped = JSON.parse(JSON.stringify(serialized)) as RoomPolygon;

  assert.deepEqual(serialized, {
    roomId: 'room-atrium',
    points: [
      { x: 4, y: 2 },
      { x: 12, y: 2 },
      { x: 12, y: 8 },
      { x: 4, y: 8 },
      { x: 4, y: 2 },
    ],
  });
  assert.deepEqual(roundTripped, serialized);
  assert.notStrictEqual(roundTripped.points, serialized.points);
});
