import test from "node:test";
import assert from "node:assert/strict";

import { createEditorFloor } from "../../domain/editor-state.ts";
import {
  saveAcceptedFloorPlanImage,
  type FloorPlanImageStorage,
} from "./floor-plan-image-storage.ts";
import { resolveFloorReferenceImageSource } from "./resolve-floor-reference-image-source.ts";

class InMemoryFloorPlanImageStorage implements FloorPlanImageStorage {
  private readonly entries = new Map<string, string>();

  getItem(key: string): string | null {
    return this.entries.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.entries.set(key, value);
  }
}

test("resolves an uploaded floor plan asset into a canvas-ready image source", async () => {
  const storage = new InMemoryFloorPlanImageStorage();
  const asset = await saveAcceptedFloorPlanImage(
    {
      projectId: "project-alpha",
      floorId: "floor-1",
      file: new File(["image-bytes"], "ground-floor.png", {
        type: "image/png",
      }),
    },
    storage,
  );
  const floor = createEditorFloor({
    floorId: "floor-1",
    referenceImage: asset.assetRef,
  });

  assert.equal(
    resolveFloorReferenceImageSource({ floor }, storage),
    `data:image/png;base64,${asset.contentBase64}`,
  );
});

test("keeps legacy inline image sources usable", () => {
  const storage = new InMemoryFloorPlanImageStorage();
  const inlineSource = "data:image/png;base64,aW1hZ2UtYnl0ZXM=";
  const floor = createEditorFloor({
    floorId: "floor-1",
    referenceImage: inlineSource,
  });

  assert.equal(resolveFloorReferenceImageSource({ floor }, storage), inlineSource);
});

test("returns null when floor state points to a missing uploaded asset", () => {
  const floor = createEditorFloor({
    floorId: "floor-1",
    referenceImage: "floor-plan://project-alpha/floor-1/missing.png",
  });

  assert.equal(
    resolveFloorReferenceImageSource(
      { floor },
      new InMemoryFloorPlanImageStorage(),
    ),
    null,
  );
});
