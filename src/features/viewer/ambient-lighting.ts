export type AmbientLightingPresetVariant = "miniatureArchitecture";

export interface AmbientLightingPreset {
  color: string;
  intensity: number;
}

const MINIATURE_ARCHITECTURE_AMBIENT_LIGHTING = Object.freeze<AmbientLightingPreset>({
  color: "#FFF8F0",
  intensity: 0.85,
});

export function getAmbientLightingPreset(
  variant: AmbientLightingPresetVariant = "miniatureArchitecture",
): Readonly<AmbientLightingPreset> {
  return MINIATURE_ARCHITECTURE_AMBIENT_LIGHTING;
}
