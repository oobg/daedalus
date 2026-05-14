export type AmbientOcclusionPresetVariant = "miniatureArchitecture";

export interface AmbientOcclusionSettings {
  enabled: boolean;
  strength: number;
  radius: number;
  falloff: number;
  thickness: number;
  samples: number;
  denoiseRadius: number;
  denoiseSamples: number;
  denoiseRings: number;
}

export interface AmbientOcclusionSoftnessBounds {
  minimumStrength: number;
  maximumStrength: number;
  minimumRadius: number;
  maximumRadius: number;
}

export interface AmbientOcclusionCapabilityInput {
  viewportWidth: number;
  devicePixelRatio: number;
  hardwareConcurrency?: number | null;
  maxTouchPoints?: number | null;
}

const AMBIENT_OCCLUSION_PRESETS = Object.freeze<
  Record<AmbientOcclusionPresetVariant, Readonly<AmbientOcclusionSettings>>
>({
  miniatureArchitecture: Object.freeze<AmbientOcclusionSettings>({
    enabled: true,
    strength: 0.32,
    radius: 0.18,
    falloff: 0.55,
    thickness: 0.18,
    samples: 10,
    denoiseRadius: 6,
    denoiseSamples: 8,
    denoiseRings: 2,
  }),
});

const AMBIENT_OCCLUSION_SOFTNESS_BOUNDS = Object.freeze<
  Record<AmbientOcclusionPresetVariant, Readonly<AmbientOcclusionSoftnessBounds>>
>({
  miniatureArchitecture: Object.freeze<AmbientOcclusionSoftnessBounds>({
    minimumStrength: 0.2,
    maximumStrength: 0.4,
    minimumRadius: 0.1,
    maximumRadius: 0.25,
  }),
});

const LOW_SPEC_AMBIENT_OCCLUSION_SETTINGS = Object.freeze<AmbientOcclusionSettings>({
  enabled: false,
  strength: 0,
  radius: 0,
  falloff: 0,
  thickness: 0,
  samples: 0,
  denoiseRadius: 0,
  denoiseSamples: 0,
  denoiseRings: 0,
});

export function getAmbientOcclusionPreset(
  variant: AmbientOcclusionPresetVariant = "miniatureArchitecture",
): Readonly<AmbientOcclusionSettings> {
  return AMBIENT_OCCLUSION_PRESETS[variant];
}

export function getAmbientOcclusionSoftnessBounds(
  variant: AmbientOcclusionPresetVariant = "miniatureArchitecture",
): Readonly<AmbientOcclusionSoftnessBounds> {
  return AMBIENT_OCCLUSION_SOFTNESS_BOUNDS[variant];
}

export function resolveAmbientOcclusionSettings(
  input: AmbientOcclusionCapabilityInput,
  variant: AmbientOcclusionPresetVariant = "miniatureArchitecture",
): Readonly<AmbientOcclusionSettings> {
  if (shouldReduceAmbientOcclusion(input)) {
    return LOW_SPEC_AMBIENT_OCCLUSION_SETTINGS;
  }

  return getAmbientOcclusionPreset(variant);
}

function shouldReduceAmbientOcclusion(
  input: AmbientOcclusionCapabilityInput,
): boolean {
  const isCompactViewport = input.viewportWidth < 900;
  const isTouchFirst = (input.maxTouchPoints ?? 0) > 0;
  const isHighDensity = input.devicePixelRatio > 2;
  const isLowThreadCount =
    input.hardwareConcurrency != null && input.hardwareConcurrency <= 4;

  return isLowThreadCount || (isTouchFirst && (isCompactViewport || isHighDensity));
}

export function isAmbientOcclusionSoftProfile(
  settings: AmbientOcclusionSettings,
  variant: AmbientOcclusionPresetVariant = "miniatureArchitecture",
): boolean {
  const bounds = getAmbientOcclusionSoftnessBounds(variant);

  return (
    settings.enabled &&
    settings.strength >= bounds.minimumStrength &&
    settings.strength <= bounds.maximumStrength &&
    settings.radius >= bounds.minimumRadius &&
    settings.radius <= bounds.maximumRadius
  );
}
