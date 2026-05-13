import assert from 'node:assert/strict';
import test from 'node:test';

import { normalizeRoomPolygonPoints } from './roomPolygonNormalization.ts';

test('normalizeRoomPolygonPoints returns the same canonical ordering for equivalent polygons', () => {
  const clockwiseShiftedPolygon = [
    { x: 8, y: 4 },
    { x: 8, y: 0 },
    { x: 2, y: 0 },
    { x: 2, y: 4 },
    { x: 8, y: 4 },
  ] as const;
  const counterClockwiseShiftedPolygon = [
    { x: 2, y: 4 },
    { x: 2, y: 0 },
    { x: 8, y: 0 },
    { x: 8, y: 4 },
    { x: 2, y: 4 },
  ] as const;

  const normalizedClockwise = normalizeRoomPolygonPoints(
    clockwiseShiftedPolygon,
  );
  const normalizedCounterClockwise = normalizeRoomPolygonPoints(
    counterClockwiseShiftedPolygon,
  );

  assert.deepEqual(normalizedClockwise, [
    { x: 2, y: 0 },
    { x: 8, y: 0 },
    { x: 8, y: 4 },
    { x: 2, y: 4 },
    { x: 2, y: 0 },
  ]);
  assert.deepEqual(normalizedCounterClockwise, normalizedClockwise);
});
