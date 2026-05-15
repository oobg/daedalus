import assert from "node:assert/strict";
import test from "node:test";

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
