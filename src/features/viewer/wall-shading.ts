import {
  getWallColorPalette,
  type WallColorPaletteVariant,
} from "./wall-color-palette.ts";

export type WallShadingVariant = WallColorPaletteVariant;

export interface WallShadingConfig {
  color: string;
  roughness: number;
  metalness: number;
  envMapIntensity: number;
  emissive: string;
  emissiveIntensity: number;
}

const INTERIOR_WALL_SHADING = Object.freeze<WallShadingConfig>({
  ...getWallColorPalette("interior"),
  roughness: 0.97,
  metalness: 0.02,
  envMapIntensity: 0.1,
  emissiveIntensity: 0.022,
});

const EXTERIOR_WALL_SHADING = Object.freeze<WallShadingConfig>({
  ...getWallColorPalette("exterior"),
  roughness: 0.98,
  metalness: 0.015,
  envMapIntensity: 0.08,
  emissiveIntensity: 0.018,
});

export function getWallShadingConfig(
  variant: WallShadingVariant = "interior",
): Readonly<WallShadingConfig> {
  return variant === "exterior"
    ? EXTERIOR_WALL_SHADING
    : INTERIOR_WALL_SHADING;
}
