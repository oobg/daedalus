import assert from "node:assert/strict";
import test from "node:test";

import { createWallCornerMeshes } from "../src/features/viewer/wall-corner-mesh.ts";

test("createWallCornerMeshes emits extruded corner meshes from softened corner paths instead of primitive box corners", () => {
  const meshes = createWallCornerMeshes(
    [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 4, y: 3 },
      { x: 0, y: 3 },
    ],
    {
      baseOffset: 0.014,
      curveSegments: 6,
      height: 0.9,
      minimumWallCornerRadius: 0.4,
      thickness: 0.045,
      topEdgeRadius: 0.011,
      wallCornerRadiusRatio: 5,
      wallCornerSegments: 4,
      wallCornerStyle: "rounded",
    },
  );

  assert.equal(meshes.length, 16);

  for (const mesh of meshes) {
    assert.equal(mesh.source, "softened-corner-path");
    assert.equal(mesh.geometry.type, "ExtrudeGeometry");
    assert.notEqual(mesh.geometry.type, "BoxGeometry");
    assert.ok(
      mesh.cornerPathPointCount > 2,
      "Expected each corner mesh to come from a multi-point softened path.",
    );
  }

  const lowerRightCornerMeshes = meshes.filter(
    (mesh) => mesh.originalCorner.x === 4 && mesh.originalCorner.y === 0,
  );

  assert.equal(lowerRightCornerMeshes.length, 4);

  const firstCornerMesh = lowerRightCornerMeshes[0];

  assert.equal(
    firstCornerMesh.path.some((point) => point.x === 4 && point.y === 0),
    false,
  );
  assert.ok(
    firstCornerMesh.path.some(
      (point) => point.x > 3.6 && point.x < 4 && point.y > 0 && point.y < 0.4,
    ),
    "Expected the corner path to include rounded transition points near the original lower-right corner.",
  );
  assert.equal(firstCornerMesh.position[1], 0.014);
  assert.ok(firstCornerMesh.position[0] > 3.6 && firstCornerMesh.position[0] < 4);
  assert.ok(firstCornerMesh.position[2] > 0 && firstCornerMesh.position[2] < 0.4);
});
