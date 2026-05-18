import assert from "node:assert/strict";
import test from "node:test";

import {
  saveAcceptedFloorPlanImage,
  type FloorPlanImageStorage,
} from "../src/features/floor-plan-upload/floor-plan-image-storage.ts";
import {
  deriveStoredFloorPlanReferenceMetadata,
} from "../src/features/floor-plan-upload/derive-stored-floor-plan-reference-metadata.ts";
import {
  createPngTestFile,
} from "../src/features/floor-plan-upload/test-floor-plan-image-fixtures.ts";
import type {
  SerializedProjectData,
} from "../src/features/project-export/project-serializer.ts";
import {
  saveProjectToLocalStorage,
  type LocalProjectStorage,
} from "../src/features/project-persistence/local-project-storage.ts";
import {
  restoreStoredProjectState,
} from "../src/features/project-persistence/project-restore-orchestrator.ts";

class InMemoryLocalProjectStorage implements LocalProjectStorage {
  private readonly entries = new Map<string, string>();

  getItem(key: string): string | null {
    return this.entries.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.entries.set(key, value);
  }
}

class InMemoryCombinedStorage
  implements LocalProjectStorage, FloorPlanImageStorage
{
  private readonly entries = new Map<string, string>();

  getItem(key: string): string | null {
    return this.entries.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.entries.set(key, value);
  }
}

function createSerializedProject(): SerializedProjectData {
  return {
    projectId: "project-persistence-round-trip",
    projectName: "Persistence Round Trip",
    objectVersion: 5,
    floors: [
      {
        floorId: "floor-1",
        floorName: "Ground Floor",
        floorHeight: 3.25,
        referenceImage: null,
        rooms: [],
        verticalConnectors: [],
      },
      {
        floorId: "floor-2",
        floorName: "Second Floor",
        floorHeight: 4.5,
        referenceImage: null,
        rooms: [],
        verticalConnectors: [],
      },
      {
        floorId: "floor-3",
        floorName: "Mechanical",
        floorHeight: 2.75,
        referenceImage: null,
        rooms: [],
        verticalConnectors: [],
      },
    ],
    viewState: {
      activeFloorId: "floor-2",
      zoom: 1,
      pan: { x: 0, y: 0 },
    },
    assets: [],
    annotations: [],
    editorConfig: {
      selectedTool: "select",
      snapToGrid: true,
      gridSize: 32,
      showGrid: true,
      showReferenceImages: true,
      showRoomLabels: true,
    },
  };
}

test("persistence round-trip preserves each floor height across save and restore cycles", () => {
  const storage = new InMemoryLocalProjectStorage();
  const serialized = createSerializedProject();

  saveProjectToLocalStorage(
    serialized,
    storage,
    new Date("2026-05-15T09:00:00.000Z"),
  );

  const restored = restoreStoredProjectState(serialized.projectId, storage);

  assert.ok(restored);
  assert.deepEqual(
    restored.state.project.floors.map(({ id, height }) => ({
      id,
      height,
    })),
    serialized.floors.map(({ floorId, floorHeight }) => ({
      id: floorId,
      height: floorHeight,
    })),
  );
});

test("persistence round-trip preserves enough floor plan metadata to reattach the stored reference image", async () => {
  const storage = new InMemoryCombinedStorage();
  const storedAsset = await saveAcceptedFloorPlanImage(
    {
      projectId: "project-persistence-round-trip",
      floorId: "floor-2",
      file: createPngTestFile("second-floor.png"),
    },
    storage,
  );
  const serialized = createSerializedProject();

  serialized.floors[1] = {
    ...serialized.floors[1],
    referenceImage: storedAsset.assetRef,
  };

  saveProjectToLocalStorage(
    serialized,
    storage,
    new Date("2026-05-15T09:15:00.000Z"),
  );

  const restored = restoreStoredProjectState(serialized.projectId, storage);

  assert.ok(restored);

  const derivedReferenceMetadata = deriveStoredFloorPlanReferenceMetadata(
    {
      floors: restored.state.project.floors,
      floorId: "floor-2",
    },
    storage,
  );

  assert.deepEqual(derivedReferenceMetadata, {
    ok: true,
    code: "derived",
    metadata: {
      assetRef: storedAsset.assetRef,
      storageKey: storedAsset.storageKey,
      projectId: "project-persistence-round-trip",
      floorId: "floor-2",
      fileName: "second-floor.png",
      mimeType: "image/png",
      size: storedAsset.size,
    },
  });
});
