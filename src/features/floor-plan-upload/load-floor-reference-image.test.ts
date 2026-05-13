import test from "node:test";
import assert from "node:assert/strict";

import { normalizeFloor } from "../../domain/floor.ts";
import {
  saveAcceptedFloorPlanImage,
  type FloorPlanImageStorage,
} from "./floor-plan-image-storage.ts";
import { loadFloorReferenceImage } from "./load-floor-reference-image.ts";

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
      file: new File(["ground-image"], "ground-floor.png", {
        type: "image/png",
      }),
    },
    storage,
  );
  const secondFloorImage = await saveAcceptedFloorPlanImage(
    {
      projectId: "project-alpha",
      floorId: "floor-2",
      file: new File(["second-image"], "second-floor.png", {
        type: "image/png",
      }),
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

  assert.deepEqual(resolved, secondFloorImage);
  assert.notDeepEqual(resolved, groundFloorImage);
});

test("returns null when the requested floor has no assigned reference image", () => {
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

  assert.equal(resolved, null);
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
