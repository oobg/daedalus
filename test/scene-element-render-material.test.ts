import assert from "node:assert/strict";
import test from "node:test";

import {
  getGlassMaterialConfig,
  getWallShadingConfig,
  getWoodAccentShadingConfig,
} from "../src/features/viewer/index.ts";
import { resolveSceneElementRenderMaterial } from "../src/features/viewer/scene-element-render-material.ts";

test("resolveSceneElementRenderMaterial maps wall and wood-accent tags to matte standard-material configs", () => {
  const wallMaterial = resolveSceneElementRenderMaterial("wall");
  const woodAccentMaterial = resolveSceneElementRenderMaterial("wood-accent");

  assert.deepEqual(wallMaterial, {
    materialTag: "wall",
    materialType: "standard",
    config: getWallShadingConfig("interior"),
  });
  assert.deepEqual(woodAccentMaterial, {
    materialTag: "wood-accent",
    materialType: "standard",
    config: getWoodAccentShadingConfig("flooring"),
  });
  assert.ok(Object.isFrozen(wallMaterial));
  assert.ok(Object.isFrozen(woodAccentMaterial));
  assert.equal(wallMaterial.config, getWallShadingConfig("interior"));
  assert.equal(
    woodAccentMaterial.config,
    getWoodAccentShadingConfig("flooring"),
  );
});

test("resolveSceneElementRenderMaterial maps glass tags to the physical window-pane material with a fallback variant for lower-spec rendering", () => {
  const desktopGlassMaterial = resolveSceneElementRenderMaterial("glass");
  const fallbackGlassMaterial = resolveSceneElementRenderMaterial("glass", {
    glassVariant: "windowPaneFallback",
  });

  assert.deepEqual(desktopGlassMaterial, {
    materialTag: "glass",
    materialType: "physical",
    config: getGlassMaterialConfig("windowPane"),
  });
  assert.deepEqual(fallbackGlassMaterial, {
    materialTag: "glass",
    materialType: "physical",
    config: getGlassMaterialConfig("windowPaneFallback"),
  });
  assert.notEqual(fallbackGlassMaterial, desktopGlassMaterial);
  assert.ok(Object.isFrozen(desktopGlassMaterial));
  assert.ok(Object.isFrozen(fallbackGlassMaterial));
  assert.equal(desktopGlassMaterial.config, getGlassMaterialConfig("windowPane"));
  assert.equal(
    fallbackGlassMaterial.config,
    getGlassMaterialConfig("windowPaneFallback"),
  );
});

test("resolveSceneElementRenderMaterial allows explicit non-default variants without breaking tag-to-material-type mapping", () => {
  const exteriorWallMaterial = resolveSceneElementRenderMaterial("wall", {
    wallVariant: "exterior",
  });
  const trimWoodMaterial = resolveSceneElementRenderMaterial("wood-accent", {
    woodAccentVariant: "trim",
  });

  assert.deepEqual(exteriorWallMaterial, {
    materialTag: "wall",
    materialType: "standard",
    config: getWallShadingConfig("exterior"),
  });
  assert.deepEqual(trimWoodMaterial, {
    materialTag: "wood-accent",
    materialType: "standard",
    config: getWoodAccentShadingConfig("trim"),
  });
  assert.ok(Object.isFrozen(exteriorWallMaterial));
  assert.ok(Object.isFrozen(trimWoodMaterial));
});
