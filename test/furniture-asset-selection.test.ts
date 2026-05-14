import assert from "node:assert/strict";
import test from "node:test";

import {
  resolveApprovedFurnitureAsset,
  validateFurnitureAssetMetadata,
} from "../src/features/viewer/index.ts";

test("resolveApprovedFurnitureAsset returns the approved furniture model for a registered lookup request", () => {
  const validation = validateFurnitureAssetMetadata({
    assetId: "chair-lounge-oak",
    category: "chair",
    triangleCount: 1_200,
    geometryProfile: "rounded-low-poly",
    materialFinish: "matte",
    textureSetCount: 1,
    tags: ["miniature", "handcrafted"],
  });

  const result = resolveApprovedFurnitureAsset(
    { assetId: "chair-lounge-oak" },
    [
      {
        assetId: "chair-lounge-oak",
        modelPath: "/models/furniture/chair-lounge-oak.glb",
        metadata: validation.metadata,
        validation,
      },
    ],
  );

  assert.deepEqual(result, {
    ok: true,
    asset: {
      assetId: "chair-lounge-oak",
      modelPath: "/models/furniture/chair-lounge-oak.glb",
      metadata: {
        assetId: "chair-lounge-oak",
        category: "chair",
        triangleCount: 1_200,
        geometryProfile: "rounded-low-poly",
        materialFinish: "matte",
        textureSetCount: 1,
        tags: ["miniature", "handcrafted"],
      },
      validation,
    },
  });

  assert.ok(result.ok);
  if (!result.ok) {
    return;
  }

  assert.ok(Object.isFrozen(result.asset));
});

test("resolveApprovedFurnitureAsset rejects a registered asset when its validation result is not approved", () => {
  const validation = validateFurnitureAssetMetadata({
    assetId: "sofa-hero-prop",
    category: "sofa",
    triangleCount: 8_600,
    geometryProfile: "sculpted-high-poly",
    materialFinish: "glossy",
    textureSetCount: 4,
    tags: ["hero-prop", "photorealistic"],
  });

  const result = resolveApprovedFurnitureAsset(
    { assetId: "sofa-hero-prop" },
    [
      {
        assetId: "sofa-hero-prop",
        modelPath: "/models/furniture/sofa-hero-prop.glb",
        metadata: validation.metadata,
        validation,
      },
    ],
  );

  assert.deepEqual(result, {
    ok: false,
    code: "asset_not_approved",
    assetId: "sofa-hero-prop",
    message:
      'Furniture asset "sofa-hero-prop" is not approved for the miniature viewer.',
    validation,
  });
});

test("resolveApprovedFurnitureAsset rejects lookup requests for assets outside the registered catalog", () => {
  const validation = validateFurnitureAssetMetadata({
    assetId: "table-bistro-ash",
    category: "table",
    triangleCount: 900,
    geometryProfile: "beveled-low-poly",
    materialFinish: "satin",
    textureSetCount: 1,
    tags: ["miniature"],
  });

  const result = resolveApprovedFurnitureAsset(
    { assetId: "lamp-reading-nook" },
    [
      {
        assetId: "table-bistro-ash",
        modelPath: "/models/furniture/table-bistro-ash.glb",
        metadata: validation.metadata,
        validation,
      },
    ],
  );

  assert.deepEqual(result, {
    ok: false,
    code: "asset_not_found",
    assetId: "lamp-reading-nook",
    message:
      'Furniture asset "lamp-reading-nook" is not registered in the approved model catalog.',
    validation: null,
  });
});
