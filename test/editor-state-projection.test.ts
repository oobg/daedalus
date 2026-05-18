import assert from "node:assert/strict";
import test from "node:test";

import { createEditorProject } from "../src/domain/editor-state.ts";
import {
  EDITOR_STATE_PROJECTION_VERSION,
  RENDERER_CONTRACT_FIELDS,
  createReadonlyEditorStateProjection,
  projectEditorStateForRenderer,
  serializeEditorStateProjection,
} from "../src/features/renderer/index.ts";

test("projectEditorStateForRenderer projects editor state into the stable renderer snapshot shape", () => {
  const project = createEditorProject({
    projectId: "project-projection",
    projectName: "Projection Center",
    objectVersion: 5,
    floors: [
      {
        floorId: "floor-1",
        floorName: "Ground",
        floorHeight: 3.25,
        referenceImage: "floor-plan://projection/ground.png",
        rooms: [
          {
            roomId: "room-lobby",
            roomName: "Lobby",
            roomPolygon: [
              { x: 0, y: 0 },
              { x: 10, y: 0 },
              { x: 10, y: 6 },
              { x: 0, y: 6 },
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
                openingId: "opening-front-door",
                openingType: "door",
                attachedEdgeId: "room-lobby:edge:0",
                edgeRelativePosition: 0.4,
              },
            ],
          },
        ],
        verticalConnectors: [
          {
            connectorId: "connector-stair",
            connectorType: "stair",
            roomId: "room-lobby",
            targetFloorId: "floor-2",
            position: { x: 2, y: 2 },
          },
        ],
      },
    ],
    viewState: {
      activeFloorId: "floor-1",
      selectedRoomId: "room-lobby",
    },
    exteriorPolygon: [
      { x: -1, y: -1 },
      { x: 11, y: -1 },
      { x: 11, y: 7 },
    ],
    metadata: {
      notes: "editor-only data",
    },
  });

  const snapshot = projectEditorStateForRenderer(project);

  assert.deepEqual(snapshot, {
    projectId: "project-projection",
    projectName: "Projection Center",
    objectVersion: 5,
    floors: [
      {
        floorId: "floor-1",
        floorName: "Ground",
        floorHeight: 3.25,
        referenceImage: "floor-plan://projection/ground.png",
        rooms: [
          {
            roomId: "room-lobby",
            roomName: "Lobby",
            roomPolygon: [
              { x: 0, y: 0 },
              { x: 10, y: 0 },
              { x: 10, y: 6 },
              { x: 0, y: 6 },
            ],
            sharedBoundaries: [
              {
                edgeId: "room-lobby:edge:1",
                adjacentRoomId: "room-office",
                adjacentEdgeId: "room-office:edge:3",
              },
            ],
            area: 60,
            labelPosition: { x: 5, y: 3 },
            walls: [
              {
                edgeId: "room-lobby:edge:0",
                start: { x: 0, y: 0 },
                end: { x: 10, y: 0 },
              },
              {
                edgeId: "room-lobby:edge:1",
                start: { x: 10, y: 0 },
                end: { x: 10, y: 6 },
              },
              {
                edgeId: "room-lobby:edge:2",
                start: { x: 10, y: 6 },
                end: { x: 0, y: 6 },
              },
              {
                edgeId: "room-lobby:edge:3",
                start: { x: 0, y: 6 },
                end: { x: 0, y: 0 },
              },
            ],
            openings: [
              {
                openingId: "opening-front-door",
                openingType: "door",
                attachedEdgeId: "room-lobby:edge:0",
                edgeRelativePosition: 0.4,
              },
            ],
          },
        ],
        verticalConnectors: [
          {
            connectorId: "connector-stair",
            connectorType: "stair",
            roomId: "room-lobby",
            targetFloorId: "floor-2",
            position: { x: 2, y: 2 },
          },
        ],
      },
    ],
    viewState: {
      activeFloorId: "floor-1",
      selectedRoomId: "room-lobby",
    },
  });

  assert.equal("metadata" in snapshot, false);
  assert.equal("exteriorPolygon" in snapshot, false);

  project.floors[0].rooms[0].roomPolygon[1].x = 99;
  assert.equal(snapshot.floors[0].rooms[0].roomPolygon[1].x, 10);
});

test("createReadonlyEditorStateProjection freezes the viewer and renderer projection envelope", () => {
  const project = createEditorProject({
    projectId: "project-readonly",
    floors: [
      {
        floorId: "floor-1",
        rooms: [
          {
            roomId: "room-1",
            roomPolygon: [
              { x: 0, y: 0 },
              { x: 4, y: 0 },
              { x: 4, y: 3 },
              { x: 0, y: 3 },
              { x: 0, y: 0 },
            ],
          },
        ],
      },
    ],
  });

  const projection = createReadonlyEditorStateProjection(project, {
    projectedAt: new Date("2026-05-15T04:30:00.000Z"),
    consumers: ["viewer"],
  });

  assert.deepEqual(RENDERER_CONTRACT_FIELDS.editorStateProjection, [
    "projectionVersion",
    "projectedAt",
    "consumers",
    "project",
  ]);
  assert.equal(projection.projectionVersion, EDITOR_STATE_PROJECTION_VERSION);
  assert.equal(projection.projectedAt, "2026-05-15T04:30:00.000Z");
  assert.deepEqual(projection.consumers, ["viewer"]);
  assert.equal(Object.isFrozen(projection), true);
  assert.equal(Object.isFrozen(projection.project), true);
  assert.equal(Object.isFrozen(projection.project.floors), true);
  assert.equal(Object.isFrozen(projection.project.floors[0].rooms[0]), true);
  assert.equal(
    Object.isFrozen(projection.project.floors[0].rooms[0].roomPolygon),
    true,
  );
  assert.equal(
    Object.isFrozen(projection.project.floors[0].rooms[0].roomPolygon[1]),
    true,
  );

  assert.throws(() => {
    ((
      projection.project.floors[0].rooms[0].roomPolygon as {
        push(point: { x: number; y: number }): void;
      }
    ) as unknown as {
      push(point: { x: number; y: number }): void;
    }).push({ x: 99, y: 99 });
  }, TypeError);
  assert.throws(() => {
    (
      projection.project.floors[0].rooms[0].roomPolygon[1] as {
        x: number;
        y: number;
      }
    ).x = 99;
  }, TypeError);
  assert.deepEqual(project.floors[0].rooms[0].roomPolygon[1], {
    x: 4,
    y: 0,
  });
});

test("serializeEditorStateProjection returns a JSON-safe cloned projection", () => {
  const project = createEditorProject({
    projectId: "project-serialized",
    projectName: "Serialized Guide",
    floors: [{ floorId: "floor-1" }],
  });

  const serialized = serializeEditorStateProjection(project, {
    projectedAt: new Date("2026-05-15T05:00:00.000Z"),
  });
  const roundTripped = JSON.parse(JSON.stringify(serialized));

  assert.deepEqual(roundTripped, serialized);
  assert.equal(serialized.project.projectId, "project-serialized");
  assert.deepEqual(serialized.consumers, ["renderer", "viewer"]);

  project.projectName = "Mutated Guide";
  assert.equal(serialized.project.projectName, "Serialized Guide");
});
