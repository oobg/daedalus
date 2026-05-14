import assert from "node:assert/strict";
import test from "node:test";

import {
  getAmbientOcclusionPreset,
  resolveAmbientOcclusionSettings,
} from "../src/features/viewer/ambient-occlusion.ts";

test("ambient occlusion preset stays gentle for the miniature diorama desktop pass", () => {
  const ambientOcclusion = getAmbientOcclusionPreset("miniatureArchitecture");

  assert.deepEqual(ambientOcclusion, {
    enabled: true,
    strength: 0.32,
    radius: 0.18,
    falloff: 0.55,
    thickness: 0.18,
    samples: 10,
    denoiseRadius: 6,
    denoiseSamples: 8,
    denoiseRings: 2,
  });
  assert.ok(ambientOcclusion.strength > 0.2);
  assert.ok(ambientOcclusion.strength < 0.4);
  assert.ok(ambientOcclusion.radius > 0.1);
  assert.ok(ambientOcclusion.radius < 0.25);
  assert.ok(Object.isFrozen(ambientOcclusion));
});

test("ambient occlusion disables itself on compact touch devices to preserve compatibility", () => {
  const ambientOcclusion = resolveAmbientOcclusionSettings({
    viewportWidth: 768,
    devicePixelRatio: 3,
    hardwareConcurrency: 4,
    maxTouchPoints: 5,
  });

  assert.deepEqual(ambientOcclusion, {
    enabled: false,
    strength: 0,
    radius: 0,
    falloff: 0,
    thickness: 0,
    samples: 0,
    denoiseRadius: 0,
    denoiseSamples: 0,
    denoiseRings: 0,
  });
});

test("ambient occlusion stays enabled on desktop-class viewports", () => {
  const ambientOcclusion = resolveAmbientOcclusionSettings({
    viewportWidth: 1440,
    devicePixelRatio: 1.5,
    hardwareConcurrency: 8,
    maxTouchPoints: 0,
  });

  assert.equal(
    ambientOcclusion,
    getAmbientOcclusionPreset("miniatureArchitecture"),
  );
});
