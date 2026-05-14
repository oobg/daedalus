import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_FURNITURE_LAYER_OFFSET,
  resolveFurnitureBaseElevation,
  resolveFurnitureVerticalPlacement,
} from "../src/features/viewer/furniture-base-elevation.ts";

test("resolveFurnitureBaseElevation applies the default furniture layer offset above the floor elevation", () => {
  const floorElevation = 1.2;
  const baseY = resolveFurnitureBaseElevation(floorElevation);

  assert.equal(baseY, floorElevation + DEFAULT_FURNITURE_LAYER_OFFSET);
});

test("resolveFurnitureBaseElevation supports a custom furniture layer offset for tuned scene layering", () => {
  const baseY = resolveFurnitureBaseElevation(2.75, {
    layerOffset: 0.028,
  });

  assert.equal(baseY, 2.778);
});

test("resolveFurnitureBaseElevation preserves the floor elevation when the furniture layer offset is explicitly zero", () => {
  const floorElevation = 4.5;
  const baseY = resolveFurnitureBaseElevation(floorElevation, {
    layerOffset: 0,
  });

  assert.equal(baseY, floorElevation);
});

test("resolveFurnitureVerticalPlacement applies the standard layer offset to placed furniture and reports its vertical extents", () => {
  const placement = resolveFurnitureVerticalPlacement(1.2, {
    height: 0.82,
  });

  assert.deepEqual(placement, {
    baseElevation: 1.214,
    centerElevation: 1.624,
    topElevation: 2.034,
    height: 0.82,
    layerOffset: DEFAULT_FURNITURE_LAYER_OFFSET,
  });
});

test("resolveFurnitureVerticalPlacement supports tuned layer offsets while keeping furniture height-derived extents consistent", () => {
  const placement = resolveFurnitureVerticalPlacement(2.75, {
    height: 0.56,
    layerOffset: 0.028,
  });

  assert.deepEqual(placement, {
    baseElevation: 2.778,
    centerElevation: 3.058,
    topElevation: 3.338,
    height: 0.56,
    layerOffset: 0.028,
  });
});
