import test from "node:test";
import assert from "node:assert/strict";

import { createEditorFloor } from "../../domain/editor-state.ts";
import {
  saveAcceptedFloorPlanImage,
  type FloorPlanImageStorage,
} from "./floor-plan-image-storage.ts";
import {
  loadFloorReferenceImageSource,
  resolveFloorReferenceImage,
  resolveFloorReferenceImageSource,
} from "./resolve-floor-reference-image-source.ts";
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

test("resolves an uploaded floor plan asset into a canvas-ready image source", async () => {
  const storage = new InMemoryFloorPlanImageStorage();
  const asset = await saveAcceptedFloorPlanImage(
    {
      projectId: "project-alpha",
      floorId: "floor-1",
      file: createPngTestFile("ground-floor.png"),
    },
    storage,
  );
  const floors = [
    createEditorFloor({
      floorId: "floor-1",
      referenceImage: asset.assetRef,
    }),
    createEditorFloor({
      floorId: "floor-2",
      referenceImage: null,
    }),
  ];

  assert.equal(
    resolveFloorReferenceImageSource(
      {
        floors,
        selectedFloorId: "floor-1",
      },
      storage,
    ),
    `data:image/png;base64,${asset.contentBase64}`,
  );

  assert.deepEqual(
    loadFloorReferenceImageSource(
      {
        floors,
        selectedFloorId: "floor-1",
      },
      storage,
    ),
    {
      ok: true,
      floorId: "floor-1",
      image: {
        usage: "editing-reference",
        editable: false,
        source: `data:image/png;base64,${asset.contentBase64}`,
      },
    },
  );
});

test("keeps legacy inline image sources usable", () => {
  const storage = new InMemoryFloorPlanImageStorage();
  const inlineSource = "data:image/png;base64,aW1hZ2UtYnl0ZXM=";
  const floors = [
    createEditorFloor({
      floorId: "floor-1",
      referenceImage: inlineSource,
    }),
  ];

  assert.equal(
    resolveFloorReferenceImageSource(
      {
        floors,
        selectedFloorId: "floor-1",
      },
      storage,
    ),
    inlineSource,
  );

  assert.deepEqual(
    resolveFloorReferenceImage(
      {
        floors,
        selectedFloorId: "floor-1",
      },
      storage,
    ),
    {
      usage: "editing-reference",
      editable: false,
      source: inlineSource,
    },
  );
});

test("returns null when floor state points to a missing uploaded asset", () => {
  const floors = [
    createEditorFloor({
      floorId: "floor-1",
      referenceImage: "floor-plan://project-alpha/floor-1/missing.png",
    }),
  ];

  assert.equal(
    resolveFloorReferenceImageSource(
      {
        floors,
        selectedFloorId: "floor-1",
      },
      new InMemoryFloorPlanImageStorage(),
    ),
    null,
  );

  assert.deepEqual(
    loadFloorReferenceImageSource(
      {
        floors,
        selectedFloorId: "floor-1",
      },
      new InMemoryFloorPlanImageStorage(),
    ),
    {
      ok: false,
      floorId: "floor-1",
      code: "reference_image_not_found",
    },
  );
});

test("returns the selected floor image source when other floors have different assets", async () => {
  const storage = new InMemoryFloorPlanImageStorage();
  const floorOneAsset = await saveAcceptedFloorPlanImage(
    {
      projectId: "project-alpha",
      floorId: "floor-1",
      file: createPngTestFile("ground-floor.png"),
    },
    storage,
  );
  const floorTwoAsset = await saveAcceptedFloorPlanImage(
    {
      projectId: "project-alpha",
      floorId: "floor-2",
      file: createPngTestFile("second-floor.png"),
    },
    storage,
  );
  const floors = [
    createEditorFloor({
      floorId: "floor-1",
      referenceImage: floorOneAsset.assetRef,
    }),
    createEditorFloor({
      floorId: "floor-2",
      referenceImage: floorTwoAsset.assetRef,
    }),
  ];

  assert.equal(
    resolveFloorReferenceImageSource(
      {
        floors,
        selectedFloorId: "floor-2",
      },
      storage,
    ),
    `data:image/png;base64,${floorTwoAsset.contentBase64}`,
  );
});

test("returns a frozen read-only resolved reference image for editor consumers", async () => {
  const storage = new InMemoryFloorPlanImageStorage();
  const asset = await saveAcceptedFloorPlanImage(
    {
      projectId: "project-alpha",
      floorId: "floor-1",
      file: createPngTestFile("ground-floor.png"),
    },
    storage,
  );
  const floors = [
    createEditorFloor({
      floorId: "floor-1",
      referenceImage: asset.assetRef,
    }),
  ];

  const resolved = resolveFloorReferenceImage(
    {
      floors,
      selectedFloorId: "floor-1",
    },
    storage,
  );

  assert.deepEqual(resolved, {
    usage: "editing-reference",
    editable: false,
    source: `data:image/png;base64,${asset.contentBase64}`,
  });
  assert.equal(Object.isFrozen(resolved), true);
  assert.throws(
    () => {
      (resolved as { source: string }).source = "data:image/png;base64,bXV0YXRlZA==";
    },
    /Cannot assign to read only property/,
  );
});

test("returns null when the selected floor id is missing from editor floor metadata", () => {
  const floors = [
    createEditorFloor({
      floorId: "floor-1",
      referenceImage: "floor-plan://project-alpha/floor-1/existing.png",
    }),
  ];

  assert.equal(
    resolveFloorReferenceImageSource(
      {
        floors,
        selectedFloorId: "missing-floor",
      },
      new InMemoryFloorPlanImageStorage(),
    ),
    null,
  );

  assert.deepEqual(
    loadFloorReferenceImageSource(
      {
        floors,
        selectedFloorId: "missing-floor",
      },
      new InMemoryFloorPlanImageStorage(),
    ),
    {
      ok: false,
      floorId: "missing-floor",
      code: "floor_not_found",
    },
  );
});
