import assert from "node:assert/strict";
import test from "node:test";

import { normalizeFloor } from "../../domain/floor.ts";
import { associatePersistedFloorPlanUploadToFloor } from "./associate-persisted-floor-plan-upload.ts";

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
