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
  assert.ok(shading.roughness >= 0.96);
  assert.ok(shading.metalness <= 0.02);
  assert.ok(shading.envMapIntensity <= 0.12);
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

test("wall shading rejects glossy values and plain default-gray wall colors", () => {
  for (const variant of ["interior", "exterior"] as const) {
    const shading = getWallShadingConfig(variant);
    const surface = parseHexColor(shading.color);

    assert.ok(
      shading.roughness >= 0.96,
      `Expected ${variant} wall shading to stay decisively matte.`,
    );
    assert.ok(
      shading.metalness <= 0.02,
      `Expected ${variant} wall shading to avoid glossy metallic drift.`,
    );
    assert.ok(
      shading.envMapIntensity <= 0.12,
      `Expected ${variant} wall shading to avoid reflective showroom highlights.`,
    );
    assert.notEqual(shading.color.toUpperCase(), "#808080");
    assert.notEqual(shading.color.toUpperCase(), "#999999");
    assert.notEqual(shading.color.toUpperCase(), "#A0A0A0");
    assert.ok(
      surface.red > surface.blue,
      `Expected ${variant} wall shading to retain a warm tone instead of neutral gray.`,
    );
    assert.ok(
      Math.max(
        Math.abs(surface.red - surface.green),
        Math.abs(surface.green - surface.blue),
        Math.abs(surface.red - surface.blue),
      ) >= 8,
      `Expected ${variant} wall shading color to avoid a plain default-gray channel balance.`,
    );
  }
});

test("wall shading defaults to the interior miniature wall profile", () => {
  assert.equal(
    getWallShadingConfig(),
    getWallShadingConfig("interior"),
  );
});

function parseHexColor(color: string): {
  red: number;
  green: number;
  blue: number;
} {
  const normalized = color.startsWith("#") ? color.slice(1) : color;

  return {
    red: Number.parseInt(normalized.slice(0, 2), 16),
    green: Number.parseInt(normalized.slice(2, 4), 16),
    blue: Number.parseInt(normalized.slice(4, 6), 16),
  };
}
