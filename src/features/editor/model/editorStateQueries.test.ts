import assert from "node:assert/strict";
import test from "node:test";

import { createEditorState } from "../../../domain/editor-state.ts";
import {
  readDerivedRoomState,
  readRoomPolygonSource,
} from "./editorStateQueries.ts";

test("readRoomPolygonSource returns a room-polygon snapshot from canonical editor state", () => {
  const state = createEditorState({
    projectId: "project-alpha",
    floors: [
      {
        floorId: "floor-1",
        rooms: [
          {
            roomId: "room-lobby",
            roomName: "Lobby",
            roomPolygon: [
              { x: 0, y: 0 },
              { x: 8, y: 0 },
              { x: 8, y: 5 },
              { x: 0, y: 5 },
            ],
            sharedBoundaries: [
              {
                edgeId: "room-lobby:edge:1",
                roomId: "room-lobby",
                adjacentRoomId: "room-office",
                adjacentEdgeId: "room-office:edge:3",
              },
            ],
            edgeOpenings: [
              {
                openingId: "door-1",
                openingType: "door",
                attachedEdgeId: "room-lobby:edge:1",
                edgeRelativePosition: 0.4,
              },
            ],
          },
        ],
      },
    ],
  });

  const source = readRoomPolygonSource({
    state,
    floorId: "floor-1",
    roomId: "room-lobby",
  });

  assert.deepEqual(source, {
    roomId: "room-lobby",
    roomPolygon: [
      { x: 0, y: 0 },
      { x: 8, y: 0 },
      { x: 8, y: 5 },
      { x: 0, y: 5 },
    ],
    sharedBoundaries: [
      {
        edgeId: "room-lobby:edge:1",
        roomId: "room-lobby",
        adjacentRoomId: "room-office",
        adjacentEdgeId: "room-office:edge:3",
      },
    ],
    openings: [
      {
        openingId: "door-1",
        openingType: "door",
        attachedEdgeId: "room-lobby:edge:1",
        edgeRelativePosition: 0.4,
      },
    ],
  });

  assert.notEqual(source.roomPolygon, state.project.floors[0].rooms[0].roomPolygon);
  assert.notEqual(
    source.sharedBoundaries,
    state.project.floors[0].rooms[0].sharedBoundaries,
  );
  assert.notEqual(source.openings, state.project.floors[0].rooms[0].edgeOpenings);
});

test("readDerivedRoomState returns derived room metadata from the room polygon source of truth", () => {
  const state = createEditorState({
    projectId: "project-alpha",
    floors: [
      {
        floorId: "floor-1",
        rooms: [
          {
            roomId: "room-atrium",
            roomName: "Atrium",
            roomPolygon: [
              { x: 0, y: 0 },
              { x: 10, y: 0 },
              { x: 10, y: 6 },
              { x: 0, y: 6 },
            ],
            edgeOpenings: [
              {
                openingId: "window-1",
                openingType: "window",
                attachedEdgeId: "room-atrium:edge:2",
                edgeRelativePosition: 0.25,
              },
            ],
          },
        ],
      },
    ],
  });

  const derived = readDerivedRoomState({
    state,
    floorId: "floor-1",
    roomId: "room-atrium",
  });

  assert.equal(derived.roomName, "Atrium");
  assert.equal(derived.area, 60);
  assert.deepEqual(derived.labelPosition, { x: 5, y: 3 });
  assert.deepEqual(derived.roomPolygon, [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 10, y: 6 },
    { x: 0, y: 6 },
  ]);
  assert.deepEqual(derived.walls, [
    {
      edgeId: "room-atrium:edge:0",
      start: { x: 0, y: 0 },
      end: { x: 10, y: 0 },
    },
    {
      edgeId: "room-atrium:edge:1",
      start: { x: 10, y: 0 },
      end: { x: 10, y: 6 },
    },
    {
      edgeId: "room-atrium:edge:2",
      start: { x: 10, y: 6 },
      end: { x: 0, y: 6 },
    },
    {
      edgeId: "room-atrium:edge:3",
      start: { x: 0, y: 6 },
      end: { x: 0, y: 0 },
    },
  ]);
  assert.deepEqual(derived.openings, [
    {
      openingId: "window-1",
      openingType: "window",
      attachedEdgeId: "room-atrium:edge:2",
      edgeRelativePosition: 0.25,
    },
  ]);
});

test("editor state queries do not allow mutations to leak back into canonical editor state", () => {
  const state = createEditorState({
    projectId: "project-alpha",
    floors: [
      {
        floorId: "floor-1",
        rooms: [
          {
            roomId: "room-gallery",
            roomName: "Gallery",
            roomPolygon: [
              { x: 0, y: 0 },
              { x: 4, y: 0 },
              { x: 4, y: 4 },
              { x: 0, y: 4 },
            ],
          },
        ],
      },
    ],
  });

  const source = readRoomPolygonSource({
    state,
    floorId: "floor-1",
    roomId: "room-gallery",
  });
  const derived = readDerivedRoomState({
    state,
    floorId: "floor-1",
    roomId: "room-gallery",
  });

  assert.throws(() => {
    (source.roomPolygon as Array<{ x: number; y: number }>).push({ x: 9, y: 9 });
  });
  assert.throws(() => {
    (
      derived.walls as unknown as Array<{ edgeId: string }>
    )[0].edgeId = "mutated-edge";
  });

  assert.deepEqual(state.project.floors[0].rooms[0].roomPolygon, [
    { x: 0, y: 0 },
    { x: 4, y: 0 },
    { x: 4, y: 4 },
    { x: 0, y: 4 },
  ]);
  assert.equal(state.project.floors[0].rooms[0].area, 16);
});
