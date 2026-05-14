import assert from "node:assert/strict";
import test from "node:test";

import { resolveFurnitureDescriptor } from "../src/features/viewer/furniture-descriptor-mapping.ts";
import {
  buildFurniturePrimitive,
  buildFurniturePrimitives,
} from "../src/features/viewer/furniture-primitive-builder.ts";

test("buildFurniturePrimitive keeps box primitives within the configured vertex budget", () => {
  const descriptor = resolveFurnitureDescriptor("desk");

  assert.equal(descriptor.descriptorType, "primitive-composition");

  const legFrame = descriptor.parts.find((part) => part.partId === "leg-frame");
  assert.ok(legFrame);

  const primitive = buildFurniturePrimitive(legFrame, {
    maxBoxVertices: 8,
  });

  assert.equal(primitive.primitive, "box");
  assert.equal(primitive.segmentCount, 1);
  assert.equal(primitive.vertexCount, 8);
  assert.equal(primitive.vertexCount <= 8, true);
  assert.deepEqual(primitive.geometryArgs, [0.08, 0.68, 0.58]);
  assert.ok(Object.isFrozen(primitive));
  assert.ok(Object.isFrozen(primitive.dimensions));
  assert.ok(Object.isFrozen(primitive.position));
  assert.ok(Object.isFrozen(primitive.geometryArgs));
});

test("buildFurniturePrimitive clamps cylinder radial segments to the configured low-poly limits", () => {
  const descriptor = resolveFurnitureDescriptor("table");

  assert.equal(descriptor.descriptorType, "primitive-composition");

  const base = descriptor.parts.find((part) => part.partId === "base");
  assert.ok(base);

  const primitive = buildFurniturePrimitive(base, {
    maxCylinderRadialSegments: 8,
    maxCylinderVertices: 18,
  });

  assert.equal(primitive.primitive, "cylinder");
  assert.equal(primitive.radialSegments <= 8, true);
  assert.equal(primitive.segmentCount <= 8, true);
  assert.equal(primitive.vertexCount <= 18, true);
  assert.deepEqual(primitive.geometryArgs, [0.29, 0.29, 0.08, 8]);
});

test("buildFurniturePrimitive clamps rounded-box corner radius and segment complexity inside the configured bounds", () => {
  const primitive = buildFurniturePrimitive(
    {
      partId: "test-rounded-backrest",
      primitive: "rounded-box",
      dimensions: { width: 0.46, depth: 0.08, height: 0.34 },
      position: { x: 0, y: 0.62, z: -0.21 },
      cornerRadius: 0.2,
    },
    {
      maxRoundedBoxSegments: 3,
      maxRoundedBoxVertices: 56,
    },
  );

  assert.equal(primitive.primitive, "rounded-box");
  assert.equal(primitive.cornerRadius, 0.04);
  assert.equal(primitive.segmentCount <= 3, true);
  assert.equal(primitive.vertexCount <= 56, true);
  assert.deepEqual(primitive.geometryArgs, [0.46, 0.34, 0.08, 2, 0.04]);
});

test("buildFurniturePrimitives converts a normalized primitive descriptor into bounded primitive specs for each part", () => {
  const descriptor = resolveFurnitureDescriptor("chair");

  assert.equal(descriptor.descriptorType, "primitive-composition");

  const primitives = buildFurniturePrimitives(descriptor, {
    maxBoxVertices: 8,
    maxCylinderRadialSegments: 8,
    maxCylinderVertices: 18,
    maxRoundedBoxSegments: 3,
    maxRoundedBoxVertices: 56,
  });

  assert.equal(primitives.length, 3);
  assert.deepEqual(
    primitives.map((primitive) => primitive.primitive),
    ["rounded-box", "rounded-box", "cylinder"],
  );
  assert.equal(
    primitives.every((primitive) => {
      if (primitive.primitive === "box") {
        return primitive.vertexCount <= 8;
      }

      if (primitive.primitive === "cylinder") {
        return primitive.segmentCount <= 8 && primitive.vertexCount <= 18;
      }

      return primitive.segmentCount <= 3 && primitive.vertexCount <= 56;
    }),
    true,
  );
});
