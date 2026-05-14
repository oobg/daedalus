import assert from "node:assert/strict";
import test from "node:test";

import {
  SUPPORTED_FURNITURE_TYPES,
  createFurnitureTypeComposition,
  resolveFurnitureDescriptor,
  resolveFurnitureRenderMaterial,
} from "../src/features/viewer/index.ts";

test("resolveFurnitureRenderMaterial maps every supported furniture category to a constrained diorama-safe default preset", () => {
  const expectedPresetByType = {
    bed: "linen-oat",
    chair: "oiled-oak",
    desk: "oiled-oak",
    sofa: "boucle-sand",
    storage: "chalk-painted-ash",
    table: "oiled-oak",
  } as const;

  for (const furnitureType of SUPPORTED_FURNITURE_TYPES) {
    const descriptor = resolveFurnitureDescriptor(furnitureType);
    const renderMaterial = resolveFurnitureRenderMaterial(
      furnitureType,
      descriptor.materialTag,
    );
    const composition = createFurnitureTypeComposition(furnitureType);

    assert.equal(renderMaterial.presetId, expectedPresetByType[furnitureType]);
    assert.equal(renderMaterial.materialTag, descriptor.materialTag);
    assert.equal(renderMaterial.materialType, "standard");
    assert.ok(renderMaterial.config.roughness >= 0.8);
    assert.ok(renderMaterial.config.metalness <= 0.03);
    assert.ok(Object.isFrozen(renderMaterial));
    assert.ok(Object.isFrozen(renderMaterial.config));

    assert.equal(composition.meshes.length > 0, true);
    assert.equal(
      composition.meshes.every((mesh) => {
        assert.deepEqual(mesh.renderMaterial, renderMaterial);
        return Object.isFrozen(mesh.renderMaterial) && Object.isFrozen(mesh.renderMaterial.config);
      }),
      true,
    );
    assert.equal(
      composition.meshes.every(
        (mesh) =>
          mesh.renderMaterial.presetId === expectedPresetByType[furnitureType],
      ),
      true,
    );
    assert.equal(
      composition.meshes.every((mesh) => mesh.materialTag === descriptor.materialTag),
      true,
    );
  }
});

test("resolveFurnitureRenderMaterial rejects material-tag mismatches that would violate the constrained preset map", () => {
  assert.throws(() => resolveFurnitureRenderMaterial("storage", "warm-wood"), {
    name: "TypeError",
    message:
      'Furniture type "storage" requires material tag "painted-wood", received "warm-wood".',
  });
});
