import assert from "node:assert/strict";
import test from "node:test";

import { createEditorProject } from "../../../domain/editor-state.ts";
import { persistCompletedRoomPolygon } from "./roomPolygonCompletionPersistence.ts";

test("persistCompletedRoomPolygon completes an active draft into a persisted room polygon object", () => {
  const project = createEditorProject({
    projectId: "project-room-draft-completion",
    floors: [
      {
        floorId: "floor-1",
        floorName: "1F",
      },
    ],
  });

  const result = persistCompletedRoomPolygon({
    project,
    floorId: "floor-1",
    roomId: "room-1",
    roomName: "Lobby",
    orderedVertices: [
      { x: 12, y: 24 },
      { x: 64, y: 24 },
      { x: 64, y: 72 },
      { x: 12, y: 72 },
    ],
  });

  assert.equal(result.ok, true);

  if (!result.ok) {
    return;
  }

  assert.deepEqual(result.room, {
    roomId: "room-1",
    roomName: "Lobby",
    roomPolygon: [
      { x: 12, y: 24 },
      { x: 64, y: 24 },
      { x: 64, y: 72 },
      { x: 12, y: 72 },
    ],
    sharedBoundaries: [],
    area: 2496,
    labelPosition: {
      x: 38,
      y: 48,
    },
    openings: [],
  });
  assert.deepEqual(result.project.floors[0]?.rooms, [result.room]);
  assert.deepEqual(project.floors[0]?.rooms, []);
});

test("persistCompletedRoomPolygon reports invalid polygons without mutating the project", () => {
  const project = createEditorProject({
    projectId: "project-room-draft-invalid",
    floors: [
      {
        floorId: "floor-1",
        floorName: "1F",
      },
    ],
  });

  const result = persistCompletedRoomPolygon({
    project,
    floorId: "floor-1",
    roomId: "room-invalid",
    roomName: "Invalid",
    orderedVertices: [
      { x: 0, y: 0 },
      { x: 10, y: 10 },
    ],
  });

  assert.deepEqual(result, {
    ok: false,
    error: "invalid_polygon",
  });
  assert.deepEqual(project.floors[0]?.rooms, []);
});
