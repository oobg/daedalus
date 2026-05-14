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
        [2.1, 0.26, 1.6, 3, 0.08],
        [2.0, 0.18, 1.52, 4, 0.09],
        [1.72, 0.56, 0.12, 2, 0.06],
      ],
    },
    chair: {
      descriptorType: "primitive-composition",
      normalizedDimensions: { width: 0.58, depth: 0.58, height: 0.82 },
      partIds: ["seat", "backrest", "pedestal"],
      primitives: ["rounded-box", "rounded-box", "cylinder"],
      geometryArgs: [
        [0.5, 0.08, 0.5, 2, 0.04],
        [0.46, 0.34, 0.08, 2, 0.04],
        [0.06, 0.06, 0.38, 6],
      ],
    },
    desk: {
      descriptorType: "primitive-composition",
      normalizedDimensions: { width: 1.4, depth: 0.68, height: 0.76 },
      partIds: ["top", "drawer-block", "leg-frame"],
      primitives: ["rounded-box", "rounded-box", "box"],
      geometryArgs: [
        [1.4, 0.08, 0.68, 2, 0.04],
        [0.42, 0.5, 0.58, 2, 0.03],
        [0.08, 0.68, 0.58],
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
        [2.2, 0.2, 0.96, 3, 0.08],
        [1.96, 0.18, 0.6, 3, 0.08],
        [1.96, 0.52, 0.22, 3, 0.08],
        [0.14, 0.58, 0.86, 2, 0.06],
        [0.14, 0.58, 0.86, 2, 0.06],
      ],
    },
    storage: {
      descriptorType: "handcrafted-model",
      normalizedDimensions: { width: 1.18, depth: 0.46, height: 1.48 },
      partIds: ["plinth", "body", "top"],
      primitives: ["rounded-box", "rounded-box", "rounded-box"],
      geometryArgs: [
        [1.08, 0.08, 0.36, 2, 0.02],
        [1.18, 1.24, 0.46, 2, 0.025],
        [1.18, 0.08, 0.46, 2, 0.025],
      ],
    },
    table: {
      descriptorType: "primitive-composition",
      normalizedDimensions: { width: 1.2, depth: 1.2, height: 0.74 },
      partIds: ["top", "column", "base"],
      primitives: ["rounded-box", "cylinder", "cylinder"],
      geometryArgs: [
        [1.2, 0.07, 1.2, 2, 0.035],
        [0.09, 0.09, 0.58, 6],
        [0.29, 0.29, 0.08, 12],
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
