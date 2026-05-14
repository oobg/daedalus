import assert from "node:assert/strict";
import test from "node:test";

import {
  createExteriorWallMeshAssembly,
  getExteriorWallMeshOptions,
} from "../src/features/viewer/exterior-wall-mesh.ts";

test("exterior wall mesh assembly keeps the outer shell on the softened silhouette pipeline", () => {
  const options = getExteriorWallMeshOptions({
    height: 2.7,
  });
  const assembly = createExteriorWallMeshAssembly(
    [
      { x: 0, y: 0 },
      { x: 6.4, y: 0 },
      { x: 6.4, y: 4.8 },
      { x: 0, y: 4.8 },
    ],
    {
      height: 2.7,
    },
  );

  assert.equal(options.baseOffset, 0);
  assert.equal(options.wallCornerStyle, "rounded");
  assert.ok(options.thickness > 0.045);
  assert.ok(options.topEdgeRadius != null);
  assert.ok(options.topEdgeRadius > 0.011);
  assert.ok(options.minimumWallCornerRadius != null);
  assert.ok(options.minimumWallCornerRadius >= 0.22);

  assert.equal(assembly.usesOnlySoftenedGeometryPipeline, true);
  assert.ok(assembly.cornerMeshCount > 0);
  assert.equal(
    assembly.meshes.every((mesh) => mesh.geometry.type === "ExtrudeGeometry"),
    true,
  );
  assert.equal(
    assembly.meshes.some((mesh) => mesh.geometry.type === "BoxGeometry"),
    false,
  );
});
