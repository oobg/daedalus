import assert from "node:assert/strict";
import test from "node:test";

import {
  importUploadedProject,
} from "../src/features/project-export/import-uploaded-project.ts";
import {
  PROJECT_EXPORT_FORMAT_VERSION,
} from "../src/features/project-export/export-schema.ts";

function createSerializedProject() {
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
            sharedBoundaries: [],
            area: 48,
            labelPosition: { x: 4, y: 3 },
            walls: [],
            openings: [],
          },
        ],
        verticalConnectors: [],
      },
    ],
    viewState: {
      activeFloorId: "floor-1",
      zoom: 1.25,
      pan: { x: 120, y: 80 },
      uploadedProjectName: "museum-wayfinding.json",
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

test("importUploadedProject returns the validated project for a raw serialized project JSON payload", () => {
  const project = createSerializedProject();

  const result = importUploadedProject(JSON.stringify(project));

  assert.deepEqual(result, {
    ok: true,
    value: project,
  });
});

test("importUploadedProject extracts and validates the embedded project from an export envelope", () => {
  const project = createSerializedProject();

  const result = importUploadedProject(
    JSON.stringify({
      exportFormatVersion: PROJECT_EXPORT_FORMAT_VERSION,
      exportedAt: "2026-05-13T12:00:00.000Z",
      projectMetadata: {
        projectId: project.projectId,
        projectName: project.projectName,
        objectVersion: project.objectVersion,
      },
      project,
    }),
  );

  assert.deepEqual(result, {
    ok: true,
    value: project,
  });
});

test("importUploadedProject surfaces JSON parsing failures with parse-stage errors", () => {
  const result = importUploadedProject('{"projectId":"project-alpha","floors":[}');

  assert.equal(result.ok, false);

  if (result.ok) {
    return;
  }

  assert.equal(result.stage, "parse");
  assert.equal(result.error.code, "invalid_project_json");
});

test("importUploadedProject reports clear envelope errors when the upload looks like an export but lacks the project payload", () => {
  const result = importUploadedProject(
    JSON.stringify({
      exportFormatVersion: PROJECT_EXPORT_FORMAT_VERSION,
      exportedAt: "2026-05-13T12:00:00.000Z",
      projectMetadata: {
        projectId: "project-alpha",
        projectName: "Museum Wayfinding",
        objectVersion: 1,
      },
    }),
  );

  assert.deepEqual(result, {
    ok: false,
    stage: "envelope",
    error: {
      code: "invalid_project_envelope",
      message:
        "Uploaded project export must include exportFormatVersion, exportedAt, projectMetadata, and a top-level project object.",
    },
  });
});

test("importUploadedProject reports schema errors from the extracted project payload", () => {
  const project = createSerializedProject() as ReturnType<
    typeof createSerializedProject
  > & {
    floors: Array<Record<string, unknown>>;
  };
  project.floors[0].rooms = [
    {
      ...project.floors[0].rooms?.[0],
      area: "48",
    },
  ];

  const result = importUploadedProject(JSON.stringify(project));

  assert.equal(result.ok, false);

  if (result.ok) {
    return;
  }

  assert.equal(result.stage, "schema");
  assert.deepEqual(result.errors, [
    {
      code: "invalid_field",
      path: "project.floors[0].rooms[0].area",
      message: "Expected finite number, received string.",
    },
  ]);
});
