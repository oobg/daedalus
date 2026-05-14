import assert from "node:assert/strict";
import test from "node:test";

import {
  getGlassMaterialConfig,
  getWallShadingConfig,
  getWoodAccentShadingConfig,
} from "../src/features/viewer/index.ts";

test("flooring wood accent shading stays warm, tactile, and distinct from wall and glass materials", () => {
  const flooring = getWoodAccentShadingConfig("flooring");
  const wall = getWallShadingConfig("interior");
  const glass = getGlassMaterialConfig("windowPane");

  assert.deepEqual(flooring, {
    color: "#B6936E",
    emissive: "#7E5939",
    roughness: 0.82,
    metalness: 0.03,
    envMapIntensity: 0.24,
    emissiveIntensity: 0.016,
  });
  assert.notEqual(flooring.color, wall.color);
  assert.notEqual(flooring.emissive, wall.emissive);
  assert.notEqual(flooring.color, glass.color);
  assert.notEqual(flooring.emissive, glass.emissive);
  assert.ok(flooring.roughness < wall.roughness);
  assert.ok(flooring.roughness > glass.roughness);
  assert.ok(flooring.roughness >= 0.75);
  assert.ok(flooring.metalness <= 0.04);
  assert.ok(flooring.envMapIntensity > glass.envMapIntensity);
  assert.ok(Object.isFrozen(flooring));
});

test("trim wood accent shading reads lighter than flooring while remaining matte", () => {
  const flooring = getWoodAccentShadingConfig("flooring");
  const trim = getWoodAccentShadingConfig("trim");

  assert.deepEqual(trim, {
    color: "#C6A785",
    emissive: "#8B6646",
    roughness: 0.86,
    metalness: 0.02,
    envMapIntensity: 0.2,
    emissiveIntensity: 0.014,
  });
  assert.notEqual(trim, flooring);
  assert.ok(trim.roughness >= flooring.roughness);
  assert.ok(trim.metalness <= flooring.metalness);
  assert.ok(trim.envMapIntensity <= flooring.envMapIntensity);
  assert.ok(trim.emissiveIntensity < 0.02);
  assert.ok(Object.isFrozen(trim));
});

test("wood accent shading defaults to the flooring profile for floor and trim-adjacent accents", () => {
  assert.equal(
    getWoodAccentShadingConfig(),
    getWoodAccentShadingConfig("flooring"),
  );
});
