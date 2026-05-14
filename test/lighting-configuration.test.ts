import assert from "node:assert/strict";
import test from "node:test";

import { getViewerLightingConfiguration } from "../src/features/viewer/lighting-configuration.ts";

test("getViewerLightingConfiguration returns the miniature architecture configuration with all three light channels", () => {
  const lighting = getViewerLightingConfiguration("miniatureArchitecture");

  assert.equal(lighting.ambientLight.type, "ambient");
  assert.equal(lighting.bounceLight.type, "hemisphere");
  assert.equal(lighting.diffuseLight.type, "directional");
});

test("getViewerLightingConfiguration defaults to miniatureArchitecture when no variant is provided", () => {
  assert.equal(
    getViewerLightingConfiguration(),
    getViewerLightingConfiguration("miniatureArchitecture"),
  );
});

test("ambient light channel holds warm-neutral fill values for the miniature diorama pass", () => {
  const { ambientLight } = getViewerLightingConfiguration("miniatureArchitecture");

  assert.equal(ambientLight.color, "#FFF8F0");
  assert.equal(ambientLight.intensity, 0.85);
  assert.equal(ambientLight.colorTemperatureKelvin, 4300);
});

test("hemisphere bounce light channel holds soft warm fill values positioned above the scene", () => {
  const { bounceLight } = getViewerLightingConfiguration("miniatureArchitecture");

  assert.equal(bounceLight.skyColor, "#F6E6D6");
  assert.equal(bounceLight.groundColor, "#C9AE8F");
  assert.equal(bounceLight.intensity, 0.28);
  assert.equal(bounceLight.colorTemperatureKelvin, 3600);
  assert.deepEqual(bounceLight.position, [0, 5.5, 0]);
  assert.ok(bounceLight.intensity < bounceLight.intensity + 0.1);
  assert.ok(Object.isFrozen(bounceLight));
});

test("directional diffuse key light holds warm shadow-casting configuration for miniature depth reads", () => {
  const { diffuseLight } = getViewerLightingConfiguration("miniatureArchitecture");

  assert.equal(diffuseLight.color, "#F7E7D2");
  assert.equal(diffuseLight.intensity, 0.45);
  assert.equal(diffuseLight.colorTemperatureKelvin, 3900);
  assert.deepEqual(diffuseLight.position, [4, 12, 6]);
  assert.equal(diffuseLight.castShadow, true);
  assert.deepEqual(diffuseLight.shadowMapSize, [1024, 1024]);
  assert.equal(diffuseLight.shadowCameraNear, 0.5);
  assert.equal(diffuseLight.shadowCameraFar, 40);
  assert.equal(diffuseLight.shadowBias, -0.001);
  assert.ok(Object.isFrozen(diffuseLight));
});

test("full lighting configuration object and all nested channels are frozen", () => {
  const lighting = getViewerLightingConfiguration("miniatureArchitecture");

  assert.ok(Object.isFrozen(lighting));
  assert.ok(Object.isFrozen(lighting.ambientLight));
  assert.ok(Object.isFrozen(lighting.bounceLight));
  assert.ok(Object.isFrozen(lighting.diffuseLight));
});

test("lighting channel intensities sum to a restrained total suitable for the diorama look", () => {
  const lighting = getViewerLightingConfiguration("miniatureArchitecture");
  const totalIntensity =
    lighting.ambientLight.intensity +
    lighting.bounceLight.intensity +
    lighting.diffuseLight.intensity;

  assert.ok(totalIntensity > 1.0, `total intensity ${totalIntensity} should exceed 1.0`);
  assert.ok(totalIntensity < 2.0, `total intensity ${totalIntensity} should stay under 2.0`);
});
