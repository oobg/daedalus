export type AmbientLightingPresetVariant = "miniatureArchitecture";

export interface AmbientLightingPreset {
  color: string;
  intensity: number;
}

const AMBIENT_LIGHTING_PRESETS = Object.freeze<
  Record<AmbientLightingPresetVariant, Readonly<AmbientLightingPreset>>
>({
  miniatureArchitecture: Object.freeze<AmbientLightingPreset>({
    color: "#FFF8F0",
    intensity: 0.85,
  }),
});

export function getAmbientLightingPreset(
  variant: AmbientLightingPresetVariant = "miniatureArchitecture",
): Readonly<AmbientLightingPreset> {
  return AMBIENT_LIGHTING_PRESETS[variant];
}
