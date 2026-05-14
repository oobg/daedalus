import assert from "node:assert/strict";
import test from "node:test";

import {
  assembleProjectExportPayload,
} from "../src/features/project-export/project-export-assembler.ts";
import {
  PROJECT_EXPORT_FORMAT_VERSION,
} from "../src/features/project-export/export-schema.ts";
import {
  type EditorProjectState,
} from "../src/features/project-export/project-serializer.ts";

function createProjectFixture(): EditorProjectState {
  return {
    projectId: "project-delta",
    projectName: "Campus Navigation",
    objectVersion: 7,
    floors: [
      {
        id: "floor-1",
        name: "Level 1",
        height: 3.4,
        referenceImage: "floor-plan://project-delta/floor-1/level-1.png",
        rooms: [
          {
            roomId: "room-entry",
            roomName: "Entry Hall",
            roomPolygon: [
              { x: 0, y: 0 },
              { x: 12, y: 0 },
              { x: 12, y: 7 },
              { x: 0, y: 7 },
              { x: 0, y: 0 },
            ],
            sharedBoundaries: [
              {
                edgeId: "edge-entry-east",
                adjacentRoomId: "room-checkin",
                adjacentEdgeId: "edge-checkin-west",
              },
            ],
            area: 84,
            labelPosition: { x: 6, y: 3.5 },
            walls: [
              {
                edgeId: "edge-entry-east",
                start: { x: 12, y: 0 },
                end: { x: 12, y: 7 },
              },
            ],
            openings: [
              {
                openingId: "opening-entry-door",
                openingType: "door",
                attachedEdgeId: "edge-entry-east",
                edgeRelativePosition: 0.4,
              },
            ],
          },
          {
            roomId: "room-checkin",
            roomName: "Check-in",
            roomPolygon: [
              { x: 12, y: 0 },
              { x: 18, y: 0 },
              { x: 18, y: 7 },
              { x: 12, y: 7 },
              { x: 12, y: 0 },
            ],
            sharedBoundaries: [
              {
                edgeId: "edge-checkin-west",
                adjacentRoomId: "room-entry",
                adjacentEdgeId: "edge-entry-east",
              },
            ],
            area: 42,
            labelPosition: { x: 15, y: 3.5 },
            walls: [
              {
                edgeId: "edge-checkin-west",
                start: { x: 12, y: 7 },
                end: { x: 12, y: 0 },
              },
            ],
            openings: [
              {
                openingId: "opening-checkin-window",
                openingType: "window",
                attachedEdgeId: "edge-checkin-west",
                edgeRelativePosition: 0.6,
              },
            ],
          },
        ],
        verticalConnectors: [
          {
            connectorId: "connector-stair-a",
            connectorType: "stair",
            roomId: "room-entry",
            targetFloorId: "floor-2",
            position: { x: 3, y: 2 },
          },
        ],
      },
      {
        id: "floor-2",
        name: "Level 2",
        height: 3.8,
        referenceImage: null,
        rooms: [
          {
            roomId: "room-bridge",
            roomName: "Bridge",
            roomPolygon: [
              { x: 2, y: 1 },
              { x: 10, y: 1 },
              { x: 10, y: 5 },
              { x: 2, y: 5 },
              { x: 2, y: 1 },
            ],
            sharedBoundaries: [],
            area: 32,
            labelPosition: { x: 6, y: 3 },
            walls: [],
            openings: [],
          },
        ],
        verticalConnectors: [
          {
            connectorId: "connector-elevator-a",
            connectorType: "elevator",
            roomId: "room-bridge",
            targetFloorId: "floor-1",
            position: { x: 4, y: 2 },
          },
        ],
      },
    ],
    viewState: {
      activeFloorId: "floor-2",
      zoom: 1.15,
      pan: { x: 180, y: 72 },
      uploadedProjectName: "campus-navigation.json",
    },
    assets: [
      {
        assetId: "asset-level-1",
        assetType: "reference-image",
        floorId: "floor-1",
        fileName: "level-1.png",
        mimeType: "image/png",
        size: 12048,
        storageKey: "daedalus.floorPlanAsset:asset-level-1",
        assetRef: "floor-plan://project-delta/floor-1/level-1.png",
      },
    ],
    annotations: [
      {
        annotationId: "annotation-entry",
        floorId: "floor-1",
        annotationType: "label",
        text: "Main reception",
        targetRoomId: "room-entry",
        position: { x: 4, y: 2 },
        color: "#34516c",
        isVisible: true,
      },
    ],
    editorConfig: {
      selectedTool: "select",
      snapToGrid: true,
      gridSize: 24,
      showGrid: true,
      showReferenceImages: true,
      showRoomLabels: true,
    },
  };
}

test("assembleProjectExportPayload combines serialized sections into a versioned deterministic export payload", () => {
  const project = createProjectFixture();
  const exportedAt = new Date("2026-05-13T11:45:00.000Z");

  const assembled = assembleProjectExportPayload(project, exportedAt);

  assert.deepEqual(assembled, {
    exportFormatVersion: PROJECT_EXPORT_FORMAT_VERSION,
    exportedAt: "2026-05-13T11:45:00.000Z",
    projectMetadata: {
      projectId: "project-delta",
      projectName: "Campus Navigation",
      objectVersion: 7,
    },
    project: {
      projectId: "project-delta",
      projectName: "Campus Navigation",
      objectVersion: 7,
      floors: [
        {
          floorId: "floor-1",
          floorName: "Level 1",
          floorHeight: 3.4,
          referenceImage: "floor-plan://project-delta/floor-1/level-1.png",
          rooms: [
            {
              roomId: "room-entry",
              roomName: "Entry Hall",
              roomPolygon: [
                { x: 0, y: 0 },
                { x: 12, y: 0 },
                { x: 12, y: 7 },
                { x: 0, y: 7 },
                { x: 0, y: 0 },
              ],
              sharedBoundaries: [
                {
                  edgeId: "edge-entry-east",
                  adjacentRoomId: "room-checkin",
                  adjacentEdgeId: "edge-checkin-west",
                },
              ],
              area: 84,
              labelPosition: { x: 6, y: 3.5 },
              walls: [
                {
                  edgeId: "edge-entry-east",
                  start: { x: 12, y: 0 },
                  end: { x: 12, y: 7 },
                },
              ],
              openings: [
                {
                  openingId: "opening-entry-door",
                  openingType: "door",
                  attachedEdgeId: "edge-entry-east",
                  edgeRelativePosition: 0.4,
                },
              ],
            },
            {
              roomId: "room-checkin",
              roomName: "Check-in",
              roomPolygon: [
                { x: 12, y: 0 },
                { x: 18, y: 0 },
                { x: 18, y: 7 },
                { x: 12, y: 7 },
                { x: 12, y: 0 },
              ],
              sharedBoundaries: [
                {
                  edgeId: "edge-checkin-west",
                  adjacentRoomId: "room-entry",
                  adjacentEdgeId: "edge-entry-east",
                },
              ],
              area: 42,
              labelPosition: { x: 15, y: 3.5 },
              walls: [
                {
                  edgeId: "edge-checkin-west",
                  start: { x: 12, y: 7 },
                  end: { x: 12, y: 0 },
                },
              ],
              openings: [
                {
                  openingId: "opening-checkin-window",
                  openingType: "window",
                  attachedEdgeId: "edge-checkin-west",
                  edgeRelativePosition: 0.6,
                },
              ],
            },
          ],
          verticalConnectors: [
            {
              connectorId: "connector-stair-a",
              connectorType: "stair",
              roomId: "room-entry",
              targetFloorId: "floor-2",
              position: { x: 3, y: 2 },
            },
          ],
        },
        {
          floorId: "floor-2",
          floorName: "Level 2",
          floorHeight: 3.8,
          referenceImage: null,
          rooms: [
            {
              roomId: "room-bridge",
              roomName: "Bridge",
              roomPolygon: [
                { x: 2, y: 1 },
                { x: 10, y: 1 },
                { x: 10, y: 5 },
                { x: 2, y: 5 },
                { x: 2, y: 1 },
              ],
              sharedBoundaries: [],
              area: 32,
              labelPosition: { x: 6, y: 3 },
              walls: [],
              openings: [],
            },
          ],
          verticalConnectors: [
            {
              connectorId: "connector-elevator-a",
              connectorType: "elevator",
              roomId: "room-bridge",
              targetFloorId: "floor-1",
              position: { x: 4, y: 2 },
            },
          ],
        },
      ],
      viewState: {
        activeFloorId: "floor-2",
        zoom: 1.15,
        pan: { x: 180, y: 72 },
        uploadedProjectName: "campus-navigation.json",
      },
      assets: [
        {
          assetId: "asset-level-1",
          assetType: "reference-image",
          floorId: "floor-1",
          fileName: "level-1.png",
          mimeType: "image/png",
          size: 12048,
          storageKey: "daedalus.floorPlanAsset:asset-level-1",
          assetRef: "floor-plan://project-delta/floor-1/level-1.png",
        },
      ],
      annotations: [
        {
          annotationId: "annotation-entry",
          floorId: "floor-1",
          annotationType: "label",
          text: "Main reception",
          targetRoomId: "room-entry",
          position: { x: 4, y: 2 },
          color: "#34516c",
          isVisible: true,
        },
      ],
      editorConfig: {
        selectedTool: "select",
        snapToGrid: true,
        gridSize: 24,
        showGrid: true,
        showReferenceImages: true,
        showRoomLabels: true,
      },
    },
  });
});

test("assembleProjectExportPayload stays stable across repeated calls and detaches the export object from live editor state", () => {
  const project = createProjectFixture();
  const exportedAt = new Date("2026-05-13T11:45:00.000Z");

  const firstAssembly = assembleProjectExportPayload(project, exportedAt);
  const secondAssembly = assembleProjectExportPayload(project, exportedAt);

  assert.deepEqual(firstAssembly, secondAssembly);
  assert.notEqual(firstAssembly, secondAssembly);
  assert.notEqual(firstAssembly.project, secondAssembly.project);
  assert.notEqual(firstAssembly.project.floors, secondAssembly.project.floors);

  project.projectName = "Mutated Campus Navigation";
  project.floors[0].rooms[0].roomPolygon[1] = { x: 999, y: 999 };
  if (project.assets != null) {
    project.assets[0].fileName = "mutated.png";
  }

  assert.equal(firstAssembly.project.projectName, "Campus Navigation");
  assert.deepEqual(firstAssembly.project.floors[0].rooms[0].roomPolygon[1], {
    x: 12,
    y: 0,
  });
  assert.equal(firstAssembly.project.assets[0].fileName, "level-1.png");
  assert.deepEqual(JSON.parse(JSON.stringify(firstAssembly)), firstAssembly);
});

test("assembleProjectExportPayload includes every configured floor height in generated output", () => {
  const project = createProjectFixture();

  project.floors[0].height = 4.25;
  project.floors[1].height = 5.75;

  const assembled = assembleProjectExportPayload(
    project,
    new Date("2026-05-13T11:45:00.000Z"),
  );

  assert.deepEqual(
    assembled.project.floors.map((floor) => ({
      floorId: floor.floorId,
      floorHeight: floor.floorHeight,
    })),
    [
      {
        floorId: "floor-1",
        floorHeight: 4.25,
      },
      {
        floorId: "floor-2",
        floorHeight: 5.75,
      },
    ],
  );
});
