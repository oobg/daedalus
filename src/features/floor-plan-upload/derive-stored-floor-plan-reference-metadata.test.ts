import test from "node:test";
import assert from "node:assert/strict";

import { normalizeFloor } from "../../domain/floor.ts";
import {
  saveAcceptedFloorPlanImage,
  type FloorPlanImageStorage,
} from "./floor-plan-image-storage.ts";
import { deriveStoredFloorPlanReferenceMetadata } from "./derive-stored-floor-plan-reference-metadata.ts";
import { createPngTestFile } from "./test-floor-plan-image-fixtures.ts";

class InMemoryFloorPlanImageStorage implements FloorPlanImageStorage {
  private readonly entries = new Map<string, string>();

  getItem(key: string): string | null {
    return this.entries.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.entries.set(key, value);
  }
}

test("derives stable floor plan reference metadata for a stored floor image association", async () => {
  const storage = new InMemoryFloorPlanImageStorage();
  const storedAsset = await saveAcceptedFloorPlanImage(
    {
      projectId: "project-alpha",
      floorId: "floor-1",
      file: createPngTestFile("ground-floor.png"),
    },
    storage,
  );
  const floors = [
    normalizeFloor({
      id: "floor-1",
      name: "Ground Floor",
      referenceImage: storedAsset.assetRef,
    }),
    normalizeFloor({
      id: "floor-2",
      name: "Second Floor",
      referenceImage: null,
    }),
  ];

  const result = deriveStoredFloorPlanReferenceMetadata(
    {
      floors,
      floorId: "floor-1",
    },
    storage,
  );

  assert.deepEqual(result, {
    ok: true,
    code: "derived",
    metadata: {
      assetRef: storedAsset.assetRef,
      storageKey: storedAsset.storageKey,
      projectId: "project-alpha",
      floorId: "floor-1",
      fileName: "ground-floor.png",
      mimeType: "image/png",
      size: storedAsset.size,
    },
  });
});

test("returns an explicit failure when the floor has no persisted reference image", () => {
  const floors = [
    normalizeFloor({
      id: "floor-1",
      name: "Ground Floor",
      referenceImage: null,
    }),
  ];

  assert.deepEqual(
    deriveStoredFloorPlanReferenceMetadata(
      {
        floors,
        floorId: "floor-1",
      },
      new InMemoryFloorPlanImageStorage(),
    ),
    {
      ok: false,
      code: "missing_reference_image",
      message: 'Floor "floor-1" has no associated reference image.',
    },
  );
});

test("returns an explicit failure when the floor reference points to an unavailable stored asset", () => {
  const floors = [
    normalizeFloor({
      id: "floor-1",
      name: "Ground Floor",
      referenceImage: "floor-plan://project-alpha/floor-1/missing-ground.png",
    }),
  ];

  assert.deepEqual(
    deriveStoredFloorPlanReferenceMetadata(
      {
        floors,
        floorId: "floor-1",
      },
      new InMemoryFloorPlanImageStorage(),
    ),
    {
      ok: false,
      code: "missing_reference_image_asset",
      message:
        'Floor "floor-1" references a floor plan image asset that is unavailable in storage.',
    },
  );
});
