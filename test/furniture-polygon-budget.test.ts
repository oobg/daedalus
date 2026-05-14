import assert from "node:assert/strict";
import test from "node:test";

import {
  SUPPORTED_FURNITURE_TYPES,
} from "../src/features/viewer/furniture-descriptor-mapping.ts";
import {
  assertFurniturePolygonBudget,
  buildFurnitureBudgetPrimitivesForType,
  measureFurniturePolygonBudget,
  resolveFurniturePolygonBudget,
  validateFurniturePolygonBudget,
} from "../src/features/viewer/furniture-polygon-budget.ts";

test("measureFurniturePolygonBudget reports bounded mesh complexity for every supported furniture type", () => {
  const expectedByType = {
    bed: {
      maxPrimitiveSegmentCount: 4,
      maxPrimitiveTriangleCount: 108,
      meshCount: 3,
      totalSegmentCount: 9,
      totalTriangleCount: 252,
      totalVertexCount: 168,
    },
    chair: {
      maxPrimitiveSegmentCount: 6,
      maxPrimitiveTriangleCount: 60,
      meshCount: 3,
      totalSegmentCount: 10,
      totalTriangleCount: 140,
      totalVertexCount: 94,
    },
    desk: {
      maxPrimitiveSegmentCount: 2,
      maxPrimitiveTriangleCount: 60,
      meshCount: 3,
      totalSegmentCount: 5,
      totalTriangleCount: 132,
      totalVertexCount: 88,
    },
    sofa: {
      maxPrimitiveSegmentCount: 3,
      maxPrimitiveTriangleCount: 84,
      meshCount: 5,
      totalSegmentCount: 13,
      totalTriangleCount: 372,
      totalVertexCount: 248,
    },
    storage: {
      maxPrimitiveSegmentCount: 2,
      maxPrimitiveTriangleCount: 60,
      meshCount: 3,
      totalSegmentCount: 6,
      totalTriangleCount: 180,
      totalVertexCount: 120,
    },
    table: {
      maxPrimitiveSegmentCount: 12,
      maxPrimitiveTriangleCount: 60,
      meshCount: 3,
      totalSegmentCount: 20,
      totalTriangleCount: 124,
      totalVertexCount: 80,
    },
  } as const;

  for (const furnitureType of SUPPORTED_FURNITURE_TYPES) {
    const primitives = buildFurnitureBudgetPrimitivesForType(furnitureType);
    const metrics = measureFurniturePolygonBudget(furnitureType, primitives);

    assert.deepEqual(metrics, {
      furnitureType,
      ...expectedByType[furnitureType],
    });
    assert.ok(Object.isFrozen(metrics));
  }
});

test("validateFurniturePolygonBudget keeps representative descriptors for every furniture type inside the default low-poly budget", () => {
  for (const furnitureType of SUPPORTED_FURNITURE_TYPES) {
    const primitives = buildFurnitureBudgetPrimitivesForType(furnitureType);
    const validation = validateFurniturePolygonBudget(furnitureType, primitives);

    assert.equal(validation.ok, true, `${furnitureType} should fit the budget`);
    assert.deepEqual(
      validation.budget,
      resolveFurniturePolygonBudget(furnitureType),
    );
    assert.deepEqual(validation.issues, []);
    assert.ok(Object.isFrozen(validation));
    assert.ok(Object.isFrozen(validation.budget));
    assert.ok(Object.isFrozen(validation.metrics));
    assert.ok(Object.isFrozen(validation.issues));
  }
});

test("assertFurniturePolygonBudget fails when a representative furniture type exceeds a configured budget", () => {
  assert.throws(
    () =>
      assertFurniturePolygonBudget(
        "sofa",
        buildFurnitureBudgetPrimitivesForType("sofa"),
        { maxTotalTriangleCount: 300 },
      ),
    {
      message:
        'Furniture type "sofa" exceeds its low-poly budget: totalTriangleCount measured 372 but the budget allows 300',
    },
  );
});
