import assert from "node:assert/strict";
import test from "node:test";

import { getAmbientLightingPreset } from "../src/features/viewer/ambient-lighting.ts";

test("ambient lighting preset stays soft and warm-neutral for the miniature diorama base pass", () => {
  const ambientLighting = getAmbientLightingPreset("miniatureArchitecture");

  assert.deepEqual(ambientLighting, {
    color: "#FFF8F0",
    intensity: 0.85,
  });
  assert.ok(ambientLighting.intensity > 0.7);
  assert.ok(ambientLighting.intensity < 1);
  assert.ok(Object.isFrozen(ambientLighting));
});

test("ambient lighting defaults to the miniature architecture preset", () => {
  assert.equal(
    getAmbientLightingPreset(),
    getAmbientLightingPreset("miniatureArchitecture"),
  );
});
