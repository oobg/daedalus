import assert from "node:assert/strict";
import test from "node:test";

import { validateFurnitureWallClearance } from "../src/features/viewer/furniture-wall-clearance.ts";

test("validateFurnitureWallClearance accepts a furniture footprint that already preserves the minimum wall separation", () => {
  const validation = validateFurnitureWallClearance(
    [
      { x: 0, y: 0 },
      { x: 6, y: 0 },
      { x: 6, y: 4 },
      { x: 0, y: 4 },
    ],
    [
      { x: 2, y: 1.5 },
      { x: 4, y: 1.5 },
      { x: 4, y: 2.5 },
      { x: 2, y: 2.5 },
    ],
    0.5,
  );

  assert.equal(validation.isValid, true);
  assert.equal(validation.reason, "clear");
  assert.deepEqual(validation.suggestedFootprint, [
    { x: 2, y: 1.5 },
    { x: 4, y: 1.5 },
    { x: 4, y: 2.5 },
    { x: 2, y: 2.5 },
  ]);
});

test("validateFurnitureWallClearance rejects a near-wall footprint and returns a wall-safe repositioned footprint", () => {
  const validation = validateFurnitureWallClearance(
    [
      { x: 0, y: 0 },
      { x: 6, y: 0 },
      { x: 6, y: 4 },
      { x: 0, y: 4 },
    ],
    [
      { x: 0.2, y: 0.3 },
      { x: 2.2, y: 0.3 },
      { x: 2.2, y: 1.3 },
      { x: 0.2, y: 1.3 },
    ],
    0.5,
  );

  assert.equal(validation.isValid, false);
  assert.equal(validation.reason, "intersects-clearance-zone");
  assert.deepEqual(validation.placementBounds, {
    minX: 1.5,
    maxX: 4.5,
    minY: 1,
    maxY: 3,
  });
  assert.deepEqual(validation.suggestedFootprint, [
    { x: 0.5, y: 0.5 },
    { x: 2.5, y: 0.5 },
    { x: 2.5, y: 1.5 },
    { x: 0.5, y: 1.5 },
  ]);
});

test("validateFurnitureWallClearance reports when the room cannot support the requested clearance envelope", () => {
  const validation = validateFurnitureWallClearance(
    [
      { x: 0, y: 0 },
      { x: 2.4, y: 0 },
      { x: 2.4, y: 2 },
      { x: 0, y: 2 },
    ],
    [
      { x: 0.2, y: 0.5 },
      { x: 2.2, y: 0.5 },
      { x: 2.2, y: 1.5 },
      { x: 0.2, y: 1.5 },
    ],
    0.5,
  );

  assert.equal(validation.isValid, false);
  assert.equal(validation.reason, "room-too-tight");
  assert.equal(validation.placementBounds, null);
  assert.equal(validation.suggestedFootprint, null);
  assert.deepEqual(validation.safeInteriorFootprint, [
    { x: 0.5, y: 0.5 },
    { x: 1.9, y: 0.5 },
    { x: 1.9, y: 1.5 },
    { x: 0.5, y: 1.5 },
  ]);
});
