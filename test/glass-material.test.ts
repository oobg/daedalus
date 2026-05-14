import assert from "node:assert/strict";
import test from "node:test";

import {
  evaluateGlassMaterialRead,
  getGlassMaterialConfig,
} from "../src/features/viewer/index.ts";

test("window pane glass shading stays translucent and restrained instead of glossy plastic", () => {
  const glass = getGlassMaterialConfig("windowPane");
  const read = evaluateGlassMaterialRead(glass);

  assert.deepEqual(glass, {
    color: "#D7E1DE",
    emissive: "#80918F",
    roughness: 0.72,
    metalness: 0.02,
    envMapIntensity: 0.12,
    opacity: 0.22,
    transmission: 0.52,
    ior: 1.12,
    reflectivity: 0.16,
    thickness: 0.03,
    attenuationColor: "#F4E8D9",
    attenuationDistance: 1.9,
    clearcoat: 0.02,
    clearcoatRoughness: 0.92,
    transparent: true,
    depthWrite: false,
  });
  assert.deepEqual(read, {
    translucencyBand: "airy",
    reflectionBand: "restrained",
    readsAsLightGlass: true,
    avoidsOpaquePlastic: true,
    avoidsHighGlossGlass: true,
  });
  assert.ok(glass.opacity < 0.25);
  assert.ok(glass.transmission >= 0.5);
  assert.ok(glass.roughness >= 0.68);
  assert.ok(glass.reflectivity <= 0.18);
  assert.ok(Object.isFrozen(glass));
  assert.ok(Object.isFrozen(read));
});

test("fallback glass shading reduces reflective intensity while preserving spatial readability", () => {
  const desktop = getGlassMaterialConfig("windowPane");
  const fallback = getGlassMaterialConfig("windowPaneFallback");
  const fallbackRead = evaluateGlassMaterialRead(fallback);

  assert.deepEqual(fallback, {
    color: "#D3DDDA",
    emissive: "#839290",
    roughness: 0.8,
    metalness: 0.02,
    envMapIntensity: 0.08,
    opacity: 0.2,
    transmission: 0.22,
    ior: 1.06,
    reflectivity: 0.1,
    thickness: 0.02,
    attenuationColor: "#F3E9DB",
    attenuationDistance: 1.2,
    clearcoat: 0.01,
    clearcoatRoughness: 0.96,
    transparent: true,
    depthWrite: false,
  });
  assert.deepEqual(fallbackRead, {
    translucencyBand: "airy",
    reflectionBand: "restrained",
    readsAsLightGlass: true,
    avoidsOpaquePlastic: true,
    avoidsHighGlossGlass: true,
  });
  assert.notEqual(fallback, desktop);
  assert.ok(fallback.roughness > desktop.roughness);
  assert.ok(fallback.envMapIntensity < desktop.envMapIntensity);
  assert.ok(fallback.transmission < desktop.transmission);
  assert.ok(fallback.reflectivity < desktop.reflectivity);
  assert.ok(Object.isFrozen(fallback));
  assert.ok(Object.isFrozen(fallbackRead));
});

test("glass shading defaults to the desktop window pane profile", () => {
  assert.equal(
    getGlassMaterialConfig(),
    getGlassMaterialConfig("windowPane"),
  );
});
