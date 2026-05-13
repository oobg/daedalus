import assert from "node:assert/strict";
import test from "node:test";

import {
  createValidatedWallSegment,
  validateWallSegmentInput,
} from "../src/domain/wall.ts";
import { restoreProjectFromImport } from "../src/features/project-export/project-serializer.ts";

test("validateWallSegmentInput accepts valid wall data for creation and loading", () => {
  const result = validateWallSegmentInput({
    edgeId: "edge-lobby-east",
    start: { x: 8, y: 0 },
    end: { x: 8, y: 6 },
  });

  assert.equal(result.ok, true);

  if (!result.ok) {
    throw new Error("Expected valid wall input.");
  }

  assert.deepEqual(result.value, {
    edgeId: "edge-lobby-east",
    start: { x: 8, y: 0 },
    end: { x: 8, y: 6 },
  });

  const wall = createValidatedWallSegment(result.value);

  assert.deepEqual(wall, result.value);
  assert.notEqual(wall.start, result.value.start);
  assert.notEqual(wall.end, result.value.end);
});

test("validateWallSegmentInput rejects invalid wall geometry", () => {
  const result = validateWallSegmentInput({
    edgeId: "edge-lobby-east",
    start: { x: 8, y: 0 },
    end: { x: 8, y: 0 },
  });

  assert.deepEqual(result, {
    ok: false,
    error: {
      code: "invalid_wall_geometry",
      message: "Wall start and end points must not be identical.",
    },
  });
});

test("restoreProjectFromImport uses validated wall loading for imported room walls", () => {
  assert.throws(
    () =>
      restoreProjectFromImport({
        projectId: "project-invalid-wall",
        projectName: "Invalid Wall Import",
        objectVersion: 1,
        floors: [
          {
            floorId: "floor-1",
            floorName: "Ground Floor",
            floorHeight: 3.5,
            referenceImage: null,
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
                    end: { x: 8, y: 0 },
                  },
                ],
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
      }),
    /Wall start and end points must not be identical\./,
  );
});
