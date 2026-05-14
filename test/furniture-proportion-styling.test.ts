import assert from "node:assert/strict";
import test from "node:test";

import { resolveFurnitureDescriptor } from "../src/features/viewer/furniture-descriptor-mapping.ts";
import { buildFurniturePrimitives } from "../src/features/viewer/furniture-primitive-builder.ts";
import { normalizeFurnitureProportionStyling } from "../src/features/viewer/furniture-proportion-styling.ts";

test("normalizeFurnitureProportionStyling applies miniature proportion adjustments to supported chair meshes", () => {
  const descriptor = resolveFurnitureDescriptor("chair");

  assert.equal(descriptor.descriptorType, "primitive-composition");

  const primitives = buildFurniturePrimitives(descriptor);
  const styled = normalizeFurnitureProportionStyling("chair", primitives);

  assert.equal(styled.adjustedMeshCount, 3);
  assert.deepEqual(
    styled.meshes.map((mesh) => ({
      partId: mesh.partId,
      dimensions: mesh.dimensions,
      position: mesh.position,
      geometryArgs: [...mesh.geometryArgs],
    })),
    [
      {
        partId: "seat",
        dimensions: { width: 0.52, depth: 0.52, height: 0.0976 },
        position: { x: 0, y: 0.4288, z: 0 },
        geometryArgs: [0.52, 0.0976, 0.52, 2, 0.0416],
      },
      {
        partId: "backrest",
        dimensions: { width: 0.4416, depth: 0.0736, height: 0.3808 },
        position: { x: 0, y: 0.6404, z: -0.21 },
        geometryArgs: [0.4416, 0.3808, 0.0736, 2, 0.0368],
      },
      {
        partId: "pedestal",
        dimensions: { width: 0.0984, depth: 0.0984, height: 0.4028 },
        position: { x: 0, y: 0.2014, z: 0 },
        geometryArgs: [0.0492, 0.0492, 0.4028, 6],
      },
    ],
  );
});

test("normalizeFurnitureProportionStyling leaves unsupported meshes unchanged", () => {
  const styled = normalizeFurnitureProportionStyling("table", [
    Object.freeze({
      partId: "leaf-extension",
      primitive: "box" as const,
      dimensions: Object.freeze({ width: 0.4, depth: 0.2, height: 0.03 }),
      position: Object.freeze({ x: 0.2, y: 0.71, z: 0 }),
      geometryArgs: Object.freeze([0.4, 0.03, 0.2] as const),
      segmentCount: 1,
      vertexCount: 8,
    }),
  ]);

  assert.equal(styled.adjustedMeshCount, 0);
  assert.equal(styled.meshes[0].dimensions.width, 0.4);
  assert.equal(styled.meshes[0].dimensions.height, 0.03);
  assert.deepEqual(styled.meshes[0].geometryArgs, [0.4, 0.03, 0.2]);
});
