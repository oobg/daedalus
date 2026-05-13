import test from "node:test";
import assert from "node:assert/strict";

import {
  loadStoredFloorPlanImage,
  saveAcceptedFloorPlanImage,
  type FloorPlanImageStorage,
} from "../src/features/floor-plan-upload/floor-plan-image-storage.ts";

class InMemoryFloorPlanImageStorage implements FloorPlanImageStorage {
  private readonly entries = new Map<string, string>();

  getItem(key: string): string | null {
    return this.entries.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.entries.set(key, value);
  }
}

test("persists an accepted floor plan image and returns a stable asset reference", async () => {
  const storage = new InMemoryFloorPlanImageStorage();
  const file = new File(["binary-image-data"], "ground-floor.png", {
    type: "image/png",
  });

  const firstSave = await saveAcceptedFloorPlanImage(
    {
      projectId: "project-alpha",
      floorId: "floor-1",
      file,
    },
    storage,
  );
  const secondSave = await saveAcceptedFloorPlanImage(
    {
      projectId: "project-alpha",
      floorId: "floor-1",
      file,
    },
    storage,
  );

  assert.equal(
    firstSave.assetRef,
    secondSave.assetRef,
    "re-saving the same accepted file for the same floor should reuse the same reference",
  );
  assert.match(
    firstSave.assetRef,
    /^floor-plan:\/\/project-alpha\/floor-1\/[a-f0-9]{16}-ground-floor\.png$/,
  );

  const loaded = loadStoredFloorPlanImage(firstSave.assetRef, storage);

  assert.deepEqual(loaded, firstSave);
});

test("rejects persistence for files that did not pass image validation", async () => {
  const storage = new InMemoryFloorPlanImageStorage();
  const file = new File(["<svg></svg>"], "plan.svg", { type: "image/svg+xml" });

  await assert.rejects(
    saveAcceptedFloorPlanImage(
      {
        projectId: "project-alpha",
        floorId: "floor-1",
        file,
      },
      storage,
    ),
    /unsupported_type/,
  );
});
