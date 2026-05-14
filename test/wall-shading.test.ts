import assert from "node:assert/strict";
import test from "node:test";

import {
  getWallColorPalette,
  getWallShadingConfig,
} from "../src/features/viewer/index.ts";

test("interior wall shading stays matte with a restrained warm response", () => {
  const shading = getWallShadingConfig("interior");
  const palette = getWallColorPalette("interior");

  assert.equal(shading.color, palette.color);
  assert.equal(shading.emissive, palette.emissive);
  assert.ok(shading.roughness >= 0.9);
  assert.ok(shading.metalness <= 0.05);
  assert.ok(shading.envMapIntensity <= 0.2);
  assert.ok(shading.emissiveIntensity > 0);
  assert.ok(Object.isFrozen(shading));
});

test("exterior wall shading is slightly denser while remaining low gloss", () => {
  const interior = getWallShadingConfig("interior");
  const exterior = getWallShadingConfig("exterior");
  const palette = getWallColorPalette("exterior");

  assert.equal(exterior.color, palette.color);
  assert.equal(exterior.emissive, palette.emissive);
  assert.notEqual(exterior, interior);
  assert.ok(exterior.roughness >= interior.roughness);
  assert.ok(exterior.metalness <= interior.metalness);
  assert.ok(exterior.envMapIntensity < interior.envMapIntensity);
  assert.ok(exterior.emissiveIntensity < 0.03);
  assert.ok(Object.isFrozen(exterior));
});

test("wall shading defaults to the interior miniature wall profile", () => {
  assert.equal(
    getWallShadingConfig(),
    getWallShadingConfig("interior"),
  );
});
