import assert from "node:assert/strict";
import test from "node:test";

import {
  getAmbientLightingPreset,
  getViewerLightingConfiguration,
} from "../src/features/viewer/index.ts";

test("ambient lighting preset stays soft and warm-neutral for the miniature diorama base pass", () => {
  const ambientLighting = getAmbientLightingPreset("miniatureArchitecture");

  assert.deepEqual(ambientLighting, {
    color: "#FFF8F0",
    intensity: 0.85,
    colorTemperatureKelvin: 4300,
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

test("viewer lighting configuration defines the soft ambient fill and warm-neutral diffuse key light", () => {
  const lighting = getViewerLightingConfiguration("miniatureArchitecture");

  assert.equal(lighting.ambientLight.type, "ambient");
  assert.equal(lighting.ambientLight.intensity, 0.85);
  assert.equal(lighting.ambientLight.colorTemperatureKelvin, 4300);
  assert.equal(lighting.diffuseLight.type, "directional");
  assert.equal(lighting.diffuseLight.intensity, 0.45);
  assert.equal(lighting.diffuseLight.colorTemperatureKelvin, 3900);
  assert.equal(lighting.diffuseLight.color, "#F7E7D2");
  assert.deepEqual(lighting.diffuseLight.position, [4, 12, 6]);
  assert.equal(lighting.diffuseLight.castShadow, true);
  assert.deepEqual(lighting.diffuseLight.shadowMapSize, [1024, 1024]);
  assert.ok(Object.isFrozen(lighting));
  assert.ok(Object.isFrozen(lighting.diffuseLight));
});
