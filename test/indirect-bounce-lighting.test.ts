import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";

import {
  createIndirectBounceLight,
  getIndirectBounceLightingPreset,
  measureIndirectBounceIllumination,
} from "../src/features/viewer/indirect-bounce-lighting.ts";
import { getViewerLightingConfiguration } from "../src/features/viewer/lighting-configuration.ts";

test("indirect bounce lighting preset stays warm and restrained for the miniature architecture scene fill", () => {
  const bounceLighting = getIndirectBounceLightingPreset("miniatureArchitecture");

  assert.deepEqual(bounceLighting, {
    skyColor: "#F6E6D6",
    groundColor: "#C9AE8F",
    intensity: 0.28,
    colorTemperatureKelvin: 3600,
    position: [0, 5.5, 0],
  });
  assert.ok(bounceLighting.intensity > 0);
  assert.ok(bounceLighting.intensity < 0.4);
  assert.ok(Object.isFrozen(bounceLighting));
});

test("viewer lighting configuration exposes a dedicated hemisphere bounce fill between ambient and directional light", () => {
  const lighting = getViewerLightingConfiguration("miniatureArchitecture");

  assert.equal(lighting.bounceLight.type, "hemisphere");
  assert.equal(lighting.bounceLight.intensity, 0.28);
  assert.equal(lighting.bounceLight.colorTemperatureKelvin, 3600);
  assert.equal(lighting.bounceLight.skyColor, "#F6E6D6");
  assert.equal(lighting.bounceLight.groundColor, "#C9AE8F");
  assert.deepEqual(lighting.bounceLight.position, [0, 5.5, 0]);
  assert.ok(Object.isFrozen(lighting.bounceLight));
});

test("createIndirectBounceLight instantiates a runnable hemisphere light with non-zero bounced illumination", () => {
  const bounceLight = createIndirectBounceLight();
  const contribution = measureIndirectBounceIllumination(bounceLight);

  assert.ok(bounceLight instanceof THREE.HemisphereLight);
  assert.equal(bounceLight.intensity, 0.28);
  assert.equal(bounceLight.color.getHexString(), "f6e6d6");
  assert.equal(bounceLight.groundColor.getHexString(), "c9ae8f");
  assert.deepEqual(bounceLight.position.toArray(), [0, 5.5, 0]);
  assert.ok(contribution > 0);
});
