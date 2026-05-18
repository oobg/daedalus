import assert from "node:assert/strict";
import test from "node:test";

import { normalizeFloor } from "../../domain/floor.ts";
import { associatePersistedFloorPlanUploadToFloor } from "./associate-persisted-floor-plan-upload.ts";
import { readFloorReferenceAssociation } from "./read-floor-reference-association.ts";

test("associatePersistedFloorPlanUploadToFloor links a persisted upload record to the selected floor", () => {
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

  const persistedUpload = {
    floorId: "floor-1",
    assetRef: "floor-plan://project-alpha/floor-1/uploaded-ground.png",
  };

  const result = associatePersistedFloorPlanUploadToFloor({
    floors,
    floorId: "floor-1",
    persistedUpload,
  });

  assert.equal(result.persistedUpload.assetRef, persistedUpload.assetRef);
  assert.equal(result.floor.id, "floor-1");
  assert.equal(result.floor.referenceImage, persistedUpload.assetRef);
  assert.equal(result.floors[0].referenceImage, persistedUpload.assetRef);
  assert.equal(
    result.floors[1].referenceImage,
    "floor-plan://project-alpha/floor-2/existing.png",
  );
  assert.notEqual(result.floors[0], floors[0]);
  assert.equal(result.floors[1], floors[1]);
});

test("associatePersistedFloorPlanUploadToFloor rejects a persisted upload from another floor", () => {
  const floors = [
    normalizeFloor({
      id: "floor-1",
      name: "Ground Floor",
      referenceImage: null,
    }),
    normalizeFloor({
      id: "floor-2",
      name: "Second Floor",
      referenceImage: null,
    }),
  ];

  assert.throws(
    () =>
      associatePersistedFloorPlanUploadToFloor({
        floors,
        floorId: "floor-1",
        persistedUpload: {
          floorId: "floor-2",
          assetRef: "floor-plan://project-alpha/floor-2/uploaded-second.png",
        },
      }),
    /belongs to floor "floor-2", not "floor-1"/,
  );
});

test("associatePersistedFloorPlanUploadToFloor rejects linking a persisted upload when the target floor already has an association", () => {
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
      associatePersistedFloorPlanUploadToFloor({
        floors,
        floorId: "floor-1",
        persistedUpload: {
          floorId: "floor-1",
          assetRef: "floor-plan://project-alpha/floor-1/uploaded-ground.png",
        },
      }),
    /already has an associated reference image/,
  );
});

test("associatePersistedFloorPlanUploadToFloor preserves the floor-to-image mapping across write then query without mutating inputs", () => {
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
  const originalFirstFloor = floors[0];
  const persistedUpload = {
    floorId: "floor-1",
    assetRef: "floor-plan://project-alpha/floor-1/uploaded-ground.png",
  };

  const result = associatePersistedFloorPlanUploadToFloor({
    floors,
    floorId: "floor-1",
    persistedUpload,
  });

  const queriedReferenceImage = readFloorReferenceAssociation({
    floors: result.floors,
    floorId: "floor-1",
  });

  assert.equal(queriedReferenceImage, persistedUpload.assetRef);
  assert.equal(floors[0], originalFirstFloor);
  assert.equal(floors[0].referenceImage, null);
  assert.notEqual(result.persistedUpload, persistedUpload);
  assert.deepEqual(result.persistedUpload, persistedUpload);
});
