export type GlassMaterialVariant = "windowPane" | "windowPaneFallback";

export interface GlassMaterialConfig {
  color: string;
  emissive: string;
  roughness: number;
  metalness: number;
  envMapIntensity: number;
  opacity: number;
  transmission: number;
  ior: number;
  reflectivity: number;
  thickness: number;
  attenuationColor: string;
  attenuationDistance: number;
  clearcoat: number;
  clearcoatRoughness: number;
  transparent: true;
  depthWrite: false;
}

export interface GlassMaterialReadProfile {
  translucencyBand: "airy" | "muted" | "heavy";
  reflectionBand: "restrained" | "balanced" | "glossy";
  readsAsLightGlass: boolean;
  avoidsOpaquePlastic: boolean;
  avoidsHighGlossGlass: boolean;
}

const WINDOW_PANE_GLASS_MATERIAL = Object.freeze<GlassMaterialConfig>({
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

const WINDOW_PANE_FALLBACK_GLASS_MATERIAL = Object.freeze<GlassMaterialConfig>({
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

export function getGlassMaterialConfig(
  variant: GlassMaterialVariant = "windowPane",
): Readonly<GlassMaterialConfig> {
  return variant === "windowPaneFallback"
    ? WINDOW_PANE_FALLBACK_GLASS_MATERIAL
    : WINDOW_PANE_GLASS_MATERIAL;
}

export function evaluateGlassMaterialRead(
  config: Readonly<GlassMaterialConfig>,
): Readonly<GlassMaterialReadProfile> {
  const translucencyBand =
    config.opacity <= 0.24 && config.transmission >= 0.18
      ? "airy"
      : config.opacity <= 0.34 && config.transmission >= 0.1
        ? "muted"
        : "heavy";
  const reflectionBand =
    config.reflectivity <= 0.18 &&
    config.envMapIntensity <= 0.14 &&
    config.clearcoat <= 0.03
      ? "restrained"
      : config.reflectivity <= 0.24 &&
          config.envMapIntensity <= 0.2 &&
          config.clearcoat <= 0.06
        ? "balanced"
        : "glossy";

  return Object.freeze({
    translucencyBand,
    reflectionBand,
    readsAsLightGlass:
      translucencyBand !== "heavy" &&
      reflectionBand !== "glossy" &&
      config.thickness <= 0.04,
    avoidsOpaquePlastic:
      config.opacity <= 0.3 &&
      config.transmission >= 0.18 &&
      config.roughness >= 0.68,
    avoidsHighGlossGlass:
      reflectionBand !== "glossy" && config.clearcoatRoughness >= 0.9,
  });
}
