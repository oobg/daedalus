const DISALLOWED_STYLE_TAGS = new Set([
  "fps",
  "game-prop",
  "hero-prop",
  "photorealistic",
  "realistic",
  "tactical",
  "weapon",
]);

const APPROVED_MATERIAL_FINISHES = new Set([
  "matte",
  "satin",
  "untextured",
]);

const APPROVED_GEOMETRY_PROFILES = new Set([
  "beveled-low-poly",
  "rounded-low-poly",
  "simplified-low-poly",
]);

export const MAX_APPROVED_FURNITURE_TRIANGLE_COUNT = 2_400;
export const MAX_APPROVED_FURNITURE_TEXTURE_SET_COUNT = 1;

export interface FurnitureAssetMetadata {
  assetId: string;
  category: string;
  triangleCount: number;
  geometryProfile: string;
  materialFinish: string;
  textureSetCount: number;
  tags?: readonly string[];
  hasRig?: boolean;
  hasAnimation?: boolean;
}

export type FurnitureAssetClassificationReasonCode =
  | "disallowed_style_tag"
  | "excessive_geometry"
  | "missing_simplified_geometry_profile"
  | "realistic_material_finish"
  | "too_many_texture_sets"
  | "unsupported_runtime_features";

export interface FurnitureAssetClassificationReason {
  code: FurnitureAssetClassificationReasonCode;
  message: string;
}

export type FurnitureAssetMetadataValidationResult =
  | {
      ok: true;
      classification: "approved-simplified-low-poly";
      metadata: Readonly<FurnitureAssetMetadata>;
      reasons: readonly [];
    }
  | {
      ok: false;
      classification: "rejected-realistic-or-game-prop";
      metadata: Readonly<FurnitureAssetMetadata>;
      reasons: readonly FurnitureAssetClassificationReason[];
    };

export function validateFurnitureAssetMetadata(
  metadata: FurnitureAssetMetadata,
): FurnitureAssetMetadataValidationResult {
  const normalizedTags = (metadata.tags ?? []).map((tag) => normalizeToken(tag));
  const reasons: FurnitureAssetClassificationReason[] = [];

  if (normalizedTags.some((tag) => DISALLOWED_STYLE_TAGS.has(tag))) {
    reasons.push({
      code: "disallowed_style_tag",
      message:
        "Furniture assets tagged as realistic or game-prop content are not approved for the miniature viewer.",
    });
  }

  if (metadata.triangleCount > MAX_APPROVED_FURNITURE_TRIANGLE_COUNT) {
    reasons.push({
      code: "excessive_geometry",
      message:
        "Furniture assets must stay within the simplified low-poly triangle budget.",
    });
  }

  if (!APPROVED_GEOMETRY_PROFILES.has(normalizeToken(metadata.geometryProfile))) {
    reasons.push({
      code: "missing_simplified_geometry_profile",
      message:
        "Furniture assets must declare a simplified low-poly geometry profile with softened silhouettes.",
    });
  }

  if (!APPROVED_MATERIAL_FINISHES.has(normalizeToken(metadata.materialFinish))) {
    reasons.push({
      code: "realistic_material_finish",
      message:
        "Furniture assets must use restrained matte or satin finishes instead of realistic glossy materials.",
    });
  }

  if (metadata.textureSetCount > MAX_APPROVED_FURNITURE_TEXTURE_SET_COUNT) {
    reasons.push({
      code: "too_many_texture_sets",
      message:
        "Furniture assets should avoid multi-texture realism and stay within the diorama texture budget.",
    });
  }

  if (metadata.hasRig === true || metadata.hasAnimation === true) {
    reasons.push({
      code: "unsupported_runtime_features",
      message:
        "Rigged or animated furniture behaves like a game prop and is not approved for this viewer.",
    });
  }

  const frozenMetadata = Object.freeze({
    ...metadata,
    tags: Object.freeze([...(metadata.tags ?? [])]),
  });

  if (reasons.length === 0) {
    return {
      ok: true,
      classification: "approved-simplified-low-poly",
      metadata: frozenMetadata,
      reasons: Object.freeze([]),
    };
  }

  return {
    ok: false,
    classification: "rejected-realistic-or-game-prop",
    metadata: frozenMetadata,
    reasons: Object.freeze(reasons.map((reason) => Object.freeze(reason))),
  };
}

function normalizeToken(value: string): string {
  return value.trim().toLowerCase();
}
