import assert from "node:assert/strict";
import test from "node:test";

import {
  SUPPORTED_FURNITURE_TYPES,
  assertFurnitureAssetReference,
  isNormalizedFurnitureDescriptor,
  resolveFurnitureDescriptor,
  validateFurnitureAssetReference,
} from "../src/features/viewer/index.ts";

test("resolveFurnitureDescriptor returns a valid normalized descriptor for every supported furniture type", () => {
  for (const furnitureType of SUPPORTED_FURNITURE_TYPES) {
    const descriptor = resolveFurnitureDescriptor(furnitureType);

    assert.ok(
      isNormalizedFurnitureDescriptor(descriptor),
      `Expected "${furnitureType}" to resolve to a valid normalized descriptor.`,
    );
    assert.ok(Object.isFrozen(descriptor));
    assert.ok(Object.isFrozen(descriptor.footprint));

    if (descriptor.descriptorType === "primitive-composition") {
      assert.ok(descriptor.parts.length > 0);
      assert.ok(Object.isFrozen(descriptor.parts));

      for (const part of descriptor.parts) {
        assert.ok(Object.isFrozen(part));
        assert.ok(Object.isFrozen(part.dimensions));
        assert.ok(Object.isFrozen(part.position));
      }

      continue;
    }

    assert.match(descriptor.modelAssetId, /\S/);
    assert.equal(descriptor.scale > 0, true);
  }
});

test("resolveFurnitureDescriptor covers both primitive compositions and handcrafted model descriptors", () => {
  const primitiveDescriptor = resolveFurnitureDescriptor("chair");
  const modelDescriptor = resolveFurnitureDescriptor("sofa");

  assert.equal(primitiveDescriptor.descriptorType, "primitive-composition");
  assert.equal(modelDescriptor.descriptorType, "handcrafted-model");

  if (primitiveDescriptor.descriptorType === "primitive-composition") {
    assert.deepEqual(
      primitiveDescriptor.parts.map((part) => part.primitive),
      ["rounded-box", "rounded-box", "cylinder"],
    );
  }

  if (modelDescriptor.descriptorType === "handcrafted-model") {
    assert.equal(modelDescriptor.modelAssetId, "sofa-compact-arched-oak-base");
  }
});

test("validateFurnitureAssetReference rejects realistic scan and game-prop asset references", () => {
  for (const assetReference of [
    "chair-oak-photoreal-scan",
    "storage_game-prop_crate",
    "sofa-megascans-lounge",
  ]) {
    const result = validateFurnitureAssetReference(assetReference);

    assert.equal(result.ok, false);

    if (result.ok) {
      continue;
    }

    assert.deepEqual(result.issues, [
      {
        path: "modelAssetId",
        message:
          `Normalized furniture descriptor rejected disallowed asset reference "${assetReference}". ` +
          "Realistic scans and game-prop assets are not approved for the miniature viewer.",
      },
    ]);
  }
});

test("isNormalizedFurnitureDescriptor rejects handcrafted descriptors that reference realistic scan or game-prop assets", () => {
  assert.equal(
    isNormalizedFurnitureDescriptor({
      descriptorType: "handcrafted-model",
      footprint: { width: 1.6, depth: 0.8, height: 0.72 },
      materialTag: "upholstery",
      silhouette: "rounded",
      modelAssetId: "sofa-realistic-scan-v2",
      scale: 1,
    }),
    false,
  );
});

test("assertFurnitureAssetReference throws for banned furniture asset reference patterns", () => {
  assert.throws(() => assertFurnitureAssetReference("cabinet-hero-prop"), {
    name: "TypeError",
    message:
      'Normalized furniture descriptor rejected disallowed asset reference "cabinet-hero-prop". Realistic scans and game-prop assets are not approved for the miniature viewer.',
  });
});
