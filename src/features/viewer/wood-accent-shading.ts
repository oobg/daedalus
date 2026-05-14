export type WoodAccentShadingVariant = "flooring" | "trim";

export interface WoodAccentShadingConfig {
  color: string;
  emissive: string;
  roughness: number;
  metalness: number;
  envMapIntensity: number;
  emissiveIntensity: number;
}

const FLOORING_WOOD_ACCENT_SHADING = Object.freeze<WoodAccentShadingConfig>({
  color: "#B6936E",
  emissive: "#7E5939",
  roughness: 0.82,
  metalness: 0.03,
  envMapIntensity: 0.24,
  emissiveIntensity: 0.016,
});

const TRIM_WOOD_ACCENT_SHADING = Object.freeze<WoodAccentShadingConfig>({
  color: "#C6A785",
  emissive: "#8B6646",
  roughness: 0.86,
  metalness: 0.02,
  envMapIntensity: 0.2,
  emissiveIntensity: 0.014,
});

export function getWoodAccentShadingConfig(
  variant: WoodAccentShadingVariant = "flooring",
): Readonly<WoodAccentShadingConfig> {
  return variant === "trim"
    ? TRIM_WOOD_ACCENT_SHADING
    : FLOORING_WOOD_ACCENT_SHADING;
}
