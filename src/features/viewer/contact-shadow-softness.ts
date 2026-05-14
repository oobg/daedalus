import {
  getContactShadowActivationPreset,
  type ContactShadowActivationVariant,
} from "./contact-shadow-activation.ts";
import type { ContactShadowPlacement } from "./contact-shadow-placement.ts";

export interface ContactShadowSoftnessSettings {
  blur: number;
  opacity: number;
  resolution: number;
  frames: number;
}

export interface ContactShadowRenderState {
  position: readonly [number, number, number];
  scale: readonly [number, number];
  blur: number;
  color: string;
  opacity: number;
  far: number;
  resolution: number;
  frames: number;
}

const MINIATURE_ARCHITECTURE_CONTACT_SHADOW = getContactShadowActivationPreset(
  "miniatureArchitecture",
);

const CONTACT_SHADOW_SOFTNESS_PRESETS = Object.freeze<
  Record<ContactShadowActivationVariant, Readonly<ContactShadowSoftnessSettings>>
>({
  miniatureArchitecture: Object.freeze<ContactShadowSoftnessSettings>({
    blur: MINIATURE_ARCHITECTURE_CONTACT_SHADOW.blur,
    opacity: MINIATURE_ARCHITECTURE_CONTACT_SHADOW.opacity,
    resolution: MINIATURE_ARCHITECTURE_CONTACT_SHADOW.resolution,
    frames: 1,
  }),
});

export function getContactShadowSoftnessPreset(
  variant: ContactShadowActivationVariant = "miniatureArchitecture",
): Readonly<ContactShadowSoftnessSettings> {
  return CONTACT_SHADOW_SOFTNESS_PRESETS[variant];
}

export function configureContactShadowSoftness(
  settings: Readonly<ContactShadowSoftnessSettings>,
  overrides: Partial<ContactShadowSoftnessSettings> = {},
): Readonly<ContactShadowSoftnessSettings> {
  return Object.freeze({
    ...settings,
    ...overrides,
  });
}

export function resolveContactShadowRenderState(
  placement: Readonly<ContactShadowPlacement> | null,
  softness: Readonly<ContactShadowSoftnessSettings>,
): Readonly<ContactShadowRenderState> | null {
  if (placement == null) {
    return null;
  }

  return Object.freeze({
    position: placement.position,
    scale: placement.scale,
    blur: softness.blur,
    color: placement.color,
    opacity: softness.opacity,
    far: placement.far,
    resolution: softness.resolution,
    frames: softness.frames,
  });
}
