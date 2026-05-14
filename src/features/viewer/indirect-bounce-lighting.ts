import * as THREE from "three";

import { getViewerLightingConfiguration } from "./lighting-configuration.ts";

export type IndirectBounceLightingPresetVariant = "miniatureArchitecture";

export interface IndirectBounceLightingPreset {
  skyColor: string;
  groundColor: string;
  intensity: number;
  colorTemperatureKelvin: number;
  position: readonly [number, number, number];
}

const INDIRECT_BOUNCE_LIGHTING_PRESET = Object.freeze<IndirectBounceLightingPreset>(
  ((bounceLight) => ({
    skyColor: bounceLight.skyColor,
    groundColor: bounceLight.groundColor,
    intensity: bounceLight.intensity,
    colorTemperatureKelvin: bounceLight.colorTemperatureKelvin,
    position: bounceLight.position,
  }))(getViewerLightingConfiguration("miniatureArchitecture").bounceLight),
);

export function getIndirectBounceLightingPreset(
  variant: IndirectBounceLightingPresetVariant = "miniatureArchitecture",
): Readonly<IndirectBounceLightingPreset> {
  return INDIRECT_BOUNCE_LIGHTING_PRESET;
}

export function createIndirectBounceLight(
  variant: IndirectBounceLightingPresetVariant = "miniatureArchitecture",
): THREE.HemisphereLight {
  const preset = getIndirectBounceLightingPreset(variant);
  const light = new THREE.HemisphereLight(
    preset.skyColor,
    preset.groundColor,
    preset.intensity,
  );

  light.position.set(...preset.position);

  return light;
}

export function measureIndirectBounceIllumination(
  light: Pick<THREE.HemisphereLight, "color" | "groundColor" | "intensity">,
): number {
  const skyLuminance = light.color.getHSL({ h: 0, s: 0, l: 0 }).l;
  const groundLuminance = light.groundColor.getHSL({ h: 0, s: 0, l: 0 }).l;

  return Number((((skyLuminance * 0.65) + (groundLuminance * 0.35)) * light.intensity).toFixed(4));
}
