export type ContactShadowActivationVariant = "miniatureArchitecture";

export type ContactShadowElementKind = "floor" | "furniture" | "wall";

export interface ContactShadowActivationSettings {
  enabled: boolean;
  blur: number;
  color: string;
  opacity: number;
  far: number;
  resolution: number;
  elements: readonly ContactShadowElementKind[];
}

export interface ContactShadowCapabilityInput {
  viewportWidth: number;
  devicePixelRatio: number;
  hardwareConcurrency?: number | null;
  maxTouchPoints?: number | null;
}

const CONTACT_SHADOW_PRESETS = Object.freeze<
  Record<
    ContactShadowActivationVariant,
    Readonly<ContactShadowActivationSettings>
  >
>({
  miniatureArchitecture: Object.freeze<ContactShadowActivationSettings>({
    enabled: true,
    blur: 2.8,
    color: "#B9AA96",
    opacity: 0.34,
    far: 1.85,
    resolution: 1024,
    elements: Object.freeze<ContactShadowElementKind[]>([
      "floor",
      "furniture",
      "wall",
    ]),
  }),
});

const DISABLED_CONTACT_SHADOW_SETTINGS = Object.freeze<ContactShadowActivationSettings>({
  enabled: false,
  blur: 0,
  color: "#000000",
  opacity: 0,
  far: 0,
  resolution: 0,
  elements: Object.freeze<ContactShadowElementKind[]>([]),
});

export function getContactShadowActivationPreset(
  variant: ContactShadowActivationVariant = "miniatureArchitecture",
): Readonly<ContactShadowActivationSettings> {
  return CONTACT_SHADOW_PRESETS[variant];
}

export function resolveContactShadowActivationSettings(
  input: ContactShadowCapabilityInput,
  variant: ContactShadowActivationVariant = "miniatureArchitecture",
): Readonly<ContactShadowActivationSettings> {
  return applyContactShadowActivation(
    getContactShadowActivationPreset(variant),
    !shouldDisableContactShadows(input),
  );
}

export function applyContactShadowActivation(
  settings: Readonly<ContactShadowActivationSettings>,
  enabled: boolean,
): Readonly<ContactShadowActivationSettings> {
  if (enabled) {
    return settings;
  }

  return DISABLED_CONTACT_SHADOW_SETTINGS;
}

function shouldDisableContactShadows(
  input: ContactShadowCapabilityInput,
): boolean {
  const isCompactViewport = input.viewportWidth < 900;
  const isTouchFirst = (input.maxTouchPoints ?? 0) > 0;
  const isHighDensity = input.devicePixelRatio > 2;
  const isLowThreadCount =
    input.hardwareConcurrency != null && input.hardwareConcurrency <= 4;

  return isLowThreadCount || (isTouchFirst && (isCompactViewport || isHighDensity));
}
