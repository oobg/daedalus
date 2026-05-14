import assert from "node:assert/strict";
import test from "node:test";

import {
  SUPPORTED_FURNITURE_TYPES,
} from "../src/features/viewer/furniture-descriptor-mapping.ts";
import {
  createFurnitureTypeComposition,
  createFurnitureTypeCompositions,
} from "../src/features/viewer/furniture-type-composition.ts";

test("createFurnitureTypeComposition maps every supported furniture type to a frozen low-detail primitive group with the expected normalized dimensions", () => {
  const expectedByType = {
    bed: {
      descriptorType: "primitive-composition",
      normalizedDimensions: { width: 2.1, depth: 1.6, height: 0.56 },
      partIds: ["base", "mattress", "headboard"],
      primitives: ["rounded-box", "rounded-box", "rounded-box"],
      geometryArgs: [
        [2.1, 0.2392, 1.6, 3, 0.0736],
        [1.96, 0.2088, 1.4896, 4, 0.0882],
        [1.6512, 0.6272, 0.1296, 2, 0.0576],
      ],
    },
    chair: {
      descriptorType: "primitive-composition",
      normalizedDimensions: { width: 0.58, depth: 0.58, height: 0.82 },
      partIds: ["seat", "backrest", "pedestal"],
      primitives: ["rounded-box", "rounded-box", "cylinder"],
      geometryArgs: [
        [0.52, 0.0976, 0.52, 2, 0.0416],
        [0.4416, 0.3808, 0.0736, 2, 0.0368],
        [0.0492, 0.0492, 0.4028, 6],
      ],
    },
    desk: {
      descriptorType: "primitive-composition",
      normalizedDimensions: { width: 1.4, depth: 0.68, height: 0.76 },
      partIds: ["top", "drawer-block", "leg-frame"],
      primitives: ["rounded-box", "rounded-box", "box"],
      geometryArgs: [
        [1.428, 0.0944, 0.6936, 2, 0.0408],
        [0.441, 0.49, 0.5916, 2, 0.0294],
        [0.0704, 0.6936, 0.5452],
      ],
    },
    sofa: {
      descriptorType: "handcrafted-model",
      normalizedDimensions: { width: 2.2, depth: 0.96, height: 0.82 },
      partIds: ["base", "seat", "backrest", "arm-left", "arm-right"],
      primitives: [
        "rounded-box",
        "rounded-box",
        "rounded-box",
        "rounded-box",
        "rounded-box",
      ],
      geometryArgs: [
        [2.2, 0.216, 0.9792, 3, 0.08],
        [1.9208, 0.2124, 0.636, 3, 0.0784],
        [1.9208, 0.5616, 0.2112, 3, 0.0768],
        [0.1512, 0.6148, 0.8428, 2, 0.0588],
        [0.1512, 0.6148, 0.8428, 2, 0.0588],
      ],
    },
    storage: {
      descriptorType: "handcrafted-model",
      normalizedDimensions: { width: 1.18, depth: 0.46, height: 1.48 },
      partIds: ["plinth", "body", "top"],
      primitives: ["rounded-box", "rounded-box", "rounded-box"],
      geometryArgs: [
        [1.0368, 0.0704, 0.324, 2, 0.0176],
        [1.2036, 1.2772, 0.4508, 2, 0.0245],
        [1.2036, 0.088, 0.4508, 2, 0.0245],
      ],
    },
    table: {
      descriptorType: "primitive-composition",
      normalizedDimensions: { width: 1.2, depth: 1.2, height: 0.74 },
      partIds: ["top", "column", "base"],
      primitives: ["rounded-box", "cylinder", "cylinder"],
      geometryArgs: [
        [1.236, 0.0798, 1.236, 2, 0.03605],
        [0.0792, 0.0792, 0.6032, 6],
        [0.261, 0.261, 0.0864, 12],
      ],
    },
  } as const;

  for (const furnitureType of SUPPORTED_FURNITURE_TYPES) {
    const composition = createFurnitureTypeComposition(furnitureType);
    const expected = expectedByType[furnitureType];

    assert.equal(composition.furnitureType, furnitureType);
    assert.equal(composition.descriptorType, expected.descriptorType);
    assert.equal(composition.groupId, `furniture:${furnitureType}`);
    assert.equal(composition.source, "low-detail-primitive-group");
    assert.deepEqual(
      composition.normalizedDimensions,
      expected.normalizedDimensions,
    );
    assert.deepEqual(
      composition.meshes.map((mesh) => mesh.partId),
      expected.partIds,
    );
    assert.deepEqual(
      composition.meshes.map((mesh) => mesh.primitive),
      expected.primitives,
    );
    assert.deepEqual(
      composition.meshes.map((mesh) => [...mesh.geometryArgs]),
      expected.geometryArgs,
    );
    assert.equal(
      composition.meshes.every(
        (mesh) => mesh.meshId === `${furnitureType}:${mesh.partId}`,
      ),
      true,
    );
    assert.ok(Object.isFrozen(composition));
    assert.ok(Object.isFrozen(composition.meshes));
    assert.ok(Object.isFrozen(composition.normalizedDimensions));

    for (const mesh of composition.meshes) {
      assert.ok(Object.isFrozen(mesh));
      assert.ok(Object.isFrozen(mesh.dimensions));
      assert.ok(Object.isFrozen(mesh.position));
      assert.ok(Object.isFrozen(mesh.geometryArgs));
    }
  }
});

test("createFurnitureTypeCompositions preserves supported furniture order and builds one group per type", () => {
  const compositions = createFurnitureTypeCompositions(
    SUPPORTED_FURNITURE_TYPES,
  );

  assert.deepEqual(
    compositions.map((composition) => composition.furnitureType),
    [...SUPPORTED_FURNITURE_TYPES],
  );
  assert.equal(compositions.length, SUPPORTED_FURNITURE_TYPES.length);
});
