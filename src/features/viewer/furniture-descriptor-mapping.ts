import {
  assertFurnitureAssetReference,
  validateFurnitureAssetReference,
} from "./furniture-asset-reference-guard.ts";

export const SUPPORTED_FURNITURE_TYPES = Object.freeze([
  "bed",
  "chair",
  "desk",
  "sofa",
  "storage",
  "table",
] as const);

export type SupportedFurnitureType = (typeof SUPPORTED_FURNITURE_TYPES)[number];

export type FurnitureDescriptorMaterialTag =
  | "painted-wood"
  | "upholstery"
  | "warm-wood";

export type FurnitureDescriptorPrimitiveKind =
  | "box"
  | "cylinder"
  | "rounded-box";

export interface FurnitureDescriptorDimensions {
  width: number;
  depth: number;
  height: number;
}

export interface FurnitureDescriptorPrimitivePart {
  partId: string;
  primitive: FurnitureDescriptorPrimitiveKind;
  dimensions: FurnitureDescriptorDimensions;
  position: Readonly<{
    x: number;
    y: number;
    z: number;
  }>;
  cornerRadius?: number;
}

export interface PrimitiveFurnitureDescriptor {
  descriptorType: "primitive-composition";
  footprint: FurnitureDescriptorDimensions;
  materialTag: FurnitureDescriptorMaterialTag;
  silhouette: "beveled" | "rounded" | "soft-rectilinear";
  parts: readonly FurnitureDescriptorPrimitivePart[];
}

export interface HandcraftedModelFurnitureDescriptor {
  descriptorType: "handcrafted-model";
  footprint: FurnitureDescriptorDimensions;
  materialTag: FurnitureDescriptorMaterialTag;
  silhouette: "beveled" | "rounded" | "soft-rectilinear";
  modelAssetId: string;
  scale: number;
}

export type NormalizedFurnitureDescriptor =
  | PrimitiveFurnitureDescriptor
  | HandcraftedModelFurnitureDescriptor;

const FURNITURE_DESCRIPTOR_MAP: Readonly<
  Record<SupportedFurnitureType, Readonly<NormalizedFurnitureDescriptor>>
> = Object.freeze({
  bed: freezeDescriptor({
    descriptorType: "primitive-composition",
    footprint: { width: 2.1, depth: 1.6, height: 0.56 },
    materialTag: "upholstery",
    silhouette: "soft-rectilinear",
    parts: [
      {
        partId: "base",
        primitive: "rounded-box",
        dimensions: { width: 2.1, depth: 1.6, height: 0.26 },
        position: { x: 0, y: 0.13, z: 0 },
        cornerRadius: 0.08,
      },
      {
        partId: "mattress",
        primitive: "rounded-box",
        dimensions: { width: 2.0, depth: 1.52, height: 0.18 },
        position: { x: 0, y: 0.35, z: 0 },
        cornerRadius: 0.09,
      },
      {
        partId: "headboard",
        primitive: "rounded-box",
        dimensions: { width: 1.72, depth: 0.12, height: 0.56 },
        position: { x: 0, y: 0.28, z: -0.74 },
        cornerRadius: 0.07,
      },
    ],
  }),
  chair: freezeDescriptor({
    descriptorType: "primitive-composition",
    footprint: { width: 0.58, depth: 0.58, height: 0.82 },
    materialTag: "warm-wood",
    silhouette: "rounded",
    parts: [
      {
        partId: "seat",
        primitive: "rounded-box",
        dimensions: { width: 0.5, depth: 0.5, height: 0.08 },
        position: { x: 0, y: 0.42, z: 0 },
        cornerRadius: 0.05,
      },
      {
        partId: "backrest",
        primitive: "rounded-box",
        dimensions: { width: 0.46, depth: 0.08, height: 0.34 },
        position: { x: 0, y: 0.62, z: -0.21 },
        cornerRadius: 0.04,
      },
      {
        partId: "pedestal",
        primitive: "cylinder",
        dimensions: { width: 0.12, depth: 0.12, height: 0.38 },
        position: { x: 0, y: 0.19, z: 0 },
      },
    ],
  }),
  desk: freezeDescriptor({
    descriptorType: "primitive-composition",
    footprint: { width: 1.4, depth: 0.68, height: 0.76 },
    materialTag: "warm-wood",
    silhouette: "beveled",
    parts: [
      {
        partId: "top",
        primitive: "rounded-box",
        dimensions: { width: 1.4, depth: 0.68, height: 0.08 },
        position: { x: 0, y: 0.72, z: 0 },
        cornerRadius: 0.04,
      },
      {
        partId: "drawer-block",
        primitive: "rounded-box",
        dimensions: { width: 0.42, depth: 0.58, height: 0.5 },
        position: { x: -0.38, y: 0.37, z: 0 },
        cornerRadius: 0.03,
      },
      {
        partId: "leg-frame",
        primitive: "box",
        dimensions: { width: 0.08, depth: 0.58, height: 0.68 },
        position: { x: 0.56, y: 0.34, z: 0 },
      },
    ],
  }),
  sofa: freezeDescriptor({
    descriptorType: "handcrafted-model",
    footprint: { width: 2.2, depth: 0.96, height: 0.82 },
    materialTag: "upholstery",
    silhouette: "rounded",
    modelAssetId: "sofa-compact-arched-oak-base",
    scale: 1,
  }),
  storage: freezeDescriptor({
    descriptorType: "handcrafted-model",
    footprint: { width: 1.18, depth: 0.46, height: 1.48 },
    materialTag: "painted-wood",
    silhouette: "soft-rectilinear",
    modelAssetId: "storage-sideboard-fluted-ash",
    scale: 1,
  }),
  table: freezeDescriptor({
    descriptorType: "primitive-composition",
    footprint: { width: 1.2, depth: 1.2, height: 0.74 },
    materialTag: "warm-wood",
    silhouette: "soft-rectilinear",
    parts: [
      {
        partId: "top",
        primitive: "rounded-box",
        dimensions: { width: 1.2, depth: 1.2, height: 0.07 },
        position: { x: 0, y: 0.7, z: 0 },
        cornerRadius: 0.06,
      },
      {
        partId: "column",
        primitive: "cylinder",
        dimensions: { width: 0.18, depth: 0.18, height: 0.58 },
        position: { x: 0, y: 0.35, z: 0 },
      },
      {
        partId: "base",
        primitive: "cylinder",
        dimensions: { width: 0.58, depth: 0.58, height: 0.08 },
        position: { x: 0, y: 0.04, z: 0 },
      },
    ],
  }),
});

export function resolveFurnitureDescriptor(
  furnitureType: SupportedFurnitureType,
): Readonly<NormalizedFurnitureDescriptor> {
  return FURNITURE_DESCRIPTOR_MAP[furnitureType];
}

export function isNormalizedFurnitureDescriptor(
  descriptor: unknown,
): descriptor is Readonly<NormalizedFurnitureDescriptor> {
  if (descriptor == null || typeof descriptor !== "object") {
    return false;
  }

  const candidate = descriptor as Partial<NormalizedFurnitureDescriptor>;

  if (
    !isValidDimensions(candidate.footprint) ||
    !isMaterialTag(candidate.materialTag) ||
    !isSilhouette(candidate.silhouette)
  ) {
    return false;
  }

  if (candidate.descriptorType === "primitive-composition") {
    return (
      Array.isArray(candidate.parts) &&
      candidate.parts.length > 0 &&
      candidate.parts.every((part) => isValidPrimitivePart(part))
    );
  }

  if (candidate.descriptorType === "handcrafted-model") {
    const assetReferenceValidation = validateFurnitureAssetReference(
      candidate.modelAssetId,
    );

    return (
      assetReferenceValidation.ok &&
      typeof candidate.scale === "number" &&
      Number.isFinite(candidate.scale) &&
      candidate.scale > 0
    );
  }

  return false;
}

function freezeDescriptor<T extends NormalizedFurnitureDescriptor>(
  descriptor: T,
): Readonly<T> {
  if (descriptor.descriptorType === "handcrafted-model") {
    assertFurnitureAssetReference(descriptor.modelAssetId);
  }

  return Object.freeze({
    ...descriptor,
    footprint: Object.freeze({ ...descriptor.footprint }),
    ...(descriptor.descriptorType === "primitive-composition"
      ? {
          parts: Object.freeze(
            descriptor.parts.map((part) =>
              Object.freeze({
                ...part,
                dimensions: Object.freeze({ ...part.dimensions }),
                position: Object.freeze({ ...part.position }),
              }),
            ),
          ),
        }
      : {}),
  }) as Readonly<T>;
}

function isValidPrimitivePart(
  part: unknown,
): part is FurnitureDescriptorPrimitivePart {
  if (part == null || typeof part !== "object") {
    return false;
  }

  const candidate = part as Partial<FurnitureDescriptorPrimitivePart>;

  return (
    typeof candidate.partId === "string" &&
    candidate.partId.length > 0 &&
    isPrimitiveKind(candidate.primitive) &&
    isValidDimensions(candidate.dimensions) &&
    isValidPosition(candidate.position) &&
    (candidate.cornerRadius == null ||
      (typeof candidate.cornerRadius === "number" &&
        Number.isFinite(candidate.cornerRadius) &&
        candidate.cornerRadius >= 0))
  );
}

function isValidDimensions(
  dimensions: unknown,
): dimensions is FurnitureDescriptorDimensions {
  if (dimensions == null || typeof dimensions !== "object") {
    return false;
  }

  const candidate = dimensions as Partial<FurnitureDescriptorDimensions>;

  return (
    typeof candidate.width === "number" &&
    Number.isFinite(candidate.width) &&
    candidate.width > 0 &&
    typeof candidate.depth === "number" &&
    Number.isFinite(candidate.depth) &&
    candidate.depth > 0 &&
    typeof candidate.height === "number" &&
    Number.isFinite(candidate.height) &&
    candidate.height > 0
  );
}

function isValidPosition(
  position: unknown,
): position is Readonly<{ x: number; y: number; z: number }> {
  if (position == null || typeof position !== "object") {
    return false;
  }

  const candidate = position as Partial<Record<"x" | "y" | "z", number>>;

  return (
    typeof candidate.x === "number" &&
    Number.isFinite(candidate.x) &&
    typeof candidate.y === "number" &&
    Number.isFinite(candidate.y) &&
    typeof candidate.z === "number" &&
    Number.isFinite(candidate.z)
  );
}

function isPrimitiveKind(
  primitive: unknown,
): primitive is FurnitureDescriptorPrimitiveKind {
  return (
    primitive === "box" ||
    primitive === "cylinder" ||
    primitive === "rounded-box"
  );
}

function isMaterialTag(
  materialTag: unknown,
): materialTag is FurnitureDescriptorMaterialTag {
  return (
    materialTag === "painted-wood" ||
    materialTag === "upholstery" ||
    materialTag === "warm-wood"
  );
}

function isSilhouette(
  silhouette: unknown,
): silhouette is NormalizedFurnitureDescriptor["silhouette"] {
  return (
    silhouette === "beveled" ||
    silhouette === "rounded" ||
    silhouette === "soft-rectilinear"
  );
}
