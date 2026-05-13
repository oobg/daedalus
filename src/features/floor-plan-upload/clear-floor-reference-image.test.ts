import test from "node:test";
import assert from "node:assert/strict";

import { normalizeFloor } from "../../domain/floor.ts";
import { clearFloorReferenceImage } from "./clear-floor-reference-image.ts";

test("clears the linked floor reference image for the specified floor only", () => {
  const floors = [
    normalizeFloor({
      id: "floor-1",
      name: "Ground Floor",
      referenceImage: "floor-plan://project-alpha/floor-1/original.png",
    }),
    normalizeFloor({
      id: "floor-2",
      name: "Second Floor",
      referenceImage: "floor-plan://project-alpha/floor-2/existing.png",
    }),
    normalizeFloor({
      id: "floor-3",
      name: "Third Floor",
      referenceImage: null,
    }),
  ];

  const result = clearFloorReferenceImage({
    floors,
    floorId: "floor-1",
  });

  assert.equal(result.floor.referenceImage, null);
  assert.equal(result.floors[0].referenceImage, null);
  assert.equal(
    result.floors[1].referenceImage,
    "floor-plan://project-alpha/floor-2/existing.png",
  );
  assert.equal(result.floors[2].referenceImage, null);
  assert.notEqual(result.floors[0], floors[0]);
  assert.equal(result.floors[1], floors[1]);
  assert.equal(result.floors[2], floors[2]);
});

test("throws when attempting to clear a reference image for a missing floor", () => {
  const floors = [
    normalizeFloor({
      id: "floor-1",
      name: "Ground Floor",
      referenceImage: "floor-plan://project-alpha/floor-1/original.png",
    }),
  ];

  assert.throws(
    () =>
      clearFloorReferenceImage({
        floors,
        floorId: "missing-floor",
      }),
    /Floor "missing-floor" was not found\./,
  );
});
