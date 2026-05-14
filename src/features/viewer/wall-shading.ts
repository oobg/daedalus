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
  roughness: 0.94,
  metalness: 0.04,
  envMapIntensity: 0.18,
  emissiveIntensity: 0.025,
});

const EXTERIOR_WALL_SHADING = Object.freeze<WallShadingConfig>({
  ...getWallColorPalette("exterior"),
  roughness: 0.96,
  metalness: 0.03,
  envMapIntensity: 0.14,
  emissiveIntensity: 0.02,
});

export function getWallShadingConfig(
  variant: WallShadingVariant = "interior",
): Readonly<WallShadingConfig> {
  return variant === "exterior"
    ? EXTERIOR_WALL_SHADING
    : INTERIOR_WALL_SHADING;
}
