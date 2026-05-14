import {
  getGlassMaterialConfig,
  type GlassMaterialConfig,
  type GlassMaterialVariant,
} from "./glass-material.ts";
import type { SceneElementMaterialTag } from "./scene-element-material-tags.ts";
import {
  getWallShadingConfig,
  type WallShadingConfig,
  type WallShadingVariant,
} from "./wall-shading.ts";
import {
  getWoodAccentShadingConfig,
  type WoodAccentShadingConfig,
  type WoodAccentShadingVariant,
} from "./wood-accent-shading.ts";

export type SceneElementRenderMaterialType = "standard" | "physical";

export interface ResolveSceneElementRenderMaterialOptions {
  wallVariant?: WallShadingVariant;
  woodAccentVariant?: WoodAccentShadingVariant;
  glassVariant?: GlassMaterialVariant;
}

export type SceneElementRenderMaterial =
  | Readonly<{
      materialTag: "wall";
      materialType: "standard";
      config: Readonly<WallShadingConfig>;
    }>
  | Readonly<{
      materialTag: "wood-accent";
      materialType: "standard";
      config: Readonly<WoodAccentShadingConfig>;
    }>
  | Readonly<{
      materialTag: "glass";
      materialType: "physical";
      config: Readonly<GlassMaterialConfig>;
    }>;

const DEFAULT_WALL_RENDER_MATERIAL = freezeRenderMaterial({
  materialTag: "wall",
  materialType: "standard",
  config: getWallShadingConfig("interior"),
});

const DEFAULT_WOOD_ACCENT_RENDER_MATERIAL = freezeRenderMaterial({
  materialTag: "wood-accent",
  materialType: "standard",
  config: getWoodAccentShadingConfig("flooring"),
});

const DEFAULT_GLASS_RENDER_MATERIAL = freezeRenderMaterial({
  materialTag: "glass",
  materialType: "physical",
  config: getGlassMaterialConfig("windowPane"),
});

const FALLBACK_GLASS_RENDER_MATERIAL = freezeRenderMaterial({
  materialTag: "glass",
  materialType: "physical",
  config: getGlassMaterialConfig("windowPaneFallback"),
});

export function resolveSceneElementRenderMaterial(
  materialTag: SceneElementMaterialTag,
  options: ResolveSceneElementRenderMaterialOptions = {},
): SceneElementRenderMaterial {
  if (
    materialTag === "wall" &&
    (options.wallVariant == null || options.wallVariant === "interior")
  ) {
    return DEFAULT_WALL_RENDER_MATERIAL;
  }

  if (
    materialTag === "wood-accent" &&
    (options.woodAccentVariant == null || options.woodAccentVariant === "flooring")
  ) {
    return DEFAULT_WOOD_ACCENT_RENDER_MATERIAL;
  }

  if (
    materialTag === "glass" &&
    (options.glassVariant == null || options.glassVariant === "windowPane")
  ) {
    return DEFAULT_GLASS_RENDER_MATERIAL;
  }

  if (materialTag === "glass" && options.glassVariant === "windowPaneFallback") {
    return FALLBACK_GLASS_RENDER_MATERIAL;
  }

  if (materialTag === "wall") {
    return freezeRenderMaterial({
      materialTag,
      materialType: "standard",
      config: getWallShadingConfig(options.wallVariant),
    });
  }

  if (materialTag === "wood-accent") {
    return freezeRenderMaterial({
      materialTag,
      materialType: "standard",
      config: getWoodAccentShadingConfig(options.woodAccentVariant),
    });
  }

  return freezeRenderMaterial({
    materialTag,
    materialType: "physical",
    config: getGlassMaterialConfig(options.glassVariant),
  });
}

function freezeRenderMaterial<T extends SceneElementRenderMaterial>(
  material: T,
): T {
  return Object.freeze(material);
}
