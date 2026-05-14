import assert from "node:assert/strict";
import test from "node:test";

import {
  createInsetPolygon,
  DEFAULT_FLOOR_BASE_OFFSET_MIN,
  DEFAULT_FLOOR_PERIMETER_INSET_MIN,
  DEFAULT_WALL_THICKNESS,
  resolveFloorBaseElevationOffset,
  resolveFloorPerimeterInset,
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

test("resolveFloorPerimeterInset computes a measurable floor setback from wall boundaries", () => {
  const inset = resolveFloorPerimeterInset();

  assert.equal(inset >= DEFAULT_FLOOR_PERIMETER_INSET_MIN, true);
});

test("resolveFloorPerimeterInset supports configurable wall-driven floor setbacks", () => {
  const inset = resolveFloorPerimeterInset({
    wallThickness: DEFAULT_WALL_THICKNESS * 2,
    floorPerimeterInsetRatio: 0.5,
    minimumFloorPerimeterInset: 0.01,
  });

  assert.equal(inset, DEFAULT_WALL_THICKNESS);
});

test("createInsetPolygon shrinks a room footprint inward on every perimeter edge", () => {
  const insetPolygon = createInsetPolygon(
    [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 4, y: 3 },
      { x: 0, y: 3 },
    ],
    0.2,
  );

  assert.deepEqual(insetPolygon, [
    { x: 0.2, y: 0.2 },
    { x: 3.8, y: 0.2 },
    { x: 3.8, y: 2.8 },
    { x: 0.2, y: 2.8 },
  ]);
});

test("createInsetPolygon preserves inward shrinking for clockwise room polygons", () => {
  const insetPolygon = createInsetPolygon(
    [
      { x: 0, y: 0 },
      { x: 0, y: 3 },
      { x: 4, y: 3 },
      { x: 4, y: 0 },
    ],
    0.2,
  );

  assert.deepEqual(insetPolygon, [
    { x: 0.2, y: 0.2 },
    { x: 0.2, y: 2.8 },
    { x: 3.8, y: 2.8 },
    { x: 3.8, y: 0.2 },
  ]);
});
