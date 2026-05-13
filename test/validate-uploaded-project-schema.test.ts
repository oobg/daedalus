import assert from "node:assert/strict";
import test from "node:test";

import {
  validateUploadedProjectSchema,
} from "../src/features/project-export/validate-uploaded-project-schema.ts";
import {
  type SerializedProjectData,
} from "../src/features/project-export/project-serializer.ts";

function createValidProject(): SerializedProjectData {
  return {
    projectId: "project-alpha",
    projectName: "Museum Wayfinding",
    objectVersion: 1,
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
    ],
    viewState: {
      activeFloorId: "floor-1",
      zoom: 1.25,
      pan: { x: 120, y: 80 },
      uploadedProjectName: "museum-wayfinding.json",
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
}

test("validateUploadedProjectSchema accepts a fully valid serialized project", () => {
  const project = createValidProject();

  const result = validateUploadedProjectSchema(project);

  assert.deepEqual(result, {
    ok: true,
    value: project,
  });
});

test("validateUploadedProjectSchema reports missing required top-level fields", () => {
  const project = createValidProject() as Record<string, unknown>;
  delete project.projectName;

  const result = validateUploadedProjectSchema(project);

  assert.equal(result.ok, false);

  if (result.ok) {
    return;
  }

  assert.deepEqual(result.errors, [
    {
      code: "missing_field",
      path: "project.projectName",
      message: 'Missing required field "projectName".',
    },
  ]);
});

test("validateUploadedProjectSchema reports invalid nested field types with precise paths", () => {
  const project = createValidProject() as SerializedProjectData & {
    floors: Array<Record<string, unknown>>;
  };
  project.floors[0].rooms = [
    {
      ...project.floors[0].rooms?.[0],
      area: "48",
    },
  ];

  const result = validateUploadedProjectSchema(
    project as unknown as Record<string, unknown>,
  );

  assert.equal(result.ok, false);

  if (result.ok) {
    return;
  }

  assert.deepEqual(result.errors, [
    {
      code: "invalid_field",
      path: "project.floors[0].rooms[0].area",
      message: "Expected finite number, received string.",
    },
  ]);
});

test("validateUploadedProjectSchema reports unexpected fields at nested object paths", () => {
  const project = createValidProject() as SerializedProjectData & {
    viewState: Record<string, unknown>;
  };
  project.viewState.viewportMode = "iso";

  const result = validateUploadedProjectSchema(
    project as unknown as Record<string, unknown>,
  );

  assert.equal(result.ok, false);

  if (result.ok) {
    return;
  }

  assert.deepEqual(result.errors, [
    {
      code: "unexpected_field",
      path: "project.viewState.viewportMode",
      message: 'Unexpected field "viewportMode".',
    },
  ]);
});

test("validateUploadedProjectSchema reports invalid enum values", () => {
  const project = createValidProject() as SerializedProjectData & {
    editorConfig: Record<string, unknown>;
  };
  project.editorConfig.selectedTool = "paint";

  const result = validateUploadedProjectSchema(
    project as unknown as Record<string, unknown>,
  );

  assert.equal(result.ok, false);

  if (result.ok) {
    return;
  }

  assert.deepEqual(result.errors, [
    {
      code: "invalid_field",
      path: "project.editorConfig.selectedTool",
      message:
        'Expected one of "select", "room", "opening", "annotation", received string.',
    },
  ]);
});
