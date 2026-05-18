import test from "node:test";
import assert from "node:assert/strict";

import { normalizeFloor } from "../../domain/floor.ts";
import {
  assignFloorReferenceImageToFloor,
  clearFloorReferenceImage,
  replaceFloorReferenceImage,
} from "./floor-reference-image-metadata.ts";

test("assign associates one floor-plan image asset with the specified floor record only", () => {
  const floors = [
    normalizeFloor({
      id: "floor-1",
      name: "Ground Floor",
      referenceImage: null,
    }),
    normalizeFloor({
      id: "floor-2",
      name: "Second Floor",
      referenceImage: "floor-plan://project-alpha/floor-2/existing.png",
    }),
  ];

  const result = assignFloorReferenceImageToFloor({
    floors,
    floorId: "floor-1",
    referenceImageAssetRef: "floor-plan://project-alpha/floor-1/assigned.png",
  });

  assert.equal(
    result.floor.referenceImage,
    "floor-plan://project-alpha/floor-1/assigned.png",
  );
  assert.equal(
    result.floors[0].referenceImage,
    "floor-plan://project-alpha/floor-1/assigned.png",
  );
  assert.equal(
    result.floors[1].referenceImage,
    "floor-plan://project-alpha/floor-2/existing.png",
  );
  assert.notEqual(result.floors[0], floors[0]);
  assert.equal(result.floors[1], floors[1]);
});

test("assign rejects attaching a floor-plan image when the floor already has an associated reference", () => {
  const floors = [
    normalizeFloor({
      id: "floor-1",
      name: "Ground Floor",
      referenceImage: "floor-plan://project-alpha/floor-1/existing.png",
    }),
    normalizeFloor({
      id: "floor-2",
      name: "Second Floor",
      referenceImage: null,
    }),
  ];

  assert.throws(
    () =>
      assignFloorReferenceImageToFloor({
        floors,
        floorId: "floor-1",
        referenceImageAssetRef: "floor-plan://project-alpha/floor-1/assigned.png",
      }),
    /already has an associated reference image/,
  );
});

test("replace swaps the assigned floor-plan image asset for one floor without touching others", () => {
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

test("clear removes the assigned floor-plan image asset from one floor only", () => {
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
