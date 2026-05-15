import assert from "node:assert/strict";
import test from "node:test";

import {
  PROJECT_EXPORT_FORMAT_VERSION,
} from "../src/features/project-export/export-schema.ts";
import { DEFAULT_FLOOR_HEIGHT } from "../src/domain/floor.ts";
import {
  getProjectRelationshipGraph,
} from "../src/features/project-export/project-relationship-relinker.ts";
import type {
  SerializedProjectData,
} from "../src/features/project-export/project-serializer.ts";
import {
  saveProjectToLocalStorage,
  type LocalProjectStorage,
} from "../src/features/project-persistence/local-project-storage.ts";
import {
  restoreEditorRuntimeState,
  restoreStoredProjectState,
  restoreUploadedProjectState,
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
    projectId: "project-restore",
    projectName: "Wayfinding Restore",
    objectVersion: 5,
    floors: [
      {
        floorId: "floor-1",
        floorName: "Ground Floor",
        floorHeight: 3.5,
        referenceImage: "floor-plan://project-restore/floor-1/ground.png",
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
            sharedBoundaries: [
              {
                edgeId: "edge-lobby-east",
                adjacentRoomId: "room-gallery",
                adjacentEdgeId: "edge-gallery-west",
              },
            ],
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
          {
            roomId: "room-gallery",
            roomName: "Gallery",
            roomPolygon: [
              { x: 8, y: 0 },
              { x: 14, y: 0 },
              { x: 14, y: 6 },
              { x: 8, y: 6 },
              { x: 8, y: 0 },
            ],
            sharedBoundaries: [
              {
                edgeId: "edge-gallery-west",
                adjacentRoomId: "room-lobby",
                adjacentEdgeId: "edge-lobby-east",
              },
            ],
            area: 36,
            labelPosition: { x: 11, y: 3 },
            walls: [
              {
                edgeId: "edge-gallery-west",
                start: { x: 8, y: 6 },
                end: { x: 8, y: 0 },
              },
            ],
            openings: [
              {
                openingId: "opening-gallery-window",
                openingType: "window",
                attachedEdgeId: "edge-gallery-west",
                edgeRelativePosition: 0.25,
              },
            ],
          },
        ],
        verticalConnectors: [
          {
            connectorId: "connector-stair-1",
            connectorType: "stair",
            roomId: "room-lobby",
            targetFloorId: "floor-2",
            position: { x: 2, y: 1 },
          },
        ],
      },
      {
        floorId: "floor-2",
        floorName: "Second Floor",
        floorHeight: 4,
        referenceImage: null,
        rooms: [
          {
            roomId: "room-mezzanine",
            roomName: "Mezzanine",
            roomPolygon: [
              { x: 1, y: 1 },
              { x: 7, y: 1 },
              { x: 7, y: 5 },
              { x: 1, y: 5 },
              { x: 1, y: 1 },
            ],
            sharedBoundaries: [],
            area: 24,
            labelPosition: { x: 4, y: 3 },
            walls: [],
            openings: [],
          },
        ],
        verticalConnectors: [],
      },
    ],
    viewState: {
      activeFloorId: "floor-2",
      zoom: 1.25,
      pan: { x: 80, y: 64 },
      uploadedProjectName: "wayfinding-restore.json",
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
        assetRef: "floor-plan://project-restore/floor-1/ground.png",
      },
    ],
    annotations: [
      {
        annotationId: "annotation-lobby",
        floorId: "floor-1",
        annotationType: "label",
        text: "Check-in",
        targetRoomId: "room-lobby",
        position: { x: 3, y: 2 },
        color: "#1f3a5f",
        isVisible: true,
      },
    ],
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

test("restoreEditorRuntimeState assembles a runtime state wrapper around hydrated project data", () => {
  const serialized = createSerializedProject();

  const restored = restoreEditorRuntimeState(serialized);

  assert.equal(restored.project.projectId, serialized.projectId);
  assert.equal(restored.project.floors[0].id, "floor-1");
  assert.equal(restored.project.floors[0].rooms[0].roomName, "Lobby");
  assert.equal(restored.project.assets?.[0].assetId, "asset-ground-plan");
  assert.equal(restored.project.annotations?.[0].annotationId, "annotation-lobby");
  assert.deepEqual(restored.project.editorConfig, serialized.editorConfig);

  const graph = getProjectRelationshipGraph(restored.project);
  assert.equal(graph.roomById.get("room-gallery"), restored.project.floors[0].rooms[1]);
  assert.equal(
    graph.boundaryByEdgeId.get("edge-lobby-east")?.adjacentRoom,
    restored.project.floors[0].rooms[1],
  );
  assert.equal(
    graph.openingById.get("opening-lobby-door")?.wall,
    restored.project.floors[0].rooms[0].walls[0],
  );
  assert.equal(
    graph.connectorById.get("connector-stair-1")?.targetFloor,
    restored.project.floors[1],
  );
});

test("restoreUploadedProjectState imports JSON and returns the runtime editor state shape", () => {
  const serialized = createSerializedProject();

  const restored = restoreUploadedProjectState(
    JSON.stringify({
      exportFormatVersion: PROJECT_EXPORT_FORMAT_VERSION,
      exportedAt: "2026-05-13T12:00:00.000Z",
      projectMetadata: {
        projectId: serialized.projectId,
        projectName: serialized.projectName,
        objectVersion: serialized.objectVersion,
      },
      project: serialized,
    }),
  );

  assert.equal(restored.ok, true);

  if (!restored.ok) {
    return;
  }

  assert.equal(restored.state.project.projectName, "Wayfinding Restore");
  assert.equal(restored.state.project.viewState.activeFloorId, "floor-2");
  assert.equal(
    getProjectRelationshipGraph(restored.state.project).assetById.get(
      "asset-ground-plan",
    )?.floor,
    restored.state.project.floors[0],
  );
});

test("restoreStoredProjectState rebuilds runtime relationships from a saved localStorage project record", () => {
  const storage = new InMemoryLocalProjectStorage();
  const serialized = createSerializedProject();
  const stored = saveProjectToLocalStorage(
    serialized,
    storage,
    new Date("2026-05-13T14:00:00.000Z"),
  );

  const restored = restoreStoredProjectState(serialized.projectId, storage);

  assert.deepEqual(restored?.savedAt, stored.savedAt);
  assert.deepEqual(restored?.storageKey, stored.storageKey);
  assert.equal(restored?.state.project.projectId, serialized.projectId);
  assert.equal(
    getProjectRelationshipGraph(restored!.state.project).annotationById.get(
      "annotation-lobby",
    )?.room,
    restored!.state.project.floors[0].rooms[0],
  );
});

test("restoreStoredProjectState defaults missing floor heights from older localStorage records", () => {
  const storage = new InMemoryLocalProjectStorage();
  const serialized = createSerializedProject() as unknown as Record<string, unknown>;
  const floors = serialized.floors as Array<Record<string, unknown>>;
  delete floors[0].floorHeight;

  saveProjectToLocalStorage(
    serialized as SerializedProjectData,
    storage,
    new Date("2026-05-13T14:00:00.000Z"),
  );

  const restored = restoreStoredProjectState(
    serialized.projectId as string,
    storage,
  );

  assert.equal(restored?.state.project.floors[0].height, DEFAULT_FLOOR_HEIGHT);
  assert.equal(restored?.state.project.floors[1].height, 4);
});
