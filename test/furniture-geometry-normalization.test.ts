import assert from "node:assert/strict";
import test from "node:test";

import { computeFurnitureAssetGeometryMetrics } from "../src/features/viewer/furniture-geometry-metrics.ts";
import {
  normalizeFurnitureGeometryMesh,
  normalizeFurnitureGeometryMeshes,
} from "../src/features/viewer/furniture-geometry-normalization.ts";
import {
  createUnindexedFixture,
  furnitureGeometryMeshFixtures,
} from "./fixtures/furniture-geometry-mesh-fixtures.ts";

test("normalizeFurnitureGeometryMesh re-extrudes a selected furniture mesh under the requested miniature polygon budget", () => {
  const originalMesh = furnitureGeometryMeshFixtures.sofaScallopedShowpiece;
  const normalizedMesh = normalizeFurnitureGeometryMesh(originalMesh, {
    maxTriangleCount: 24,
  });

  assert.equal(normalizedMesh.assetId, "sofa-scalloped-showpiece");
  assert.equal(normalizedMesh.source, "miniature-extruded-footprint");
  assert.equal(normalizedMesh.normalizedFromTriangleCount, 76);
  assert.equal(normalizedMesh.normalizedTriangleCount, 24);
  assert.equal(normalizedMesh.footprintVertexCount, 7);
  assert.ok(normalizedMesh.indices != null);
  assert.equal(normalizedMesh.indices.length / 3, 24);
  assert.equal(Math.max(...normalizedMesh.positions.filter((_, index) => index % 3 === 1)), 0.46);
  assert.ok(Object.isFrozen(normalizedMesh));
  assert.ok(Object.isFrozen(normalizedMesh.positions));
  assert.ok(Object.isFrozen(normalizedMesh.indices));
});

test("normalizeFurnitureGeometryMesh preserves readable coverage while reducing silhouette complexity for miniature furniture output", () => {
  const originalMetrics = computeFurnitureAssetGeometryMetrics(
    furnitureGeometryMeshFixtures.sofaScallopedShowpiece,
    { maxTriangleCount: 120 },
  );
  const normalizedMesh = normalizeFurnitureGeometryMesh(
    furnitureGeometryMeshFixtures.sofaScallopedShowpiece,
    { maxTriangleCount: 24 },
  );
  const normalizedMetrics = computeFurnitureAssetGeometryMetrics(normalizedMesh, {
    maxTriangleCount: 24,
  });

  assert.ok(
    normalizedMetrics.normalizedPolygonCount <= 1,
    "Expected normalized furniture output to stay within the requested triangle budget.",
  );
  assert.ok(
    normalizedMetrics.normalizedSilhouetteCoverage > 0.82,
    "Expected simplified miniature furniture to keep most of the original footprint coverage.",
  );
  assert.ok(
    normalizedMetrics.silhouettePerimeter < originalMetrics.silhouettePerimeter,
    "Expected normalization to trim perimeter noise from the projected miniature silhouette.",
  );
  assert.ok(
    normalizedMetrics.projectedBounds.width >=
      originalMetrics.projectedBounds.width * 0.95,
    "Expected normalization to preserve the furniture's overall miniature width.",
  );
});

test("normalizeFurnitureGeometryMeshes supports batches of selected meshes and unindexed source geometry", () => {
  const normalizedMeshes = normalizeFurnitureGeometryMeshes(
    [
      furnitureGeometryMeshFixtures.consoleCrossFootprint,
      createUnindexedFixture(furnitureGeometryMeshFixtures.sofaScallopedShowpiece),
    ],
    { maxTriangleCount: 20 },
  );

  assert.equal(normalizedMeshes.length, 2);
  assert.deepEqual(
    normalizedMeshes.map((mesh) => mesh.normalizedTriangleCount),
    [20, 20],
  );
  assert.deepEqual(
    normalizedMeshes.map((mesh) => mesh.footprintVertexCount),
    [6, 6],
  );
  assert.ok(
    normalizedMeshes.every((mesh) => mesh.normalizedTriangleCount <= 20),
  );
});
