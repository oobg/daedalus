import assert from 'node:assert/strict';
import test from 'node:test';

import { roomPolygonHasSelfIntersection } from './roomPolygonSelfIntersection.ts';

test('roomPolygonHasSelfIntersection returns true when polygon edges cross', () => {
  assert.equal(
    roomPolygonHasSelfIntersection([
      { x: 0, y: 0 },
      { x: 6, y: 0 },
      { x: 2, y: 4 },
      { x: 6, y: 6 },
      { x: 0, y: 6 },
      { x: 4, y: 2 },
      { x: 0, y: 0 },
    ]),
    true,
  );
});

test('roomPolygonHasSelfIntersection returns false for a simple closed polygon', () => {
  assert.equal(
    roomPolygonHasSelfIntersection([
      { x: 0, y: 0 },
      { x: 8, y: 0 },
      { x: 8, y: 6 },
      { x: 4, y: 8 },
      { x: 0, y: 6 },
      { x: 0, y: 0 },
    ]),
    false,
  );
});

test('roomPolygonHasSelfIntersection returns true when canonical polygon edges overlap at floating-point precision', () => {
  assert.equal(
    roomPolygonHasSelfIntersection([
      { x: 0, y: 0 },
      { x: 6.5, y: 0 },
      { x: 2.5, y: 4.25 },
      { x: 6.5, y: 4.25 },
      { x: 0, y: 4.25 },
      { x: 2.5, y: -1e-10 },
      { x: 0, y: 0 },
    ]),
    true,
  );
});
