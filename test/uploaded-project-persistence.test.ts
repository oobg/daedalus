import assert from "node:assert/strict";
import test from "node:test";

import type { SerializedProjectData } from "../src/features/project-export/project-serializer.ts";
import {
  loadProjectFromLocalStorage,
  type LocalProjectStorage,
} from "../src/features/project-persistence/local-project-storage.ts";
import {
  persistUploadedProject,
} from "../src/features/project-persistence/uploaded-project-persistence.ts";

class InMemoryLocalProjectStorage implements LocalProjectStorage {
  private readonly entries = new Map<string, string>();

  getItem(key: string): string | null {
    return this.entries.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.entries.set(key, value);
  }
}

function createValidatedUploadedProject(): SerializedProjectData {
  return {
    projectId: "uploaded-project-alpha",
    projectName: "Uploaded Museum Guide",
    objectVersion: 3,
    floors: [
      {
        floorId: "floor-1",
        floorName: "Ground Floor",
        floorHeight: 3.5,
        referenceImage: "floor-plan://uploaded-project-alpha/floor-1/ground.png",
        rooms: [
          {
            roomId: "room-lobby",
            roomName: "Lobby",
            roomPolygon: [
              { x: 0, y: 0 },
              { x: 8, y: 0 },
              { x: 8, y: 6 },
              { x: 0, y: 6 },
              { x: 0, y: 0 },
            ],
            sharedBoundaries: [],
            area: 48,
            labelPosition: { x: 4, y: 3 },
            walls: [
              {
                edgeId: "edge-lobby-east",
                start: { x: 8, y: 0 },
                end: { x: 8, y: 6 },
              },
            ],
            openings: [
              {
                openingId: "opening-lobby-door",
                openingType: "door",
                attachedEdgeId: "edge-lobby-east",
                edgeRelativePosition: 0.5,
              },
            ],
          },
        ],
        verticalConnectors: [],
      },
    ],
    viewState: {
      activeFloorId: "floor-1",
      zoom: 1.25,
      pan: { x: 96, y: 64 },
      uploadedProjectName: "uploaded-museum-guide.json",
    },
    assets: [
      {
        assetId: "asset-ground-plan",
        assetType: "reference-image",
        floorId: "floor-1",
        fileName: "ground.png",
        mimeType: "image/png",
        size: 4096,
        storageKey: "daedalus.floorPlanAsset:asset-ground-plan",
        assetRef: "floor-plan://uploaded-project-alpha/floor-1/ground.png",
      },
    ],
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

test("persistUploadedProject stores a validated uploaded project and returns persisted record metadata", () => {
  const storage = new InMemoryLocalProjectStorage();
  const project = createValidatedUploadedProject();

  const persisted = persistUploadedProject(
    project,
    storage,
    new Date("2026-05-15T10:15:00.000Z"),
  );

  assert.deepEqual(persisted, {
    projectId: "uploaded-project-alpha",
    projectName: "Uploaded Museum Guide",
    objectVersion: 3,
    storageKey: "daedalus.project:uploaded-project-alpha",
    savedAt: "2026-05-15T10:15:00.000Z",
  });

  const stored = loadProjectFromLocalStorage<SerializedProjectData>(
    project.projectId,
    storage,
  );

  assert.deepEqual(stored, {
    storageKey: persisted.storageKey,
    savedAt: persisted.savedAt,
    project,
  });
});
