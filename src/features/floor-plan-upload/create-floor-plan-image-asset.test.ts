import test from "node:test";
import assert from "node:assert/strict";

import { createFloorPlanImageAsset } from "./create-floor-plan-image-asset.ts";
import {
  loadStoredFloorPlanImage,
  type FloorPlanImageStorage,
} from "./floor-plan-image-storage.ts";

class InMemoryFloorPlanImageStorage implements FloorPlanImageStorage {
  private readonly entries = new Map<string, string>();

  getItem(key: string): string | null {
    return this.entries.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.entries.set(key, value);
  }
}

test("creates a floor plan image asset from an uploaded file and persists it with a stable reference", async () => {
  const storage = new InMemoryFloorPlanImageStorage();
  const upload = new File(["binary-image-data"], "ground-floor.png", {
    type: "image/png",
  });

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
