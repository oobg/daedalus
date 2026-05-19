import assert from "node:assert/strict";
import test from "node:test";

import { createEditorProject } from "../src/domain/editor-state.ts";
import {
  serializeEditorProjectToJson,
  serializeEditorProjectToJsonDocument,
} from "../src/features/project-export/editor-project-json-serializer.ts";

test("serializeEditorProjectToJsonDocument emits the required building guide fields from the editor project model", () => {
  const project = createEditorProject({
    projectId: "project-atrium",
    projectName: "Atrium Guide",
    objectVersion: 7,
    floors: [
      {
        floorId: "floor-ground",
        floorName: "Ground Floor",
        floorHeight: 3.5,
        referenceImage: "floor-plan://project-atrium/floor-ground.png",
        rooms: [
          {
            roomId: "room-lobby",
            roomName: "Lobby",
            roomPolygon: [
              { x: 0, y: 0 },
              { x: 10, y: 0 },
              { x: 10, y: 8 },
              { x: 0, y: 8 },
            ],
            sharedBoundaries: [
              {
                edgeId: "room-lobby:edge:1",
                roomId: "room-lobby",
                adjacentRoomId: "room-gallery",
                adjacentEdgeId: "room-gallery:edge:3",
              },
            ],
            edgeOpenings: [
              {
                openingId: "opening-lobby-east-door",
                openingType: "door",
                attachedEdgeId: "room-lobby:edge:1",
                edgeRelativePosition: 0.25,
              },
            ],
          },
          {
            roomId: "room-gallery",
            roomName: "Gallery",
            roomPolygon: [
              { x: 10, y: 0 },
              { x: 16, y: 0 },
              { x: 16, y: 8 },
              { x: 10, y: 8 },
            ],
            sharedBoundaries: [
              {
                edgeId: "room-gallery:edge:3",
                roomId: "room-gallery",
                adjacentRoomId: "room-lobby",
                adjacentEdgeId: "room-lobby:edge:1",
              },
            ],
            edgeOpenings: [
              {
                openingId: "opening-gallery-west-window",
                openingType: "window",
                attachedEdgeId: "room-gallery:edge:3",
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
            targetFloorId: "floor-upper",
            position: { x: 2, y: 2 },
          },
        ],
      },
      {
        floorId: "floor-upper",
        floorName: "Upper Floor",
        floorHeight: 4,
        referenceImage: null,
        rooms: [],
        verticalConnectors: [
          {
            connectorId: "connector-elevator-1",
            connectorType: "elevator",
            roomId: "room-upper-landing",
            targetFloorId: "floor-ground",
            position: { x: 1, y: 1 },
          },
        ],
      },
    ],
    viewState: {
      activeFloorId: "floor-upper",
      selectedRoomId: "room-gallery",
    },
    metadata: {
      authorName: "Facilities Team",
    },
    exteriorPolygon: [
      { x: -1, y: -1 },
      { x: 17, y: -1 },
      { x: 17, y: 9 },
      { x: -1, y: 9 },
    ],
  });

  const serialized = serializeEditorProjectToJsonDocument(project);

  assert.deepEqual(serialized, {
    projectId: "project-atrium",
    projectName: "Atrium Guide",
    objectVersion: 7,
    floors: [
      {
        floorId: "floor-ground",
        floorName: "Ground Floor",
        floorHeight: 3.5,
        referenceImage: "floor-plan://project-atrium/floor-ground.png",
        rooms: [
          {
            roomId: "room-lobby",
            roomName: "Lobby",
            roomPolygon: [
              { x: 0, y: 0 },
              { x: 10, y: 0 },
              { x: 10, y: 8 },
              { x: 0, y: 8 },
            ],
            sharedBoundaries: [
              {
                edgeId: "room-lobby:edge:1",
                roomId: "room-lobby",
                adjacentRoomId: "room-gallery",
                adjacentEdgeId: "room-gallery:edge:3",
              },
            ],
            area: 80,
            labelPosition: { x: 5, y: 4 },
            walls: [
              {
                edgeId: "room-lobby:edge:0",
                start: { x: 0, y: 0 },
                end: { x: 10, y: 0 },
              },
              {
                edgeId: "room-lobby:edge:1",
                start: { x: 10, y: 0 },
                end: { x: 10, y: 8 },
              },
              {
                edgeId: "room-lobby:edge:2",
                start: { x: 10, y: 8 },
                end: { x: 0, y: 8 },
              },
              {
                edgeId: "room-lobby:edge:3",
                start: { x: 0, y: 8 },
                end: { x: 0, y: 0 },
              },
            ],
            openings: [
              {
                openingId: "opening-lobby-east-door",
                openingType: "door",
                attachedEdgeId: "room-lobby:edge:1",
                edgeRelativePosition: 0.25,
              },
            ],
          },
          {
            roomId: "room-gallery",
            roomName: "Gallery",
            roomPolygon: [
              { x: 10, y: 0 },
              { x: 16, y: 0 },
              { x: 16, y: 8 },
              { x: 10, y: 8 },
            ],
            sharedBoundaries: [
              {
                edgeId: "room-gallery:edge:3",
                roomId: "room-gallery",
                adjacentRoomId: "room-lobby",
                adjacentEdgeId: "room-lobby:edge:1",
              },
            ],
            area: 48,
            labelPosition: { x: 13, y: 4 },
            walls: [
              {
                edgeId: "room-gallery:edge:0",
                start: { x: 10, y: 0 },
                end: { x: 16, y: 0 },
              },
              {
                edgeId: "room-gallery:edge:1",
                start: { x: 16, y: 0 },
                end: { x: 16, y: 8 },
              },
              {
                edgeId: "room-gallery:edge:2",
                start: { x: 16, y: 8 },
                end: { x: 10, y: 8 },
              },
              {
                edgeId: "room-gallery:edge:3",
                start: { x: 10, y: 8 },
                end: { x: 10, y: 0 },
              },
            ],
            openings: [
              {
                openingId: "opening-gallery-west-window",
                openingType: "window",
                attachedEdgeId: "room-gallery:edge:3",
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
            targetFloorId: "floor-upper",
            position: { x: 2, y: 2 },
          },
        ],
      },
      {
        floorId: "floor-upper",
        floorName: "Upper Floor",
        floorHeight: 4,
        referenceImage: null,
        rooms: [],
        verticalConnectors: [
          {
            connectorId: "connector-elevator-1",
            connectorType: "elevator",
            roomId: "room-upper-landing",
            targetFloorId: "floor-ground",
            position: { x: 1, y: 1 },
          },
        ],
      },
    ],
    viewState: {
      activeFloorId: "floor-upper",
      selectedRoomId: "room-gallery",
    },
    exteriorEdgeOpenings: [],
  });
});

test("serializeEditorProjectToJson produces deterministic output for the same in-memory project", () => {
  const project = createEditorProject({
    projectId: "project-deterministic",
    projectName: "Deterministic Export",
    floors: [
      {
        floorId: "floor-1",
        rooms: [
          {
            roomId: "room-1",
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

  const firstJson = serializeEditorProjectToJson(project);
  const secondJson = serializeEditorProjectToJson(project);

  assert.equal(secondJson, firstJson);
  assert.match(
    firstJson,
    /"projectId": "project-deterministic"/,
  );
  assert.match(
    firstJson,
    /"walls": \[/,
  );
  assert.doesNotMatch(
    firstJson,
    /"metadata":|"exteriorPolygon":|"guideObjects":|"openings": \[\s*{\s*"id"/,
  );
});
