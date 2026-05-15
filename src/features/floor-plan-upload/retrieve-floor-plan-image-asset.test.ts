import test from "node:test";
import assert from "node:assert/strict";

import {
  saveAcceptedFloorPlanImage,
  type FloorPlanImageStorage,
} from "./floor-plan-image-storage.ts";
import { retrieveFloorPlanImageAsset } from "./retrieve-floor-plan-image-asset.ts";

class InMemoryFloorPlanImageStorage implements FloorPlanImageStorage {
  private readonly entries = new Map<string, string>();

  getItem(key: string): string | null {
    return this.entries.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.entries.set(key, value);
  }
}

test("retrieves stored floor plan image metadata and content by stable asset reference", async () => {
  const storage = new InMemoryFloorPlanImageStorage();
  const storedAsset = await saveAcceptedFloorPlanImage(
    {
      projectId: "project-alpha",
      floorId: "floor-2",
      file: new File(["second-floor-binary-image"], "second-floor.png", {
        type: "image/png",
      }),
    },
    storage,
  );

  const retrievedAsset = retrieveFloorPlanImageAsset(
    {
      assetRef: storedAsset.assetRef,
    },
    storage,
  );

  assert.deepEqual(retrievedAsset, storedAsset);
  assert.notEqual(retrievedAsset, storedAsset);
});
