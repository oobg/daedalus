import assert from "node:assert/strict";
import test from "node:test";

import { createEditorProject } from "../src/domain/editor-state.ts";
import {
  EDITOR_STATE_PROJECTION_VERSION,
  mapEditorFloorToRendererSnapshotFloor,
  mapEditorRoomToRendererSnapshotRoom,
  RENDERER_CONTRACT_FIELDS,
  createReadonlyEditorStateProjection,
  projectEditorStateForRenderer,
  serializeEditorStateProjection,
} from "../src/features/renderer/index.ts";

test("mapEditorRoomToRendererSnapshotRoom deterministically projects a single editor room into renderer snapshot shape", () => {
  const project = createEditorProject({
    projectId: "project-room-mapping",
    floors: [
      {
        floorId: "floor-1",
        rooms: [
          {
            roomId: "room-atrium",
            roomName: "Atrium",
            roomPolygon: [
              { x: 0, y: 0 },
              { x: 12, y: 0 },
              { x: 12, y: 7 },
              { x: 0, y: 7 },
            ],
            sharedBoundaries: [
              {
                edgeId: "room-atrium:edge:1",
                roomId: "room-atrium",
                adjacentRoomId: "room-gallery",
                adjacentEdgeId: "room-gallery:edge:3",
              },
            ],
            edgeOpenings: [
              {
                openingId: "opening-east-window",
                openingType: "window",
                attachedEdgeId: "room-atrium:edge:1",
                edgeRelativePosition: 0.25,
              },
            ],
          },
        ],
      },
    ],
  });

  const room = project.floors[0].rooms[0];

  const firstProjection = mapEditorRoomToRendererSnapshotRoom(room);
  const secondProjection = mapEditorRoomToRendererSnapshotRoom(room);

  assert.deepEqual(firstProjection, {
    roomId: "room-atrium",
    roomName: "Atrium",
    roomPolygon: [
      { x: 0, y: 0 },
      { x: 12, y: 0 },
      { x: 12, y: 7 },
      { x: 0, y: 7 },
    ],
    sharedBoundaries: [
      {
        edgeId: "room-atrium:edge:1",
        adjacentRoomId: "room-gallery",
        adjacentEdgeId: "room-gallery:edge:3",
      },
    ],
    area: 84,
    labelPosition: { x: 6, y: 3.5 },
    walls: [
      {
        edgeId: "room-atrium:edge:0",
        start: { x: 0, y: 0 },
        end: { x: 12, y: 0 },
      },
      {
        edgeId: "room-atrium:edge:1",
        start: { x: 12, y: 0 },
        end: { x: 12, y: 7 },
      },
      {
        edgeId: "room-atrium:edge:2",
        start: { x: 12, y: 7 },
        end: { x: 0, y: 7 },
      },
      {
        edgeId: "room-atrium:edge:3",
        start: { x: 0, y: 7 },
        end: { x: 0, y: 0 },
      },
    ],
    openings: [
      {
        openingId: "opening-east-window",
        openingType: "window",
        attachedEdgeId: "room-atrium:edge:1",
        edgeRelativePosition: 0.25,
      },
    ],
  });
  assert.deepEqual(secondProjection, firstProjection);

  room.roomPolygon[1].x = 99;
  room.sharedBoundaries[0].adjacentRoomId = "room-mutated";
  room.edgeOpenings?.[0] && (room.edgeOpenings[0].edgeRelativePosition = 0.9);

  assert.deepEqual(firstProjection.roomPolygon[1], { x: 12, y: 0 });
  assert.equal(firstProjection.sharedBoundaries[0].adjacentRoomId, "room-gallery");
  assert.equal(firstProjection.openings?.[0].edgeRelativePosition, 0.25);
});

test("mapEditorFloorToRendererSnapshotFloor deterministically orders mapped rooms and vertical connectors without aliasing inputs", () => {
  const project = createEditorProject({
    projectId: "project-floor-mapping",
    floors: [
      {
        floorId: "floor-z",
        floorName: "Upper",
        floorHeight: 4.25,
        referenceImage: "floor-plan://project-floor-mapping/upper.png",
        rooms: [
          {
            roomId: "room-zeta",
            roomName: "Zeta",
            roomPolygon: [
              { x: 10, y: 0 },
              { x: 14, y: 0 },
              { x: 14, y: 4 },
              { x: 10, y: 4 },
            ],
          },
          {
            roomId: "room-alpha",
            roomName: "Alpha",
            roomPolygon: [
              { x: 0, y: 0 },
              { x: 6, y: 0 },
              { x: 6, y: 4 },
              { x: 0, y: 4 },
            ],
          },
        ],
        verticalConnectors: [
          {
            connectorId: "connector-z",
            connectorType: "stair",
            roomId: "room-zeta",
            targetFloorId: "floor-top",
            position: { x: 11, y: 1 },
          },
          {
            connectorId: "connector-a",
            connectorType: "elevator",
            roomId: "room-alpha",
            targetFloorId: "floor-lobby",
            position: { x: 2, y: 1.5 },
          },
        ],
      },
    ],
  });

  const floor = project.floors[0];
  const mappedRooms = [
    mapEditorRoomToRendererSnapshotRoom(floor.rooms[0]),
    mapEditorRoomToRendererSnapshotRoom(floor.rooms[1]),
  ];

  const mappedFloor = mapEditorFloorToRendererSnapshotFloor(floor, mappedRooms);

  assert.deepEqual(mappedFloor, {
    floorId: "floor-z",
    floorName: "Upper",
    floorHeight: 4.25,
    referenceImage: "floor-plan://project-floor-mapping/upper.png",
    rooms: [
      {
        roomId: "room-alpha",
        roomName: "Alpha",
        roomPolygon: [
          { x: 0, y: 0 },
          { x: 6, y: 0 },
          { x: 6, y: 4 },
          { x: 0, y: 4 },
        ],
        sharedBoundaries: [],
        area: 24,
        labelPosition: { x: 3, y: 2 },
        walls: [
          {
            edgeId: "room-alpha:edge:0",
            start: { x: 0, y: 0 },
            end: { x: 6, y: 0 },
          },
          {
            edgeId: "room-alpha:edge:1",
            start: { x: 6, y: 0 },
            end: { x: 6, y: 4 },
          },
          {
            edgeId: "room-alpha:edge:2",
            start: { x: 6, y: 4 },
            end: { x: 0, y: 4 },
          },
          {
            edgeId: "room-alpha:edge:3",
            start: { x: 0, y: 4 },
            end: { x: 0, y: 0 },
          },
        ],
        openings: [],
      },
      {
        roomId: "room-zeta",
        roomName: "Zeta",
        roomPolygon: [
          { x: 10, y: 0 },
          { x: 14, y: 0 },
          { x: 14, y: 4 },
          { x: 10, y: 4 },
        ],
        sharedBoundaries: [],
        area: 16,
        labelPosition: { x: 12, y: 2 },
        walls: [
          {
            edgeId: "room-zeta:edge:0",
            start: { x: 10, y: 0 },
            end: { x: 14, y: 0 },
          },
          {
            edgeId: "room-zeta:edge:1",
            start: { x: 14, y: 0 },
            end: { x: 14, y: 4 },
          },
          {
            edgeId: "room-zeta:edge:2",
            start: { x: 14, y: 4 },
            end: { x: 10, y: 4 },
          },
          {
            edgeId: "room-zeta:edge:3",
            start: { x: 10, y: 4 },
            end: { x: 10, y: 0 },
          },
        ],
        openings: [],
      },
    ],
    verticalConnectors: [
      {
        connectorId: "connector-a",
        connectorType: "elevator",
        roomId: "room-alpha",
        targetFloorId: "floor-lobby",
        position: { x: 2, y: 1.5 },
      },
      {
        connectorId: "connector-z",
        connectorType: "stair",
        roomId: "room-zeta",
        targetFloorId: "floor-top",
        position: { x: 11, y: 1 },
      },
    ],
  });

  assert.deepEqual(
    mappedFloor.rooms.map((room) => room.roomId),
    ["room-alpha", "room-zeta"],
  );
  assert.deepEqual(
    mappedFloor.verticalConnectors?.map((connector) => connector.connectorId),
    ["connector-a", "connector-z"],
  );

  mappedRooms[1].roomPolygon[0].x = 999;
  floor.verticalConnectors?.[0] && (floor.verticalConnectors[0].position.x = 999);

  assert.equal(mappedFloor.rooms[0].roomPolygon[0].x, 0);
  assert.equal(mappedFloor.verticalConnectors?.[1].position.x, 11);
});

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
