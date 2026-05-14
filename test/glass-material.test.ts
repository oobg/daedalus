import assert from "node:assert/strict";
import test from "node:test";

import { getGlassMaterialConfig } from "../src/features/viewer/index.ts";

test("window pane glass shading stays translucent and restrained instead of glossy plastic", () => {
  const glass = getGlassMaterialConfig("windowPane");

  assert.deepEqual(glass, {
    color: "#C9D5D4",
    emissive: "#738383",
    roughness: 0.6,
    metalness: 0.02,
    envMapIntensity: 0.18,
    opacity: 0.34,
    transmission: 0.24,
    ior: 1.16,
    reflectivity: 0.22,
    thickness: 0.08,
    attenuationColor: "#F5EBDD",
    attenuationDistance: 1.4,
    clearcoat: 0.06,
    clearcoatRoughness: 0.88,
    transparent: true,
    depthWrite: false,
  });
  assert.ok(glass.opacity < 0.4);
  assert.ok(glass.transmission > 0.2);
  assert.ok(glass.roughness >= 0.55);
  assert.ok(glass.reflectivity <= 0.25);
  assert.ok(Object.isFrozen(glass));
});

test("fallback glass shading reduces reflective intensity while preserving spatial readability", () => {
  const desktop = getGlassMaterialConfig("windowPane");
  const fallback = getGlassMaterialConfig("windowPaneFallback");

  assert.deepEqual(fallback, {
    color: "#C8D2D0",
    emissive: "#788786",
    roughness: 0.74,
    metalness: 0.02,
    envMapIntensity: 0.1,
    opacity: 0.28,
    transmission: 0.08,
    ior: 1.08,
    reflectivity: 0.14,
    thickness: 0.03,
    attenuationColor: "#F3EADC",
    attenuationDistance: 0.8,
    clearcoat: 0.03,
    clearcoatRoughness: 0.94,
    transparent: true,
    depthWrite: false,
  });
  assert.notEqual(fallback, desktop);
  assert.ok(fallback.roughness > desktop.roughness);
  assert.ok(fallback.envMapIntensity < desktop.envMapIntensity);
  assert.ok(fallback.transmission < desktop.transmission);
  assert.ok(fallback.reflectivity < desktop.reflectivity);
  assert.ok(Object.isFrozen(fallback));
});

test("glass shading defaults to the desktop window pane profile", () => {
  assert.equal(
    getGlassMaterialConfig(),
    getGlassMaterialConfig("windowPane"),
  );
});
