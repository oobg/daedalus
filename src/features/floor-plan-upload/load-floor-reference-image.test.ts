import test from "node:test";
import assert from "node:assert/strict";

import { normalizeFloor } from "../../domain/floor.ts";
import {
  saveAcceptedFloorPlanImage,
  type FloorPlanImageStorage,
} from "./floor-plan-image-storage.ts";
import { loadFloorReferenceImage } from "./load-floor-reference-image.ts";
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

test("loads the assigned floor plan image for the requested floor only", async () => {
  const storage = new InMemoryFloorPlanImageStorage();
  const groundFloorImage = await saveAcceptedFloorPlanImage(
    {
      projectId: "project-alpha",
      floorId: "floor-1",
      file: createPngTestFile("ground-floor.png"),
    },
    storage,
  );
  const secondFloorImage = await saveAcceptedFloorPlanImage(
    {
      projectId: "project-alpha",
      floorId: "floor-2",
      file: createPngTestFile("second-floor.png"),
    },
    storage,
  );
  const floors = [
    normalizeFloor({
      id: "floor-1",
      name: "Ground Floor",
      referenceImage: groundFloorImage.assetRef,
    }),
    normalizeFloor({
      id: "floor-2",
      name: "Second Floor",
      referenceImage: secondFloorImage.assetRef,
    }),
    normalizeFloor({
      id: "floor-3",
      name: "Third Floor",
      referenceImage: null,
    }),
  ];

  const resolved = loadFloorReferenceImage(
    {
      floors,
      floorId: "floor-2",
    },
    storage,
  );

  assert.deepEqual(resolved, {
    ok: true,
    code: "loaded",
    image: {
      usage: "editing-reference",
      editable: false,
      sourceAsset: secondFloorImage,
    },
  });
  assert.notDeepEqual(resolved.ok ? resolved.image.sourceAsset : null, groundFloorImage);
  assert.equal(Object.isFrozen(resolved), true);
  assert.equal(Object.isFrozen(resolved.ok ? resolved.image : null), true);
  assert.equal(Object.isFrozen(resolved.ok ? resolved.image.sourceAsset : null), true);
});

test("returns a read-only editing reference descriptor without exposing a mutable source asset", async () => {
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
  ];
  const resolved = loadFloorReferenceImage(
    {
      floors,
      floorId: "floor-1",
    },
    storage,
  );

  assert.equal(resolved.ok, true);
  assert.equal(resolved.code, "loaded");

  if (!resolved.ok) {
    assert.fail("Expected a loaded floor reference image.");
  }

  assert.notEqual(resolved.image.sourceAsset, storedAsset);
  assert.throws(
    () => {
      (resolved.image as { editable: boolean }).editable = true;
    },
    /Cannot assign to read only property/,
  );
  assert.throws(
    () => {
      (resolved.image.sourceAsset as { fileName: string }).fileName = "mutated.png";
    },
    /Cannot assign to read only property/,
  );
  assert.equal(storedAsset.fileName, "ground-floor.png");
});

test("returns a defined empty result when the requested floor has no assigned reference image", () => {
  const floors = [
    normalizeFloor({
      id: "floor-1",
      name: "Ground Floor",
      referenceImage: null,
    }),
  ];

  const resolved = loadFloorReferenceImage(
    {
      floors,
      floorId: "floor-1",
    },
    new InMemoryFloorPlanImageStorage(),
  );

  assert.deepEqual(resolved, {
    ok: false,
    code: "missing_reference_image",
    message: 'Floor "floor-1" has no associated reference image.',
  });
});

test("returns a defined error result when the floor references an image asset that is missing from storage", () => {
  const floors = [
    normalizeFloor({
      id: "floor-1",
      name: "Ground Floor",
      referenceImage: "floor-plan://project-alpha/floor-1/missing.png",
    }),
  ];

  const resolved = loadFloorReferenceImage(
    {
      floors,
      floorId: "floor-1",
    },
    new InMemoryFloorPlanImageStorage(),
  );

  assert.deepEqual(resolved, {
    ok: false,
    code: "missing_reference_image_asset",
    message:
      'Floor "floor-1" references a floor plan image asset that is unavailable in storage.',
  });
});

test("throws when loading a reference image for a missing floor", () => {
  assert.throws(
    () =>
      loadFloorReferenceImage(
        {
          floors: [
            normalizeFloor({
              id: "floor-1",
              name: "Ground Floor",
              referenceImage: null,
            }),
          ],
          floorId: "missing-floor",
        },
        new InMemoryFloorPlanImageStorage(),
      ),
    /Floor "missing-floor" was not found\./,
  );
});
