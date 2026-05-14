import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_FLOOR_BASE_OFFSET_MIN,
  DEFAULT_WALL_THICKNESS,
  resolveFloorBaseElevationOffset,
} from "../src/components/viewer/viewer25dGeometry.ts";

test("resolveFloorBaseElevationOffset places the floor slab on a distinct base layer below walls", () => {
  const offset = resolveFloorBaseElevationOffset();

  assert.equal(offset < 0, true);
  assert.equal(Math.abs(offset) >= DEFAULT_FLOOR_BASE_OFFSET_MIN, true);
});

test("resolveFloorBaseElevationOffset supports configurable wall-driven floor separation", () => {
  const offset = resolveFloorBaseElevationOffset({
    wallThickness: DEFAULT_WALL_THICKNESS * 2,
    floorBaseOffsetRatio: 0.5,
    minimumFloorBaseOffset: 0.01,
  });

  assert.equal(offset, -(DEFAULT_WALL_THICKNESS * 2 * 0.5));
});
