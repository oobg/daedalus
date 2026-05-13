import test from "node:test";
import assert from "node:assert/strict";

import { normalizeFloor } from "../../domain/floor.ts";
import { replaceFloorReferenceImage } from "./replace-floor-reference-image.ts";

test("replaces the floor reference image for the specified floor only", () => {
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

  const result = replaceFloorReferenceImage({
    floors,
    floorId: "floor-2",
    nextReferenceImage: "floor-plan://project-alpha/floor-2/replacement.png",
  });

  assert.equal(
    result.floor.referenceImage,
    "floor-plan://project-alpha/floor-2/replacement.png",
  );
  assert.equal(
    result.floors[0].referenceImage,
    "floor-plan://project-alpha/floor-1/original.png",
  );
  assert.equal(
    result.floors[1].referenceImage,
    "floor-plan://project-alpha/floor-2/replacement.png",
  );
  assert.equal(result.floors[2].referenceImage, null);
  assert.equal(result.floors[0], floors[0]);
  assert.notEqual(result.floors[1], floors[1]);
  assert.equal(result.floors[2], floors[2]);
});

test("can clear the linked floor reference image for one floor without changing others", () => {
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
  ];

  const result = replaceFloorReferenceImage({
    floors,
    floorId: "floor-1",
    nextReferenceImage: null,
  });

  assert.equal(result.floors[0].referenceImage, null);
  assert.equal(
    result.floors[1].referenceImage,
    "floor-plan://project-alpha/floor-2/existing.png",
  );
  assert.notEqual(result.floors[0], floors[0]);
  assert.equal(result.floors[1], floors[1]);
});

test("throws when attempting to replace a reference image for a missing floor", () => {
  const floors = [
    normalizeFloor({
      id: "floor-1",
      name: "Ground Floor",
      referenceImage: "floor-plan://project-alpha/floor-1/original.png",
    }),
  ];

  assert.throws(
    () =>
      replaceFloorReferenceImage({
        floors,
        floorId: "missing-floor",
        nextReferenceImage: "floor-plan://project-alpha/missing-floor/new.png",
      }),
    /Floor "missing-floor" was not found\./,
  );
});
