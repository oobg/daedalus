import assert from "node:assert/strict";
import test from "node:test";

import {
  createContactShadowFootprint,
  getContactShadowActivationPreset,
  resolveContactShadowPlacement,
} from "../src/features/viewer/index.ts";

test("contact shadow placement centers the shadow under the intended architectural footprint", () => {
  const settings = getContactShadowActivationPreset("miniatureArchitecture");
  const floorFootprint = createContactShadowFootprint(
    "floor",
    [
      { x: -1.2, z: -0.8 },
      { x: 1.8, z: -0.8 },
      { x: 1.8, z: 1.4 },
      { x: -1.2, z: 1.4 },
    ],
    -0.012,
  );
  const wallFootprint = createContactShadowFootprint(
    "wall",
    [
      { x: -1.35, z: -0.95 },
      { x: 1.95, z: -0.95 },
      { x: 1.95, z: 1.55 },
      { x: -1.35, z: 1.55 },
    ],
    0.014,
  );

  assert.ok(floorFootprint != null);
  assert.ok(wallFootprint != null);

  const placement = resolveContactShadowPlacement(settings, [
    floorFootprint,
    wallFootprint,
  ]);

  assert.ok(placement != null);
  assert.deepEqual(
    placement.position.map((value) => Number(value.toFixed(4))),
    [0.3, -0.007, 0.3],
  );
  assert.deepEqual(
    placement.scale.map((value) => Number(value.toFixed(2))),
    [3.66, 2.86],
  );
  assert.equal(Number(placement.far.toFixed(4)), 2.4888);
  assert.equal(placement.blur, settings.blur);
  assert.equal(placement.opacity, settings.opacity);
  assert.ok(Object.isFrozen(placement));
  assert.ok(Object.isFrozen(placement.position));
  assert.ok(Object.isFrozen(placement.scale));
});

test("contact shadow placement ignores excluded element kinds and returns null when nothing eligible remains", () => {
  const settings = getContactShadowActivationPreset("miniatureArchitecture");
  const furnitureOnlyPlacement = resolveContactShadowPlacement(
    {
      ...settings,
      elements: ["furniture"],
    },
    [
      createContactShadowFootprint(
        "wall",
        [
          { x: 0, z: 0 },
          { x: 2, z: 0 },
          { x: 2, z: 1 },
          { x: 0, z: 1 },
        ],
        0.014,
      )!,
    ],
  );

  assert.equal(furnitureOnlyPlacement, null);
});
