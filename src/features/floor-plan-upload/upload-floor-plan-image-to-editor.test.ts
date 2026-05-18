import assert from "node:assert/strict";
import test from "node:test";

import {
  createEditorProject,
  type EditorProject,
} from "../../domain/editor-state.ts";
import {
  loadStoredFloorPlanImage,
  type FloorPlanImageStorage,
} from "./floor-plan-image-storage.ts";
import { createPngTestFile } from "./test-floor-plan-image-fixtures.ts";
import { uploadFloorPlanImageToEditor } from "./upload-floor-plan-image-to-editor.ts";

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

function createProject(): EditorProject {
  return createEditorProject({
    projectId: "project-upload-flow",
    projectName: "Upload Flow",
    floors: [
      {
        floorId: "floor-1",
        floorName: "Ground Floor",
        floorHeight: 3,
        referenceImage: "floor-plan://project-upload-flow/floor-1/existing.png",
      },
      {
        floorId: "floor-2",
        floorName: "Second Floor",
        floorHeight: 4,
        referenceImage: null,
      },
    ],
    viewState: {
      activeFloorId: "floor-2",
    },
  });
}

test("uploadFloorPlanImageToEditor validates, persists, and associates the upload with the selected floor", async () => {
  const project = createProject();
  const storage = new InMemoryFloorPlanImageStorage();
  const upload = createPngTestFile("level-2.png");

  const result = await uploadFloorPlanImageToEditor(
    {
      project,
      selectedFloorId: project.viewState.activeFloorId,
      upload,
    },
    storage,
  );

  assert.equal(project.floors[1].referenceImage, null);
  assert.equal(result.floor.floorId, "floor-2");
  assert.equal(result.floor.referenceImage, result.persistedUpload.assetRef);
  assert.equal(
    result.project.floors[0].referenceImage,
    "floor-plan://project-upload-flow/floor-1/existing.png",
  );
  assert.equal(
    result.project.floors[1].referenceImage,
    result.persistedUpload.assetRef,
  );
  assert.match(
    result.persistedUpload.assetRef,
    /^floor-plan:\/\/project-upload-flow\/floor-2\/[a-f0-9]{16}-level-2\.png$/,
  );
  assert.deepEqual(
    loadStoredFloorPlanImage(result.persistedUpload.assetRef, storage),
    result.persistedUpload,
  );
});

test("uploadFloorPlanImageToEditor rejects invalid uploads without persisting or changing floor reference metadata", async () => {
  const project = createProject();
  const storage = new InMemoryFloorPlanImageStorage();
  const upload = new File(["not-a-real-image"], "level-2.png", {
    type: "image/png",
  });

  await assert.rejects(
    uploadFloorPlanImageToEditor(
      {
        project,
        selectedFloorId: project.viewState.activeFloorId,
        upload,
      },
      storage,
    ),
    /invalid_image_content/,
  );

  assert.equal(storage.writeCount, 0);
  assert.equal(
    project.floors[0].referenceImage,
    "floor-plan://project-upload-flow/floor-1/existing.png",
  );
  assert.equal(project.floors[1].referenceImage, null);
});

test("uploadFloorPlanImageToEditor rejects non-accepted file types without persisting or changing floor reference metadata", async () => {
  const project = createProject();
  const storage = new InMemoryFloorPlanImageStorage();
  const upload = new File(["<svg></svg>"], "level-2.svg", {
    type: "image/svg+xml",
  });

  await assert.rejects(
    uploadFloorPlanImageToEditor(
      {
        project,
        selectedFloorId: project.viewState.activeFloorId,
        upload,
      },
      storage,
    ),
    /unsupported_type/,
  );

  assert.equal(storage.writeCount, 0);
  assert.equal(
    project.floors[0].referenceImage,
    "floor-plan://project-upload-flow/floor-1/existing.png",
  );
  assert.equal(project.floors[1].referenceImage, null);
});
