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

const WINDOW_PANE_GLASS_MATERIAL = Object.freeze<GlassMaterialConfig>({
  color: "#C9D5D4",
  emissive: "#738383",
  roughness: 0.6,
  metalness: 0.02,
  envMapIntensity: 0.18,
  opacity: 0.34,
  transmission: 0.24,
  ior: 1.16,
  reflectivity: 0.22,
  thickness: 0.08,
  attenuationColor: "#F5EBDD",
  attenuationDistance: 1.4,
  clearcoat: 0.06,
  clearcoatRoughness: 0.88,
  transparent: true,
  depthWrite: false,
});

const WINDOW_PANE_FALLBACK_GLASS_MATERIAL = Object.freeze<GlassMaterialConfig>({
  color: "#C8D2D0",
  emissive: "#788786",
  roughness: 0.74,
  metalness: 0.02,
  envMapIntensity: 0.1,
  opacity: 0.28,
  transmission: 0.08,
  ior: 1.08,
  reflectivity: 0.14,
  thickness: 0.03,
  attenuationColor: "#F3EADC",
  attenuationDistance: 0.8,
  clearcoat: 0.03,
  clearcoatRoughness: 0.94,
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
