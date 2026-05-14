import { getViewerLightingConfiguration } from "./lighting-configuration.ts";

export type AmbientLightingPresetVariant = "miniatureArchitecture";

export interface AmbientLightingPreset {
  color: string;
  intensity: number;
  colorTemperatureKelvin: number;
}

const AMBIENT_LIGHTING_PRESET = Object.freeze<AmbientLightingPreset>(((ambientLight) => ({
  color: ambientLight.color,
  intensity: ambientLight.intensity,
  colorTemperatureKelvin: ambientLight.colorTemperatureKelvin,
}))(getViewerLightingConfiguration("miniatureArchitecture").ambientLight));

export function getAmbientLightingPreset(
  variant: AmbientLightingPresetVariant = "miniatureArchitecture",
): Readonly<AmbientLightingPreset> {
  return AMBIENT_LIGHTING_PRESET;
}
