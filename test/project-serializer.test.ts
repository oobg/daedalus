import assert from "node:assert/strict";
import test from "node:test";

import {
  restoreProjectFromImport,
  serializeProjectForExport,
  type EditorProjectState,
  type SerializedProjectData,
} from "../src/features/project-export/project-serializer.ts";
import { DEFAULT_FLOOR_HEIGHT } from "../src/domain/floor.ts";

test("serializeProjectForExport emits JSON-safe floor-by-floor building guide data", () => {
  const project: EditorProjectState = {
    projectId: "project-alpha",
    projectName: "Museum Wayfinding",
    objectVersion: 4,
    floors: [
      {
        id: "floor-1",
        name: "Ground Floor",
        height: 3.5,
        referenceImage: "floor-plan://project-alpha/floor-1/ground.png",
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
        id: "floor-2",
        name: "Second Floor",
        height: 4,
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
        verticalConnectors: [
          {
            connectorId: "connector-elevator-1",
            connectorType: "elevator",
            roomId: "room-mezzanine",
            targetFloorId: "floor-1",
            position: { x: 3, y: 2 },
          },
        ],
      },
    ],
    viewState: {
      activeFloorId: "floor-2",
      zoom: 1.25,
      pan: { x: 140, y: 96 },
      uploadedProjectName: "museum-wayfinding-v4.json",
    },
    assets: [
      {
        assetId: "asset-ground-plan",
        assetType: "reference-image",
        floorId: "floor-1",
        fileName: "ground.png",
        mimeType: "image/png",
        size: 8192,
        storageKey: "daedalus.floorPlanAsset:asset-ground-plan",
        assetRef: "floor-plan://project-alpha/floor-1/ground.png",
      },
    ],
    annotations: [
      {
        annotationId: "annotation-lobby",
        floorId: "floor-1",
        annotationType: "label",
        text: "Visitor check-in",
        targetRoomId: "room-lobby",
        position: { x: 3, y: 2 },
        color: "#2f4858",
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

  const serialized = serializeProjectForExport(project);

  assert.deepEqual(serialized, {
    projectId: "project-alpha",
    projectName: "Museum Wayfinding",
    objectVersion: 4,
    floors: [
      {
        floorId: "floor-1",
        floorName: "Ground Floor",
        floorHeight: 3.5,
        referenceImage: "floor-plan://project-alpha/floor-1/ground.png",
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
        verticalConnectors: [
          {
            connectorId: "connector-elevator-1",
            connectorType: "elevator",
            roomId: "room-mezzanine",
            targetFloorId: "floor-1",
            position: { x: 3, y: 2 },
          },
        ],
      },
    ],
    viewState: {
      activeFloorId: "floor-2",
      zoom: 1.25,
      pan: { x: 140, y: 96 },
      uploadedProjectName: "museum-wayfinding-v4.json",
    },
    assets: [
      {
        assetId: "asset-ground-plan",
        assetType: "reference-image",
        floorId: "floor-1",
        fileName: "ground.png",
        mimeType: "image/png",
        size: 8192,
        storageKey: "daedalus.floorPlanAsset:asset-ground-plan",
        assetRef: "floor-plan://project-alpha/floor-1/ground.png",
      },
    ],
    annotations: [
      {
        annotationId: "annotation-lobby",
        floorId: "floor-1",
        annotationType: "label",
        text: "Visitor check-in",
        targetRoomId: "room-lobby",
        position: { x: 3, y: 2 },
        color: "#2f4858",
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
  });
});

test("restoreProjectFromImport hydrates imported floors in source order with intact room polygons", () => {
  const importedProject: SerializedProjectData = {
    projectId: "project-imported",
    projectName: "Imported Guide",
    objectVersion: 2,
    floors: [
      {
        floorId: "floor-2",
        floorName: "Second Floor",
        floorHeight: 4.2,
        referenceImage: null,
        rooms: [
          {
            roomId: "room-archive",
            roomName: "Archive",
            roomPolygon: [
              { x: 2, y: 1 },
              { x: 9, y: 1 },
              { x: 9, y: 7 },
              { x: 2, y: 7 },
              { x: 2, y: 1 },
            ],
            sharedBoundaries: [],
            area: 42,
            labelPosition: { x: 5.5, y: 4 },
            walls: [],
            openings: [],
          },
        ],
        verticalConnectors: [],
      },
      {
        floorId: "floor-1",
        floorName: "Ground Floor",
        floorHeight: 3.8,
        referenceImage: "floor-plan://project-imported/floor-1/ground.png",
        rooms: [
          {
            roomId: "room-lobby",
            roomName: "Lobby",
            roomPolygon: [
              { x: 0, y: 0 },
              { x: 7, y: 0 },
              { x: 8, y: 5 },
              { x: 1, y: 5 },
              { x: 0, y: 0 },
            ],
            sharedBoundaries: [
              {
                edgeId: "edge-lobby-east",
                adjacentRoomId: "room-office",
                adjacentEdgeId: "edge-office-west",
              },
            ],
            area: 37.5,
            labelPosition: { x: 4, y: 2.5 },
            walls: [
              {
                edgeId: "edge-lobby-east",
                start: { x: 7, y: 0 },
                end: { x: 8, y: 5 },
              },
            ],
            openings: [
              {
                openingId: "opening-lobby-door",
                openingType: "door",
                attachedEdgeId: "edge-lobby-east",
                edgeRelativePosition: 0.4,
              },
            ],
          },
        ],
        verticalConnectors: [],
      },
    ],
    viewState: {
      activeFloorId: "floor-1",
      zoom: 1.5,
      pan: { x: 64, y: 48 },
      uploadedProjectName: "imported-guide.json",
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

  const restored = restoreProjectFromImport(importedProject);

  assert.deepEqual(
    restored.floors.map((floor) => floor.id),
    ["floor-2", "floor-1"],
  );
  assert.deepEqual(
    restored.floors.map((floor) => ({
      id: floor.id,
      height: floor.height,
    })),
    [
      {
        id: "floor-2",
        height: 4.2,
      },
      {
        id: "floor-1",
        height: 3.8,
      },
    ],
  );
  assert.deepEqual(restored.floors[1].rooms[0].roomPolygon, [
    { x: 0, y: 0 },
    { x: 7, y: 0 },
    { x: 8, y: 5 },
    { x: 1, y: 5 },
    { x: 0, y: 0 },
  ]);
  assert.equal(restored.floors[1].rooms[0].roomName, "Lobby");
  assert.equal(restored.floors[1].rooms[0].openings[0]?.attachedEdgeId, "edge-lobby-east");
});

test("restoreProjectFromImport applies the default height when loaded floor data omits it", () => {
  const importedProject = {
    projectId: "project-imported",
    projectName: "Imported Guide",
    objectVersion: 2,
    floors: [
      {
        floorId: "floor-1",
        floorName: "Ground Floor",
        referenceImage: null,
        rooms: [],
        verticalConnectors: [],
      },
    ],
    viewState: {
      activeFloorId: "floor-1",
      zoom: 1,
      pan: { x: 0, y: 0 },
      uploadedProjectName: null,
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
  } as unknown as SerializedProjectData;

  const restored = restoreProjectFromImport(importedProject);

  assert.equal(restored.floors[0].height, DEFAULT_FLOOR_HEIGHT);
});

test("restoreProjectFromImport clones imported floor and room geometry into mutable editor state", () => {
  const importedProject: SerializedProjectData = {
    projectId: "project-imported",
    projectName: "Imported Guide",
    objectVersion: 2,
    floors: [
      {
        floorId: "floor-1",
        floorName: "Ground Floor",
        floorHeight: 3.5,
        referenceImage: null,
        rooms: [
          {
            roomId: "room-1",
            roomName: "Reception",
            roomPolygon: [
              { x: 0, y: 0 },
              { x: 6, y: 0 },
              { x: 6, y: 4 },
              { x: 0, y: 4 },
            ],
            sharedBoundaries: [],
            area: 24,
            labelPosition: { x: 3, y: 2 },
            walls: [],
            openings: [],
          },
        ],
        verticalConnectors: [],
      },
    ],
    viewState: {
      activeFloorId: "floor-1",
      zoom: 1,
      pan: { x: 0, y: 0 },
      uploadedProjectName: null,
    },
    assets: [],
    annotations: [],
    editorConfig: {
      selectedTool: "select",
      snapToGrid: false,
      gridSize: 16,
      showGrid: true,
      showReferenceImages: true,
      showRoomLabels: true,
    },
  };

  const restored = restoreProjectFromImport(importedProject);
  restored.floors[0].rooms[0].roomPolygon[0].x = 99;
  restored.floors[0].name = "Changed Floor";

  assert.equal(importedProject.floors[0].rooms[0].roomPolygon[0]?.x, 0);
  assert.equal(importedProject.floors[0].floorName, "Ground Floor");
});

test("serializeProjectForExport detaches exported geometry from live editor state", () => {
  const project: EditorProjectState = {
    projectId: "project-beta",
    projectName: "Office Tower",
    objectVersion: 1,
    floors: [
      {
        id: "floor-1",
        name: "Ground",
        height: 3,
        referenceImage: null,
        rooms: [
          {
            roomId: "room-a",
            roomName: "Reception",
            roomPolygon: [
              { x: 0, y: 0 },
              { x: 6, y: 0 },
              { x: 6, y: 4 },
              { x: 0, y: 4 },
              { x: 0, y: 0 },
            ],
            sharedBoundaries: [],
            area: 24,
            labelPosition: { x: 3, y: 2 },
            walls: [],
            openings: [],
          },
        ],
        verticalConnectors: [],
      },
    ],
    viewState: {
      activeFloorId: "floor-1",
      zoom: 1,
      pan: { x: 0, y: 0 },
    },
    annotations: [
      {
        annotationId: "annotation-reception",
        floorId: "floor-1",
        annotationType: "note",
        text: "Front desk",
        targetRoomId: "room-a",
        position: { x: 3, y: 2 },
        color: "#101820",
        isVisible: true,
      },
    ],
  };

  const serialized = serializeProjectForExport(project);

  assert.notEqual(serialized, project);
  assert.notEqual(serialized.floors, project.floors);
  assert.notEqual(serialized.floors[0].rooms, project.floors[0].rooms);
  assert.notEqual(
    serialized.floors[0].rooms[0].roomPolygon,
    project.floors[0].rooms[0].roomPolygon,
  );
  assert.notEqual(serialized.annotations, project.annotations);
  assert.notEqual(serialized.annotations[0].position, project.annotations?.[0].position);

  project.floors[0].rooms[0].roomPolygon[1] = { x: 999, y: 999 };
  project.viewState.pan = { x: 50, y: 75 };
  if (project.annotations != null) {
    project.annotations[0].position = { x: 50, y: 75 };
  }

  assert.deepEqual(serialized.floors[0].rooms[0].roomPolygon[1], {
    x: 6,
    y: 0,
  });
  assert.deepEqual(serialized.viewState.pan, { x: 0, y: 0 });
  assert.deepEqual(serialized.annotations[0].position, { x: 3, y: 2 });
});

test("serializeProjectForExport produces a plain JSON payload that round-trips cleanly", () => {
  const serialized = serializeProjectForExport({
    projectId: "project-gamma",
    projectName: "Clinic",
    objectVersion: 2,
    floors: [
      {
        id: "floor-1",
        name: "Level 1",
        height: 3.2,
        referenceImage: null,
        rooms: [],
        verticalConnectors: [],
      },
    ],
    viewState: {
      activeFloorId: "floor-1",
      zoom: 0.85,
      pan: { x: -20, y: 14 },
      uploadedProjectName: null,
    },
  });

  assert.deepEqual(JSON.parse(JSON.stringify(serialized)), serialized);
});

test("serializeProjectForExport and restoreProjectFromImport preserve each configured floor height", () => {
  const serialized = serializeProjectForExport({
    projectId: "project-height-roundtrip",
    projectName: "Height Roundtrip",
    objectVersion: 2,
    floors: [
      {
        id: "floor-ground",
        name: "Ground",
        height: 3.25,
        referenceImage: null,
        rooms: [],
        verticalConnectors: [],
      },
      {
        id: "floor-second",
        name: "Second",
        height: 4.5,
        referenceImage: null,
        rooms: [],
        verticalConnectors: [],
      },
      {
        id: "floor-mechanical",
        name: "Mechanical",
        height: 2.75,
        referenceImage: null,
        rooms: [],
        verticalConnectors: [],
      },
    ],
    viewState: {
      activeFloorId: "floor-second",
      zoom: 1,
      pan: { x: 0, y: 0 },
      uploadedProjectName: null,
    },
  });

  const uploadedJson = JSON.stringify(serialized);
  const restored = restoreProjectFromImport(JSON.parse(uploadedJson));

  assert.deepEqual(
    serialized.floors.map(({ floorId, floorHeight }) => ({
      floorId,
      floorHeight,
    })),
    [
      {
        floorId: "floor-ground",
        floorHeight: 3.25,
      },
      {
        floorId: "floor-second",
        floorHeight: 4.5,
      },
      {
        floorId: "floor-mechanical",
        floorHeight: 2.75,
      },
    ],
  );
  assert.deepEqual(
    restored.floors.map(({ id, height }) => ({
      id,
      height,
    })),
    [
      {
        id: "floor-ground",
        height: 3.25,
      },
      {
        id: "floor-second",
        height: 4.5,
      },
      {
        id: "floor-mechanical",
        height: 2.75,
      },
    ],
  );
});
