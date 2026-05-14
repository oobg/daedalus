import assert from "node:assert/strict";
import test from "node:test";

import { computeFurnitureAssetGeometryMetrics } from "../src/features/viewer/index.ts";
import {
  createUnindexedFixture,
  furnitureGeometryMeshFixtures,
} from "./fixtures/furniture-geometry-mesh-fixtures.ts";

test("computeFurnitureAssetGeometryMetrics reports normalized polygon and silhouette metrics for a diorama-friendly furniture mesh fixture", () => {
  const metrics = computeFurnitureAssetGeometryMetrics(
    furnitureGeometryMeshFixtures.chairRoundedOctagon,
    { maxTriangleCount: 56 },
  );

  assert.equal(metrics.assetId, "chair-rounded-octagon");
  assert.equal(metrics.triangleCount, 28);
  assert.equal(metrics.normalizedPolygonCount, 0.5);
  assert.ok(metrics.projectedBounds.width > 0.8);
  assert.ok(metrics.projectedBounds.depth > 0.7);
  assert.ok(metrics.silhouetteArea > 0.55);
  assert.ok(metrics.silhouettePerimeter > 2.7);
  assert.ok(metrics.normalizedSilhouetteCoverage > 0.8);
  assert.ok(metrics.normalizedSilhouetteComplexity < 0.05);
  assert.ok(Object.isFrozen(metrics));
  assert.ok(Object.isFrozen(metrics.projectedBounds));
});

test("computeFurnitureAssetGeometryMetrics distinguishes a more intricate silhouette fixture for diorama budgeting", () => {
  const simpleMetrics = computeFurnitureAssetGeometryMetrics(
    furnitureGeometryMeshFixtures.chairRoundedOctagon,
    { maxTriangleCount: 56 },
  );
  const intricateMetrics = computeFurnitureAssetGeometryMetrics(
    furnitureGeometryMeshFixtures.consoleCrossFootprint,
    { maxTriangleCount: 56 },
  );

  assert.equal(intricateMetrics.triangleCount, 44);
  assert.ok(
    intricateMetrics.normalizedPolygonCount >
      simpleMetrics.normalizedPolygonCount,
  );
  assert.ok(
    intricateMetrics.normalizedSilhouetteComplexity >
      simpleMetrics.normalizedSilhouetteComplexity,
  );
  assert.ok(
    intricateMetrics.normalizedSilhouetteCoverage <
      simpleMetrics.normalizedSilhouetteCoverage,
  );
  assert.ok(intricateMetrics.silhouettePerimeter > simpleMetrics.silhouettePerimeter);
});

test("computeFurnitureAssetGeometryMetrics supports unindexed fixture meshes", () => {
  const metrics = computeFurnitureAssetGeometryMetrics(
    createUnindexedFixture(furnitureGeometryMeshFixtures.chairRoundedOctagon),
    { maxTriangleCount: 56 },
  );

  assert.equal(metrics.triangleCount, 28);
  assert.equal(metrics.normalizedPolygonCount, 0.5);
  assert.ok(metrics.normalizedSilhouetteCoverage > 0.8);
});
