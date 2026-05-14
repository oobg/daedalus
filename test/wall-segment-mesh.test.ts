import assert from "node:assert/strict";
import test from "node:test";

import { createStraightWallSegmentMeshes } from "../src/features/viewer/wall-segment-mesh.ts";

test("createStraightWallSegmentMeshes emits extruded wall meshes from the softened profile path instead of primitive boxes", () => {
  const meshes = createStraightWallSegmentMeshes(
    [
      { x: 0, y: 0 },
      { x: 3.2, y: 0 },
      { x: 3.2, y: 2.4 },
      { x: 0, y: 2.4 },
    ],
    {
      baseOffset: 0.014,
      curveSegments: 6,
      height: 0.9,
      thickness: 0.045,
      topEdgeRadius: 0.011,
    },
  );

  assert.equal(meshes.length, 4);

  for (const mesh of meshes) {
    assert.equal(mesh.source, "softened-straight-segment");
    assert.equal(mesh.geometry.type, "ExtrudeGeometry");
    assert.notEqual(mesh.geometry.type, "BoxGeometry");
    assert.ok(
      mesh.profilePointCount > 4,
      "Expected softened profile data to add silhouette points beyond a rectangular box.",
    );
  }

  const [firstMesh] = meshes;
  const profileShape = Array.isArray(firstMesh.geometry.parameters.shapes)
    ? firstMesh.geometry.parameters.shapes[0]
    : firstMesh.geometry.parameters.shapes;
  const outline = profileShape.extractPoints(12).shape;
  const halfThickness = 0.045 / 2;

  assert.ok(
    !outline.some(
      (point) =>
        almostEqual(point.x, halfThickness) && almostEqual(point.y, 0.9),
    ),
    "Softened segment geometry should not keep the hard top-right box corner.",
  );
  assert.ok(
    outline.some(
      (point) =>
        point.x > halfThickness - 0.011 &&
        point.x < halfThickness &&
        point.y > 0.9 - 0.011 &&
        point.y < 0.9,
    ),
    "Softened segment geometry should contain rounded transition points near the top-right silhouette.",
  );
  assert.deepEqual(firstMesh.position, [1.6, 0.014, 0]);
});

function almostEqual(left: number, right: number, epsilon = 1e-6): boolean {
  return Math.abs(left - right) <= epsilon;
}
