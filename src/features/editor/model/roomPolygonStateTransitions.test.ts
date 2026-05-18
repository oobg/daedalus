import assert from "node:assert/strict";
import test from "node:test";

import { createEditorProject } from "../../../domain/editor-state.ts";
import {
  createRoomPolygonState,
  updateRoomPolygonState,
} from "./roomPolygonStateTransitions.ts";

test("createRoomPolygonState persists a new room polygon as the canonical room object on the targeted floor", () => {
  const project = createEditorProject({
    projectId: "project-room-polygon-create-transition",
    floors: [
      {
        floorId: "floor-1",
        floorName: "Ground Floor",
      },
      {
        floorId: "floor-2",
        floorName: "Second Floor",
      },
    ],
  });

  const result = createRoomPolygonState({
    project,
    floorId: "floor-2",
    roomId: "room-1",
    roomName: "Lobby",
    roomPolygon: [
      { x: 10, y: 20 },
      { x: 40, y: 20 },
      { x: 40, y: 50 },
      { x: 10, y: 50 },
    ],
  });

  assert.equal(result.ok, true);

  if (!result.ok) {
    return;
  }

  assert.equal(result.project.floors[0], project.floors[0]);
  assert.notEqual(result.project.floors[1], project.floors[1]);
  assert.deepEqual(result.room, {
    roomId: "room-1",
    roomName: "Lobby",
    roomPolygon: [
      { x: 10, y: 20 },
      { x: 40, y: 20 },
      { x: 40, y: 50 },
      { x: 10, y: 50 },
    ],
    sharedBoundaries: [],
    area: 900,
    labelPosition: {
      x: 25,
      y: 35,
    },
    openings: [],
  });
  assert.deepEqual(result.project.floors[1].rooms, [result.room]);
  assert.deepEqual(project.floors[1].rooms, []);
});

test("createRoomPolygonState rejects invalid polygons without mutating editor state", () => {
  const project = createEditorProject({
    projectId: "project-room-polygon-create-invalid",
    floors: [
      {
        floorId: "floor-1",
      },
    ],
  });

  const result = createRoomPolygonState({
    project,
    floorId: "floor-1",
    roomId: "room-invalid",
    roomName: "Invalid",
    roomPolygon: [
      { x: 0, y: 0 },
      { x: 10, y: 10 },
    ],
  });

  assert.deepEqual(result, {
    ok: false,
    error: "invalid_polygon",
  });
  assert.deepEqual(project.floors[0].rooms, []);
});

test("updateRoomPolygonState replaces only the targeted room with a canonical immutable update", () => {
  const project = createEditorProject({
    projectId: "project-room-polygon-update-transition",
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
          {
            roomId: "room-2",
            roomName: "Office",
            roomPolygon: [
              { x: 10, y: 0 },
              { x: 14, y: 0 },
              { x: 14, y: 3 },
              { x: 10, y: 3 },
            ],
          },
        ],
      },
      {
        floorId: "floor-2",
        rooms: [
          {
            roomId: "room-3",
            roomName: "Storage",
            roomPolygon: [
              { x: 0, y: 0 },
              { x: 2, y: 0 },
              { x: 2, y: 2 },
              { x: 0, y: 2 },
            ],
          },
        ],
      },
    ],
  });

  const originalFloor = project.floors[0];
  const originalRoom = project.floors[0].rooms[0];
  const untouchedRoom = project.floors[0].rooms[1];

  const result = updateRoomPolygonState({
    project,
    floorId: "floor-1",
    roomId: "room-1",
    roomPolygon: [
      { x: 0, y: 0 },
      { x: 6, y: 1 },
      { x: 4, y: 3 },
      { x: 0, y: 3 },
    ],
  });

  assert.equal(result.ok, true);

  if (!result.ok) {
    return;
  }

  assert.notEqual(result.project.floors[0], originalFloor);
  assert.equal(result.project.floors[1], project.floors[1]);
  assert.notEqual(result.project.floors[0].rooms[0], originalRoom);
  assert.equal(result.project.floors[0].rooms[1], untouchedRoom);
  assert.deepEqual(result.room, {
    roomId: "room-1",
    roomName: "Lobby",
    roomPolygon: [
      { x: 0, y: 0 },
      { x: 6, y: 1 },
      { x: 4, y: 3 },
      { x: 0, y: 3 },
    ],
    sharedBoundaries: [],
    area: 13,
    labelPosition: {
      x: 2.5,
      y: 1.75,
    },
    openings: [],
  });
  assert.deepEqual(project.floors[0].rooms[0].roomPolygon, [
    { x: 0, y: 0 },
    { x: 4, y: 0 },
    { x: 4, y: 3 },
    { x: 0, y: 3 },
  ]);
});

test("updateRoomPolygonState rejects invalid polygon edits without mutating the original project", () => {
  const project = createEditorProject({
    projectId: "project-room-polygon-update-invalid",
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

  const result = updateRoomPolygonState({
    project,
    floorId: "floor-1",
    roomId: "room-1",
    roomPolygon: [
      { x: 0, y: 0 },
      { x: 8, y: 0 },
      { x: -2, y: 2 },
      { x: 0, y: 8 },
    ],
  });

  assert.deepEqual(result, {
    ok: false,
    error: "invalid_polygon",
  });
  assert.deepEqual(project.floors[0].rooms[0].roomPolygon, [
    { x: 0, y: 0 },
    { x: 8, y: 0 },
    { x: 8, y: 8 },
    { x: 0, y: 8 },
  ]);
});
