import test from "node:test";
import assert from "node:assert/strict";

import { normalizeFloor } from "../../domain/floor.ts";
import { readFloorReferenceAssociation } from "./read-floor-reference-association.ts";

test("returns the stored floor plan image reference for the requested floor record", () => {
  const floors = [
    normalizeFloor({
      id: "floor-1",
      name: "Ground Floor",
      referenceImage: "floor-plan://project-alpha/floor-1/ground.png",
    }),
    normalizeFloor({
      id: "floor-2",
      name: "Second Floor",
      referenceImage: "floor-plan://project-alpha/floor-2/second.png",
    }),
  ];

  const referenceImage = readFloorReferenceAssociation({
    floors,
    floorId: "floor-2",
  });

  assert.equal(referenceImage, "floor-plan://project-alpha/floor-2/second.png");
});

test("returns null when the requested floor record has no stored floor plan image reference", () => {
  const floors = [
    normalizeFloor({
      id: "floor-1",
      name: "Ground Floor",
      referenceImage: null,
    }),
  ];

  const referenceImage = readFloorReferenceAssociation({
    floors,
    floorId: "floor-1",
  });

  assert.equal(referenceImage, null);
});

test("throws when querying the floor plan image reference for a missing floor record", () => {
  assert.throws(
    () =>
      readFloorReferenceAssociation({
        floors: [
          normalizeFloor({
            id: "floor-1",
            name: "Ground Floor",
            referenceImage: null,
          }),
        ],
        floorId: "missing-floor",
      }),
    /Floor "missing-floor" was not found\./,
  );
});
