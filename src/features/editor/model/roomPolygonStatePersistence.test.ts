import assert from "node:assert/strict";
import test from "node:test";

import { createEditorProject } from "../../../domain/editor-state.ts";
import {
  persistDeletedRoomPolygonVertex,
  persistInsertedRoomPolygonEdgeVertex,
  persistInsertedRoomPolygonVertex,
  persistMovedRoomPolygonVertex,
} from "./roomPolygonStatePersistence.ts";

test("room polygon persistence writes move, insert, and remove edits back into editor project state", () => {
  const project = createEditorProject({
    projectId: "project-room-polygon-persistence",
    floors: [
      {
        floorId: "floor-1",
        rooms: [
          {
            roomId: "room-1",
            roomName: "Lobby",
            roomPolygon: [
              { x: 0, y: 0 },
              { x: 4, y: 0 },
              { x: 4, y: 3 },
              { x: 0, y: 3 },
            ],
          },
        ],
      },
    ],
  });
  const context = {
    floorId: "floor-1",
    roomId: "room-1",
  } as const;

  const moved = persistMovedRoomPolygonVertex(project, context, 1, {
    x: 6,
    y: 1,
  });

  assert.equal(moved.ok, true);

  if (!moved.ok) {
    return;
  }

  assert.deepEqual(moved.project.floors[0].rooms[0].roomPolygon, [
    { x: 0, y: 0 },
    { x: 6, y: 1 },
    { x: 4, y: 3 },
    { x: 0, y: 3 },
  ]);
  assert.equal(moved.project.floors[0].rooms[0].area, 13);
  assert.deepEqual(moved.project.floors[0].rooms[0].labelPosition, {
    x: 2.5,
    y: 1.75,
  });
  assert.deepEqual(project.floors[0].rooms[0].roomPolygon, [
    { x: 0, y: 0 },
    { x: 4, y: 0 },
    { x: 4, y: 3 },
    { x: 0, y: 3 },
  ]);

  const inserted = persistInsertedRoomPolygonVertex(moved.project, context, 1, {
    x: 7,
    y: 2,
  });

  assert.equal(inserted.ok, true);

  if (!inserted.ok) {
    return;
  }

  assert.deepEqual(inserted.project.floors[0].rooms[0].roomPolygon, [
    { x: 0, y: 0 },
    { x: 6, y: 1 },
    { x: 7, y: 2 },
    { x: 4, y: 3 },
    { x: 0, y: 3 },
  ]);
  assert.equal(inserted.project.floors[0].rooms[0].area, 15);
  assert.deepEqual(inserted.project.floors[0].rooms[0].labelPosition, {
    x: 3.4,
    y: 1.8,
  });

  const removed = persistDeletedRoomPolygonVertex(inserted.project, context, 2);

  assert.equal(removed.ok, true);

  if (!removed.ok) {
    return;
  }

  assert.deepEqual(removed.project.floors[0].rooms[0].roomPolygon, [
    { x: 0, y: 0 },
    { x: 6, y: 1 },
    { x: 4, y: 3 },
    { x: 0, y: 3 },
  ]);
  assert.equal(removed.project.floors[0].rooms[0].area, 13);
  assert.deepEqual(removed.project.floors[0].rooms[0].labelPosition, {
    x: 2.5,
    y: 1.75,
  });
});

test("room polygon persistence preserves the previous editor project when a move edit is invalid", () => {
  const project = createEditorProject({
    projectId: "project-room-polygon-invalid-persistence",
    floors: [
      {
        floorId: "floor-1",
        rooms: [
          {
            roomId: "room-1",
            roomName: "Lobby",
            roomPolygon: [
              { x: 0, y: 0 },
              { x: 8, y: 0 },
              { x: 8, y: 8 },
              { x: 0, y: 8 },
            ],
          },
        ],
      },
    ],
  });

  const result = persistMovedRoomPolygonVertex(
    project,
    {
      floorId: "floor-1",
      roomId: "room-1",
    },
    2,
    { x: -2, y: 2 },
  );

  assert.deepEqual(result, {
    ok: false,
    error: "invalid_polygon",
    validation: {
      code: "polygon_area_must_be_non_zero",
      message: "A room polygon must define a valid simple closed shape.",
    },
  });
  assert.deepEqual(project.floors[0].rooms[0].roomPolygon, [
    { x: 0, y: 0 },
    { x: 8, y: 0 },
    { x: 8, y: 8 },
    { x: 0, y: 8 },
  ]);
});

test("room polygon persistence writes edge-based vertex insertion back into editor project state", () => {
  const project = createEditorProject({
    projectId: "project-room-polygon-edge-insert-persistence",
    floors: [
      {
        floorId: "floor-1",
        rooms: [
          {
            roomId: "room-1",
            roomName: "Lobby",
            roomPolygon: [
              { x: 0, y: 0 },
              { x: 4, y: 0 },
              { x: 4, y: 3 },
              { x: 0, y: 3 },
            ],
          },
        ],
      },
    ],
  });

  const result = persistInsertedRoomPolygonEdgeVertex(
    project,
    {
      floorId: "floor-1",
      roomId: "room-1",
    },
    1,
    { x: 6, y: 2 },
  );

  assert.equal(result.ok, true);

  if (!result.ok) {
    return;
  }

  assert.deepEqual(result.project.floors[0].rooms[0].roomPolygon, [
    { x: 0, y: 0 },
    { x: 4, y: 0 },
    { x: 6, y: 2 },
    { x: 4, y: 3 },
    { x: 0, y: 3 },
  ]);
  assert.equal(result.project.floors[0].rooms[0].area, 15);
  assert.deepEqual(result.project.floors[0].rooms[0].labelPosition, {
    x: 2.8,
    y: 1.6,
  });
  assert.deepEqual(project.floors[0].rooms[0].roomPolygon, [
    { x: 0, y: 0 },
    { x: 4, y: 0 },
    { x: 4, y: 3 },
    { x: 0, y: 3 },
  ]);
});
