import test from "node:test";
import assert from "node:assert/strict";

import {
  loadStoredFloorPlanImage,
  loadStoredFloorPlanImageMetadata,
  saveAcceptedFloorPlanImage,
  type FloorPlanImageStorage,
} from "../src/features/floor-plan-upload/floor-plan-image-storage.ts";
import {
  createCorruptPngTestFile,
  createPngTestFile,
} from "../src/features/floor-plan-upload/test-floor-plan-image-fixtures.ts";

class InMemoryFloorPlanImageStorage implements FloorPlanImageStorage {
  private readonly entries = new Map<string, string>();

  getItem(key: string): string | null {
    return this.entries.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.entries.set(key, value);
  }
}

class RecordingFloorPlanImageStorage implements FloorPlanImageStorage {
  public lastWrite: { key: string; value: string } | null = null;

  private readonly entries = new Map<string, string>();

  getItem(key: string): string | null {
    return this.entries.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.lastWrite = { key, value };
    this.entries.set(key, value);
  }
}

test("persists an accepted floor plan image and returns a stable asset reference", async () => {
  const storage = new InMemoryFloorPlanImageStorage();
  const file = createPngTestFile("ground-floor.png");

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

test("writes the serialized floor plan reference asset to the configured storage backend", async () => {
  const storage = new RecordingFloorPlanImageStorage();
  const file = createPngTestFile("lobby.png");

  const asset = await saveAcceptedFloorPlanImage(
    {
      projectId: "project-alpha",
      floorId: "floor-lobby",
      file,
    },
    storage,
  );

  assert.deepEqual(storage.lastWrite, {
    key: asset.storageKey,
    value: JSON.stringify(asset),
  });
  assert.equal(storage.getItem(asset.storageKey), JSON.stringify(asset));
});

test("returns stored floor plan asset metadata that can identify a previously saved asset", async () => {
  const storage = new InMemoryFloorPlanImageStorage();
  const file = createPngTestFile("wayfinding-level-1.png");

  const savedAsset = await saveAcceptedFloorPlanImage(
    {
      projectId: "project-alpha",
      floorId: "level-1",
      file,
    },
    storage,
  );

  const metadata = loadStoredFloorPlanImageMetadata(savedAsset.assetRef, storage);

  assert.deepEqual(metadata, {
    assetRef: savedAsset.assetRef,
    storageKey: savedAsset.storageKey,
    projectId: "project-alpha",
    floorId: "level-1",
    fileName: "wayfinding-level-1.png",
    mimeType: "image/png",
    size: savedAsset.size,
  });
  assert.equal(
    storage.getItem(metadata?.storageKey ?? ""),
    JSON.stringify(savedAsset),
    "the returned storage location should resolve the saved asset record",
  );
  assert.deepEqual(
    loadStoredFloorPlanImage(metadata?.assetRef ?? "", storage),
    savedAsset,
    "the returned metadata should identify the exact saved asset",
  );
});

test("persists the same accepted image separately for different floors", async () => {
  const storage = new InMemoryFloorPlanImageStorage();
  const file = createPngTestFile("floor-plan.png");

  const firstFloorSave = await saveAcceptedFloorPlanImage(
    {
      projectId: "project-alpha",
      floorId: "floor-1",
      file,
    },
    storage,
  );
  const secondFloorSave = await saveAcceptedFloorPlanImage(
    {
      projectId: "project-alpha",
      floorId: "floor-2",
      file,
    },
    storage,
  );

  assert.notEqual(firstFloorSave.assetRef, secondFloorSave.assetRef);
  assert.match(firstFloorSave.assetRef, /^floor-plan:\/\/project-alpha\/floor-1\//);
  assert.match(secondFloorSave.assetRef, /^floor-plan:\/\/project-alpha\/floor-2\//);
  assert.deepEqual(loadStoredFloorPlanImage(firstFloorSave.assetRef, storage), firstFloorSave);
  assert.deepEqual(loadStoredFloorPlanImage(secondFloorSave.assetRef, storage), secondFloorSave);
});

test("rejects persistence for files that did not pass image validation", async () => {
  const storage = new InMemoryFloorPlanImageStorage();
  const file = createCorruptPngTestFile("plan.png");

  await assert.rejects(
    saveAcceptedFloorPlanImage(
      {
        projectId: "project-alpha",
        floorId: "floor-1",
        file,
      },
      storage,
    ),
    /invalid_image_content/,
  );
});

test("throws when the configured storage backend does not retain the written asset", async () => {
  const file = createPngTestFile("plan.png");

  await assert.rejects(
    saveAcceptedFloorPlanImage(
      {
        projectId: "project-alpha",
        floorId: "floor-1",
        file,
      },
      {
        getItem: () => null,
        setItem: () => {},
      },
    ),
    /Failed to persist floor plan image asset/,
  );
});
