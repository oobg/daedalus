import type {
  ContactShadowActivationSettings,
  ContactShadowElementKind,
} from "./contact-shadow-activation.ts";

export interface ContactShadowFootprintPoint {
  x: number;
  z: number;
}

export interface ContactShadowFootprint {
  kind: ContactShadowElementKind;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  baseY: number;
}

export interface ContactShadowPlacement {
  position: readonly [number, number, number];
  scale: readonly [number, number];
  blur: number;
  color: string;
  opacity: number;
  far: number;
  resolution: number;
}

export interface ContactShadowPlacementOptions {
  minimumScale: number;
  horizontalPadding: number;
  depthPadding: number;
  verticalOffset: number;
  farMultiplier: number;
}

const DEFAULT_CONTACT_SHADOW_PLACEMENT_OPTIONS =
  Object.freeze<ContactShadowPlacementOptions>({
    minimumScale: 0.45,
    horizontalPadding: 0.18,
    depthPadding: 0.18,
    verticalOffset: 0.005,
    farMultiplier: 0.68,
  });

export function createContactShadowFootprint(
  kind: ContactShadowElementKind,
  points: readonly ContactShadowFootprintPoint[],
  baseY: number,
): Readonly<ContactShadowFootprint> | null {
  if (points.length === 0) {
    return null;
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;

  for (const point of points) {
    minX = Math.min(minX, point.x);
    maxX = Math.max(maxX, point.x);
    minZ = Math.min(minZ, point.z);
    maxZ = Math.max(maxZ, point.z);
  }

  if (!isFinite(minX) || !isFinite(minZ) || !isFinite(maxX) || !isFinite(maxZ)) {
    return null;
  }

  return Object.freeze({
    kind,
    minX,
    maxX,
    minZ,
    maxZ,
    baseY,
  });
}

export function resolveContactShadowPlacement(
  settings: Readonly<ContactShadowActivationSettings>,
  footprints: readonly Readonly<ContactShadowFootprint>[],
  options: Partial<ContactShadowPlacementOptions> = {},
): Readonly<ContactShadowPlacement> | null {
  if (!settings.enabled || settings.elements.length === 0) {
    return null;
  }

  const resolvedOptions = {
    ...DEFAULT_CONTACT_SHADOW_PLACEMENT_OPTIONS,
    ...options,
  };
  const allowedKinds = new Set(settings.elements);
  const relevantFootprints = footprints.filter((footprint) =>
    allowedKinds.has(footprint.kind),
  );

  if (relevantFootprints.length === 0) {
    return null;
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  let baseY = Infinity;

  for (const footprint of relevantFootprints) {
    minX = Math.min(minX, footprint.minX);
    maxX = Math.max(maxX, footprint.maxX);
    minZ = Math.min(minZ, footprint.minZ);
    maxZ = Math.max(maxZ, footprint.maxZ);
    baseY = Math.min(baseY, footprint.baseY);
  }

  const scaleX = Math.max(
    maxX - minX + resolvedOptions.horizontalPadding * 2,
    resolvedOptions.minimumScale,
  );
  const scaleZ = Math.max(
    maxZ - minZ + resolvedOptions.depthPadding * 2,
    resolvedOptions.minimumScale,
  );
  const footprintDiameter = Math.max(scaleX, scaleZ);

  return Object.freeze({
    position: Object.freeze([
      (minX + maxX) / 2,
      baseY + resolvedOptions.verticalOffset,
      (minZ + maxZ) / 2,
    ]) as readonly [number, number, number],
    scale: Object.freeze([scaleX, scaleZ]) as readonly [number, number],
    blur: settings.blur,
    color: settings.color,
    opacity: settings.opacity,
    far: Math.max(settings.far, footprintDiameter * resolvedOptions.farMultiplier),
    resolution: settings.resolution,
  });
}
