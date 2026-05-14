import assert from "node:assert/strict";
import test from "node:test";

import {
  configureContactShadowSoftness,
  createContactShadowFootprint,
  getContactShadowActivationPreset,
  getContactShadowSoftnessPreset,
  resolveContactShadowPlacement,
  resolveContactShadowRenderState,
} from "../src/features/viewer/index.ts";

test("contact shadow softness tuning passes configured softness into the localized render state", () => {
  const placement = resolveContactShadowPlacement(
    getContactShadowActivationPreset("miniatureArchitecture"),
    [
      createContactShadowFootprint(
        "floor",
        [
          { x: -0.9, z: -0.7 },
          { x: 1.1, z: -0.7 },
          { x: 1.1, z: 0.9 },
          { x: -0.9, z: 0.9 },
        ],
        -0.01,
      )!,
      createContactShadowFootprint(
        "wall",
        [
          { x: -1.05, z: -0.85 },
          { x: 1.25, z: -0.85 },
          { x: 1.25, z: 1.05 },
          { x: -1.05, z: 1.05 },
        ],
        0.014,
      )!,
    ],
  );

  const softness = configureContactShadowSoftness(
    getContactShadowSoftnessPreset("miniatureArchitecture"),
    {
      blur: 3.6,
      opacity: 0.27,
      resolution: 768,
      frames: 2,
    },
  );
  const renderState = resolveContactShadowRenderState(placement, softness);

  assert.ok(placement != null);
  assert.ok(renderState != null);
  assert.deepEqual(renderState.position, placement.position);
  assert.deepEqual(renderState.scale, placement.scale);
  assert.equal(renderState.blur, 3.6);
  assert.equal(renderState.opacity, 0.27);
  assert.equal(renderState.resolution, 768);
  assert.equal(renderState.frames, 2);
  assert.equal(renderState.color, placement.color);
  assert.equal(renderState.far, placement.far);
  assert.ok(Object.isFrozen(softness));
  assert.ok(Object.isFrozen(renderState));
});

test("contact shadow softness resolver returns null when placement is unavailable", () => {
  const renderState = resolveContactShadowRenderState(
    null,
    getContactShadowSoftnessPreset("miniatureArchitecture"),
  );

  assert.equal(renderState, null);
});
