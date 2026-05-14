import assert from "node:assert/strict";
import test from "node:test";

import {
  MAX_APPROVED_FURNITURE_TEXTURE_SET_COUNT,
  MAX_APPROVED_FURNITURE_TRIANGLE_COUNT,
  validateFurnitureAssetMetadata,
} from "../src/features/viewer/index.ts";

test("validateFurnitureAssetMetadata approves simplified low-poly furniture metadata", () => {
  const result = validateFurnitureAssetMetadata({
    assetId: "chair-lounge-oak",
    category: "chair",
    triangleCount: MAX_APPROVED_FURNITURE_TRIANGLE_COUNT,
    geometryProfile: "rounded-low-poly",
    materialFinish: "matte",
    textureSetCount: MAX_APPROVED_FURNITURE_TEXTURE_SET_COUNT,
    tags: ["miniature", " lounge ", "handcrafted"],
    hasRig: false,
    hasAnimation: false,
  });

  assert.deepEqual(result, {
    ok: true,
    classification: "approved-simplified-low-poly",
    metadata: {
      assetId: "chair-lounge-oak",
      category: "chair",
      triangleCount: MAX_APPROVED_FURNITURE_TRIANGLE_COUNT,
      geometryProfile: "rounded-low-poly",
      materialFinish: "matte",
      textureSetCount: MAX_APPROVED_FURNITURE_TEXTURE_SET_COUNT,
      tags: ["miniature", " lounge ", "handcrafted"],
      hasRig: false,
      hasAnimation: false,
    },
    reasons: [],
  });
  assert.ok(Object.isFrozen(result.metadata));
  assert.ok(Object.isFrozen(result.metadata.tags));
});

test("validateFurnitureAssetMetadata rejects realistic furniture metadata with high geometry and PBR-like detail", () => {
  const result = validateFurnitureAssetMetadata({
    assetId: "sofa-hero-prop",
    category: "sofa",
    triangleCount: 8_600,
    geometryProfile: "sculpted-high-poly",
    materialFinish: "glossy",
    textureSetCount: 4,
    tags: ["Photorealistic", "hero-prop", "living-room"],
  });

  assert.equal(result.ok, false);

  if (result.ok) {
    return;
  }

  assert.equal(result.classification, "rejected-realistic-or-game-prop");
  assert.deepEqual(
    result.reasons.map((reason) => reason.code),
    [
      "disallowed_style_tag",
      "excessive_geometry",
      "missing_simplified_geometry_profile",
      "realistic_material_finish",
      "too_many_texture_sets",
    ],
  );
});

test("validateFurnitureAssetMetadata rejects rigged or animated game-prop furniture even when the mesh budget is small", () => {
  const result = validateFurnitureAssetMetadata({
    assetId: "cabinet-loot-drop",
    category: "storage",
    triangleCount: 1_200,
    geometryProfile: "simplified-low-poly",
    materialFinish: "satin",
    textureSetCount: 1,
    tags: ["game-prop", "interactive"],
    hasRig: true,
    hasAnimation: true,
  });

  assert.equal(result.ok, false);

  if (result.ok) {
    return;
  }

  assert.deepEqual(
    result.reasons.map((reason) => reason.code),
    ["disallowed_style_tag", "unsupported_runtime_features"],
  );
});
