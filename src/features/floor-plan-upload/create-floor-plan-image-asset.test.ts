import test from "node:test";
import assert from "node:assert/strict";

import { createFloorPlanImageAsset } from "./create-floor-plan-image-asset.ts";
import {
  loadStoredFloorPlanImage,
  type FloorPlanImageStorage,
} from "./floor-plan-image-storage.ts";
import { createPngTestFile } from "./test-floor-plan-image-fixtures.ts";

class InMemoryFloorPlanImageStorage implements FloorPlanImageStorage {
  private readonly entries = new Map<string, string>();
  public writeCount = 0;

  getItem(key: string): string | null {
    return this.entries.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.writeCount += 1;
    this.entries.set(key, value);
  }
}

test("creates a floor plan image asset from an uploaded file and persists it with a stable reference", async () => {
  const storage = new InMemoryFloorPlanImageStorage();
  const upload = createPngTestFile("ground-floor.png");

  const firstAsset = await createFloorPlanImageAsset(
    {
      projectId: "project-alpha",
      floorId: "floor-1",
      upload,
    },
    storage,
  );
  const secondAsset = await createFloorPlanImageAsset(
    {
      projectId: "project-alpha",
      floorId: "floor-1",
      upload,
    },
    storage,
  );

  assert.equal(firstAsset.assetRef, secondAsset.assetRef);
  assert.match(
    firstAsset.assetRef,
    /^floor-plan:\/\/project-alpha\/floor-1\/[a-f0-9]{16}-ground-floor\.png$/,
  );
  assert.deepEqual(loadStoredFloorPlanImage(firstAsset.assetRef, storage), firstAsset);
});

test("rejects invalid floor plan uploads before any storage asset is created", async () => {
  const storage = new InMemoryFloorPlanImageStorage();
  const upload = new File(["not-a-real-image"], "ground-floor.png", {
    type: "image/png",
  });

  await assert.rejects(
    createFloorPlanImageAsset(
      {
        projectId: "project-alpha",
        floorId: "floor-1",
        upload,
      },
      storage,
    ),
    /invalid_image_content/,
  );

  assert.equal(storage.writeCount, 0);
});

test("rejects non-accepted floor plan uploads before any storage asset is created", async () => {
  const storage = new InMemoryFloorPlanImageStorage();
  const upload = new File(["<svg></svg>"], "ground-floor.svg", {
    type: "image/svg+xml",
  });

  await assert.rejects(
    createFloorPlanImageAsset(
      {
        projectId: "project-alpha",
        floorId: "floor-1",
        upload,
      },
      storage,
    ),
    /unsupported_type/,
  );

  assert.equal(storage.writeCount, 0);
});
