import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_FLOOR_HEIGHT,
  DEFAULT_FLOOR_NAME,
  DEFAULT_PROJECT_NAME,
  EDITOR_OBJECT_VERSION,
  addEditorRoom,
  addEditorFloor,
  calculatePolygonArea,
  calculatePolygonLabelPosition,
  createEditorFloor,
  createEditorProject,
  createEditorRoom,
  createEditorState,
  deriveRoomWallsFromPolygon,
  removeEditorRoom,
  removeEditorFloor,
  updateEditorRoom,
  updateEditorFloor,
  updateEditorProject,
} from "../src/domain/editor-state.ts";

test("createEditorRoom initializes polygon-based room state with derived metadata", () => {
  const room = createEditorRoom({
    roomId: "room-1",
    roomName: "Lobby",
    roomPolygon: [
      { x: 0, y: 0 },
      { x: 8, y: 0 },
      { x: 8, y: 4 },
      { x: 0, y: 4 },
    ],
    sharedBoundaries: [
      {
        edgeId: "room-1:east",
        roomId: "room-1",
        adjacentRoomId: "room-2",
        adjacentEdgeId: "room-2:west",
      },
    ],
  });

  assert.deepEqual(room, {
    roomId: "room-1",
    roomName: "Lobby",
    roomPolygon: [
      { x: 0, y: 0 },
      { x: 8, y: 0 },
      { x: 8, y: 4 },
      { x: 0, y: 4 },
    ],
    sharedBoundaries: [
      {
        edgeId: "room-1:east",
        roomId: "room-1",
        adjacentRoomId: "room-2",
        adjacentEdgeId: "room-2:west",
      },
    ],
    area: 32,
    labelPosition: {
      x: 4,
      y: 2,
    },
    openings: [],
  });
});

test("createEditorFloor applies defaults for floor metadata without rendering dependencies", () => {
  const floor = createEditorFloor({
    floorId: "floor-1",
  });

  assert.deepEqual(floor, {
    floorId: "floor-1",
    floorName: DEFAULT_FLOOR_NAME,
    floorHeight: DEFAULT_FLOOR_HEIGHT,
    referenceImage: null,
    rooms: [],
  });
});

test("createEditorFloor rejects non-positive or non-finite floor heights", () => {
  for (const floorHeight of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.throws(
      () =>
        createEditorFloor({
          floorId: `floor-${String(floorHeight)}`,
          floorHeight,
        }),
      /Floor height must be a positive finite number\./,
    );
  }
});

test("createEditorState builds a mutable cloned editor tree for project, floors, and rooms", () => {
  const input = {
    projectId: "project-alpha",
    projectName: "Alpha Tower",
    floors: [
      {
        floorId: "floor-1",
        floorName: "Ground Floor",
        rooms: [
          {
            roomId: "room-1",
            roomName: "Reception",
            roomPolygon: [
              { x: 0, y: 0 },
              { x: 6, y: 0 },
              { x: 6, y: 5 },
              { x: 0, y: 5 },
            ],
          },
        ],
      },
    ],
  } as const;

  const state = createEditorState(input);

  assert.deepEqual(state, {
    project: {
      projectId: "project-alpha",
      projectName: "Alpha Tower",
      objectVersion: EDITOR_OBJECT_VERSION,
      floors: [
        {
          floorId: "floor-1",
          floorName: "Ground Floor",
          floorHeight: DEFAULT_FLOOR_HEIGHT,
          referenceImage: null,
          rooms: [
            {
              roomId: "room-1",
              roomName: "Reception",
              roomPolygon: [
                { x: 0, y: 0 },
                { x: 6, y: 0 },
                { x: 6, y: 5 },
                { x: 0, y: 5 },
              ],
              sharedBoundaries: [],
              area: 30,
              labelPosition: {
                x: 3,
                y: 2.5,
              },
              openings: [],
            },
          ],
        },
      ],
      viewState: {
        activeFloorId: "floor-1",
        selectedRoomId: null,
      },
      exteriorPolygon: null,
      exteriorEdgeOpenings: [],
    },
  });

  state.project.floors[0].rooms[0].roomPolygon[0].x = 99;

  assert.equal(state.project.floors[0].rooms[0].roomPolygon[0].x, 99);
  assert.equal(input.floors[0].rooms[0].roomPolygon[0].x, 0);
});

test("createEditorState supplies safe defaults when optional project fields are omitted", () => {
  const state = createEditorState({
    projectId: "project-empty",
  });

  assert.deepEqual(state, {
    project: {
      projectId: "project-empty",
      projectName: DEFAULT_PROJECT_NAME,
      objectVersion: EDITOR_OBJECT_VERSION,
      floors: [],
      viewState: {
        activeFloorId: null,
        selectedRoomId: null,
      },
      exteriorPolygon: null,
      exteriorEdgeOpenings: [],
    },
  });
});

test("createEditorState can carry editor-domain metadata and guide objects independent of exports", () => {
  const state = createEditorState({
    projectId: "project-guide-model",
    projectName: "Guide Model",
    metadata: {
      authorName: "Facilities",
      notes: "Internal source model",
    },
    floors: [
      {
        floorId: "floor-1",
        metadata: {
          notes: "Surveyed from uploaded plan",
        },
        rooms: [
          {
            roomId: "room-1",
            roomPolygon: [
              { x: 0, y: 0 },
              { x: 10, y: 0 },
              { x: 10, y: 10 },
              { x: 0, y: 10 },
            ],
            edgeOpenings: [
              {
                openingId: "opening-1",
                openingType: "door",
                attachedEdgeId: "room-1:edge:1",
                edgeRelativePosition: 0.5,
              },
            ],
            metadata: {
              notes: "Primary editable room polygon",
            },
          },
        ],
        verticalConnectors: [
          {
            connectorId: "connector-stair-1",
            connectorType: "stair",
            roomId: "room-1",
            targetFloorId: "floor-2",
            position: { x: 2, y: 2 },
          },
        ],
        guideObjects: [
          {
            guideObjectId: "guide-object-info-1",
            guideObjectType: "point-of-interest",
            floorId: "floor-1",
            roomId: "room-1",
            name: "Information Desk",
            position: { x: 5, y: 5 },
          },
        ],
      },
    ],
  });

  assert.deepEqual(state.project.metadata, {
    authorName: "Facilities",
    notes: "Internal source model",
  });
  assert.deepEqual(state.project.floors[0].verticalConnectors, [
    {
      connectorId: "connector-stair-1",
      connectorType: "stair",
      roomId: "room-1",
      targetFloorId: "floor-2",
      position: { x: 2, y: 2 },
    },
  ]);
  assert.deepEqual(state.project.floors[0].guideObjects, [
    {
      guideObjectId: "guide-object-info-1",
      guideObjectType: "point-of-interest",
      floorId: "floor-1",
      roomId: "room-1",
      name: "Information Desk",
      position: { x: 5, y: 5 },
    },
  ]);
  assert.deepEqual(state.project.floors[0].rooms[0].edgeOpenings, [
    {
      openingId: "opening-1",
      openingType: "door",
      attachedEdgeId: "room-1:edge:1",
      edgeRelativePosition: 0.5,
    },
  ]);
});

test("deriveRoomWallsFromPolygon creates visual wall segments from room polygon edges", () => {
  const walls = deriveRoomWallsFromPolygon("room-1", [
    { x: 0, y: 0 },
    { x: 4, y: 0 },
    { x: 4, y: 3 },
    { x: 0, y: 0 },
  ]);

  assert.deepEqual(walls, [
    {
      edgeId: "room-1:edge:0",
      start: { x: 0, y: 0 },
      end: { x: 4, y: 0 },
    },
    {
      edgeId: "room-1:edge:1",
      start: { x: 4, y: 0 },
      end: { x: 4, y: 3 },
    },
    {
      edgeId: "room-1:edge:2",
      start: { x: 4, y: 3 },
      end: { x: 0, y: 0 },
    },
  ]);
});

test("createEditorState falls back to the first floor when the requested active floor is missing", () => {
  const state = createEditorState({
    projectId: "project-beta",
    floors: [
      {
        floorId: "floor-a",
      },
      {
        floorId: "floor-b",
      },
    ],
    viewState: {
      activeFloorId: "missing-floor",
      selectedRoomId: "room-2",
    },
  });

  assert.equal(state.project.viewState.activeFloorId, "floor-a");
  assert.equal(state.project.viewState.selectedRoomId, "room-2");
});

test("updateEditorProject updates project metadata without mutating floor collections", () => {
  const project = createEditorProject({
    projectId: "project-alpha",
    projectName: "Alpha Tower",
    floors: [
      {
        floorId: "floor-1",
        floorName: "Ground Floor",
      },
    ],
    viewState: {
      activeFloorId: "floor-1",
      selectedRoomId: "room-1",
    },
  });

  const nextProject = updateEditorProject(project, {
    projectName: "Alpha Tower Updated",
    objectVersion: 2,
  });

  assert.equal(nextProject.projectName, "Alpha Tower Updated");
  assert.equal(nextProject.objectVersion, 2);
  assert.equal(nextProject.floors[0], project.floors[0]);
  assert.deepEqual(nextProject.viewState, project.viewState);
});

test("updateEditorProject repairs an invalid active floor and clears stale selection", () => {
  const project = createEditorProject({
    projectId: "project-beta",
    floors: [
      {
        floorId: "floor-1",
      },
      {
        floorId: "floor-2",
      },
    ],
    viewState: {
      activeFloorId: "floor-2",
      selectedRoomId: "room-2",
    },
  });

  const nextProject = updateEditorProject(project, {
    viewState: {
      activeFloorId: "missing-floor",
    },
  });

  assert.equal(nextProject.viewState.activeFloorId, "floor-1");
  assert.equal(nextProject.viewState.selectedRoomId, null);
});

test("addEditorFloor appends a new floor and activates it for an empty project", () => {
  const project = createEditorProject({
    projectId: "project-empty",
  });

  const nextProject = addEditorFloor(project, {
    floorId: "floor-1",
    floorName: "Ground Floor",
  });

  assert.deepEqual(nextProject.floors, [
    {
      floorId: "floor-1",
      floorName: "Ground Floor",
      floorHeight: DEFAULT_FLOOR_HEIGHT,
      referenceImage: null,
      rooms: [],
    },
  ]);
  assert.equal(nextProject.viewState.activeFloorId, "floor-1");
  assert.equal(nextProject.viewState.selectedRoomId, null);
});

test("addEditorFloor preserves the current active floor in a populated project", () => {
  const project = createEditorProject({
    projectId: "project-populated",
    floors: [
      {
        floorId: "floor-1",
        floorName: "Ground Floor",
      },
    ],
    viewState: {
      activeFloorId: "floor-1",
      selectedRoomId: "room-1",
    },
  });

  const nextProject = addEditorFloor(project, {
    floorId: "floor-2",
    floorName: "Second Floor",
    floorHeight: 4.5,
    referenceImage: "floor-plan://project-populated/floor-2/second.png",
  });

  assert.equal(nextProject.floors.length, 2);
  assert.deepEqual(nextProject.floors[1], {
    floorId: "floor-2",
    floorName: "Second Floor",
    floorHeight: 4.5,
    referenceImage: "floor-plan://project-populated/floor-2/second.png",
    rooms: [],
  });
  assert.equal(nextProject.viewState.activeFloorId, "floor-1");
  assert.equal(nextProject.viewState.selectedRoomId, "room-1");
  assert.equal(nextProject.floors[0], project.floors[0]);
});

test("addEditorFloor rejects duplicate floor ids to keep floor collections consistent", () => {
  const project = createEditorProject({
    projectId: "project-duplicate",
    floors: [
      {
        floorId: "floor-1",
      },
    ],
  });

  assert.throws(
    () =>
      addEditorFloor(project, {
        floorId: "floor-1",
      }),
    /already exists/,
  );
});

test("updateEditorFloor updates only the targeted floor metadata", () => {
  const project = createEditorProject({
    projectId: "project-update-floor",
    floors: [
      {
        floorId: "floor-1",
        floorName: "Ground Floor",
      },
      {
        floorId: "floor-2",
        floorName: "Second Floor",
        floorHeight: 4,
        referenceImage: "floor-plan://project-update-floor/floor-2/source.png",
      },
    ],
    viewState: {
      activeFloorId: "floor-1",
      selectedRoomId: "room-1",
    },
  });

  const nextProject = updateEditorFloor(project, "floor-2", {
    floorName: "Mezzanine",
    floorHeight: 5.25,
    referenceImage: null,
  });

  assert.equal(nextProject.floors[0], project.floors[0]);
  assert.notEqual(nextProject.floors[1], project.floors[1]);
  assert.deepEqual(nextProject.floors[1], {
    floorId: "floor-2",
    floorName: "Mezzanine",
    floorHeight: 5.25,
    referenceImage: null,
    rooms: [],
  });
  assert.deepEqual(nextProject.viewState, project.viewState);
});

test("updateEditorFloor rejects non-positive or non-finite floor heights", () => {
  const project = createEditorProject({
    projectId: "project-invalid-floor-height",
    floors: [
      {
        floorId: "floor-1",
        floorHeight: 3,
      },
    ],
  });

  for (const floorHeight of [0, -1, Number.NaN, Number.NEGATIVE_INFINITY]) {
    assert.throws(
      () => updateEditorFloor(project, "floor-1", { floorHeight }),
      /Floor height must be a positive finite number\./,
    );
  }

  assert.equal(project.floors[0].floorHeight, 3);
});

test("removeEditorFloor removes an inactive floor without disturbing the active floor", () => {
  const project = createEditorProject({
    projectId: "project-remove-inactive",
    floors: [
      {
        floorId: "floor-1",
      },
      {
        floorId: "floor-2",
      },
      {
        floorId: "floor-3",
      },
    ],
    viewState: {
      activeFloorId: "floor-2",
      selectedRoomId: "room-2",
    },
  });

  const nextProject = removeEditorFloor(project, "floor-1");

  assert.deepEqual(
    nextProject.floors.map((floor) => floor.floorId),
    ["floor-2", "floor-3"],
  );
  assert.equal(nextProject.viewState.activeFloorId, "floor-2");
  assert.equal(nextProject.viewState.selectedRoomId, "room-2");
});

test("removeEditorFloor reassigns the active floor and clears selection when needed", () => {
  const project = createEditorProject({
    projectId: "project-remove-active",
    floors: [
      {
        floorId: "floor-1",
      },
      {
        floorId: "floor-2",
      },
    ],
    viewState: {
      activeFloorId: "floor-2",
      selectedRoomId: "room-2",
    },
  });

  const nextProject = removeEditorFloor(project, "floor-2");

  assert.deepEqual(
    nextProject.floors.map((floor) => floor.floorId),
    ["floor-1"],
  );
  assert.equal(nextProject.viewState.activeFloorId, "floor-1");
  assert.equal(nextProject.viewState.selectedRoomId, null);
});

test("removeEditorFloor supports removing the last remaining floor", () => {
  const project = createEditorProject({
    projectId: "project-single-floor",
    floors: [
      {
        floorId: "floor-1",
      },
    ],
    viewState: {
      activeFloorId: "floor-1",
      selectedRoomId: "room-1",
    },
  });

  const nextProject = removeEditorFloor(project, "floor-1");

  assert.deepEqual(nextProject.floors, []);
  assert.equal(nextProject.viewState.activeFloorId, null);
  assert.equal(nextProject.viewState.selectedRoomId, null);
});

test("floor mutation helpers reject missing floor ids", () => {
  const project = createEditorProject({
    projectId: "project-missing-floor",
    floors: [
      {
        floorId: "floor-1",
      },
    ],
  });

  assert.throws(
    () =>
      updateEditorFloor(project, "missing-floor", {
        floorName: "Nowhere",
      }),
    /was not found/,
  );
  assert.throws(
    () => removeEditorFloor(project, "missing-floor"),
    /was not found/,
  );
});

test("addEditorRoom appends a derived room only to the targeted floor", () => {
  const project = createEditorProject({
    projectId: "project-add-room",
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
              { x: 4, y: 4 },
              { x: 0, y: 4 },
            ],
          },
        ],
      },
      {
        floorId: "floor-2",
      },
    ],
    viewState: {
      activeFloorId: "floor-1",
      selectedRoomId: "room-1",
    },
  });

  const nextProject = addEditorRoom(project, "floor-2", {
    roomId: "room-2",
    roomName: "Cafe",
    roomPolygon: [
      { x: 0, y: 0 },
      { x: 5, y: 0 },
      { x: 5, y: 2 },
      { x: 0, y: 2 },
    ],
  });

  assert.equal(nextProject.floors[0], project.floors[0]);
  assert.notEqual(nextProject.floors[1], project.floors[1]);
  assert.equal(nextProject.floors[1].rooms.length, 1);
  assert.deepEqual(nextProject.floors[1].rooms[0], {
    roomId: "room-2",
    roomName: "Cafe",
    roomPolygon: [
      { x: 0, y: 0 },
      { x: 5, y: 0 },
      { x: 5, y: 2 },
      { x: 0, y: 2 },
    ],
    sharedBoundaries: [],
    area: 10,
    labelPosition: {
      x: 2.5,
      y: 1,
    },
    openings: [],
  });
  assert.deepEqual(nextProject.viewState, project.viewState);
});

test("addEditorRoom rejects duplicate room ids across floors to preserve ownership", () => {
  const project = createEditorProject({
    projectId: "project-duplicate-room",
    floors: [
      {
        floorId: "floor-1",
        rooms: [
          {
            roomId: "room-1",
          },
        ],
      },
      {
        floorId: "floor-2",
      },
    ],
  });

  assert.throws(
    () =>
      addEditorRoom(project, "floor-2", {
        roomId: "room-1",
      }),
    /already exists/,
  );
});

test("updateEditorRoom recalculates derived metadata only for the edited room when no shared edge is affected", () => {
  const project = createEditorProject({
    projectId: "project-update-room",
    floors: [
      {
        floorId: "floor-1",
        rooms: [
          {
            roomId: "room-1",
            roomName: "Reception",
            roomPolygon: [
              { x: 0, y: 0 },
              { x: 4, y: 0 },
              { x: 4, y: 4 },
              { x: 0, y: 4 },
            ],
            sharedBoundaries: [],
          },
          {
            roomId: "room-2",
            roomName: "Office",
            roomPolygon: [
              { x: 10, y: 0 },
              { x: 14, y: 0 },
              { x: 14, y: 4 },
              { x: 10, y: 4 },
            ],
          },
        ],
      },
    ],
  });

  const nextProject = updateEditorRoom(project, "floor-1", "room-1", {
    roomName: "Reception Updated",
    roomPolygon: [
      { x: 0, y: 0 },
      { x: 6, y: 0 },
      { x: 6, y: 3 },
      { x: 0, y: 3 },
    ],
  });

  assert.notEqual(nextProject.floors[0], project.floors[0]);
  assert.notEqual(nextProject.floors[0].rooms[0], project.floors[0].rooms[0]);
  assert.equal(nextProject.floors[0].rooms[1], project.floors[0].rooms[1]);
  assert.deepEqual(nextProject.floors[0].rooms[0], {
    roomId: "room-1",
    roomName: "Reception Updated",
    roomPolygon: [
      { x: 0, y: 0 },
      { x: 6, y: 0 },
      { x: 6, y: 3 },
      { x: 0, y: 3 },
    ],
    sharedBoundaries: [],
    area: 18,
    labelPosition: {
      x: 3,
      y: 1.5,
    },
    openings: [],
  });
});

test("updateEditorRoom mirrors a moved shared-boundary vertex into the exactly adjacent room", () => {
  const project = createEditorProject({
    projectId: "project-shared-boundary-sync",
    floors: [
      {
        floorId: "floor-1",
        rooms: [
          {
            roomId: "room-1",
            roomName: "Reception",
            roomPolygon: [
              { x: 0, y: 0 },
              { x: 4, y: 0 },
              { x: 4, y: 4 },
              { x: 0, y: 4 },
            ],
            sharedBoundaries: [
              {
                edgeId: "room-1:east",
                roomId: "room-1",
                adjacentRoomId: "room-2",
                adjacentEdgeId: "room-2:west",
              },
            ],
          },
          {
            roomId: "room-2",
            roomName: "Office",
            roomPolygon: [
              { x: 4, y: 0 },
              { x: 8, y: 0 },
              { x: 8, y: 4 },
              { x: 4, y: 4 },
            ],
            sharedBoundaries: [
              {
                edgeId: "room-2:west",
                roomId: "room-2",
                adjacentRoomId: "room-1",
                adjacentEdgeId: "room-1:east",
              },
            ],
          },
        ],
      },
    ],
  });

  const nextProject = updateEditorRoom(project, "floor-1", "room-1", {
    roomPolygon: [
      { x: 0, y: 0 },
      { x: 5, y: 1 },
      { x: 4, y: 4 },
      { x: 0, y: 4 },
    ],
  });

  assert.deepEqual(nextProject.floors[0].rooms[0].roomPolygon, [
    { x: 0, y: 0 },
    { x: 5, y: 1 },
    { x: 4, y: 4 },
    { x: 0, y: 4 },
  ]);
  assert.deepEqual(nextProject.floors[0].rooms[1].roomPolygon, [
    { x: 5, y: 1 },
    { x: 8, y: 0 },
    { x: 8, y: 4 },
    { x: 4, y: 4 },
  ]);
  assert.equal(nextProject.floors[0].rooms[1].area, 12);
  assert.deepEqual(nextProject.floors[0].rooms[1].labelPosition, {
    x: 6.25,
    y: 2.25,
  });
  assert.deepEqual(project.floors[0].rooms[1].roomPolygon, [
    { x: 4, y: 0 },
    { x: 8, y: 0 },
    { x: 8, y: 4 },
    { x: 4, y: 4 },
  ]);
});

test("updateEditorRoom preserves room openings while dragging polygon vertices", () => {
  const project = createEditorProject({
    projectId: "project-room-vertex-opening-preservation",
    floors: [
      {
        floorId: "floor-1",
        rooms: [
          {
            roomId: "room-1",
            roomName: "Reception",
            roomPolygon: [
              { x: 0, y: 0 },
              { x: 4, y: 0 },
              { x: 4, y: 4 },
              { x: 0, y: 4 },
            ],
            openings: [
              {
                id: "opening-1",
                type: "door",
                x: 2,
                y: 0,
                angle: 0,
              },
            ],
            edgeOpenings: [
              {
                openingId: "edge-opening-1",
                openingType: "door",
                attachedEdgeId: "room-1:north",
                edgeRelativePosition: 0.5,
              },
            ],
          },
        ],
      },
    ],
  });

  const nextProject = updateEditorRoom(project, "floor-1", "room-1", {
    roomPolygon: [
      { x: 0, y: 0 },
      { x: 5, y: 1 },
      { x: 4, y: 4 },
      { x: 0, y: 4 },
    ],
  });

  assert.deepEqual(nextProject.floors[0].rooms[0].openings, [
    {
      id: "opening-1",
      type: "door",
      x: 2,
      y: 0,
      angle: 0,
    },
  ]);
  assert.deepEqual(nextProject.floors[0].rooms[0].edgeOpenings, [
    {
      openingId: "edge-opening-1",
      openingType: "door",
      attachedEdgeId: "room-1:north",
      edgeRelativePosition: 0.5,
    },
  ]);
  assert.notEqual(
    nextProject.floors[0].rooms[0].openings,
    project.floors[0].rooms[0].openings,
  );
});

test("updateEditorRoom can persist translated room openings during whole-room polygon moves", () => {
  const project = createEditorProject({
    projectId: "project-room-drag-opening-translation",
    floors: [
      {
        floorId: "floor-1",
        rooms: [
          {
            roomId: "room-1",
            roomName: "Reception",
            roomPolygon: [
              { x: 0, y: 0 },
              { x: 4, y: 0 },
              { x: 4, y: 4 },
              { x: 0, y: 4 },
            ],
            openings: [
              {
                id: "opening-1",
                type: "door",
                x: 2,
                y: 0,
                angle: 0,
              },
            ],
            edgeOpenings: [
              {
                openingId: "edge-opening-1",
                openingType: "door",
                attachedEdgeId: "room-1:north",
                edgeRelativePosition: 0.5,
              },
            ],
          },
        ],
      },
    ],
  });

  const nextProject = updateEditorRoom(project, "floor-1", "room-1", {
    roomPolygon: [
      { x: 10, y: -4 },
      { x: 14, y: -4 },
      { x: 14, y: 0 },
      { x: 10, y: 0 },
    ],
    openings: [
      {
        id: "opening-1",
        type: "door",
        x: 12,
        y: -4,
        angle: 0,
      },
    ],
  });

  assert.equal(nextProject.floors[0].rooms[0].area, 16);
  assert.deepEqual(nextProject.floors[0].rooms[0].labelPosition, {
    x: 12,
    y: -2,
  });
  assert.deepEqual(nextProject.floors[0].rooms[0].openings, [
    {
      id: "opening-1",
      type: "door",
      x: 12,
      y: -4,
      angle: 0,
    },
  ]);
  assert.deepEqual(nextProject.floors[0].rooms[0].edgeOpenings, [
    {
      openingId: "edge-opening-1",
      openingType: "door",
      attachedEdgeId: "room-1:north",
      edgeRelativePosition: 0.5,
    },
  ]);
});

test("updateEditorRoom keeps a moved shared segment geometrically identical in both adjacent rooms", () => {
  const project = createEditorProject({
    projectId: "project-shared-segment-sync",
    floors: [
      {
        floorId: "floor-1",
        rooms: [
          {
            roomId: "room-1",
            roomName: "Reception",
            roomPolygon: [
              { x: 0, y: 0 },
              { x: 4, y: 0 },
              { x: 4, y: 4 },
              { x: 0, y: 4 },
            ],
            sharedBoundaries: [
              {
                edgeId: "room-1:east",
                roomId: "room-1",
                adjacentRoomId: "room-2",
                adjacentEdgeId: "room-2:west",
              },
            ],
          },
          {
            roomId: "room-2",
            roomName: "Office",
            roomPolygon: [
              { x: 4, y: 0 },
              { x: 8, y: 0 },
              { x: 8, y: 4 },
              { x: 4, y: 4 },
            ],
            sharedBoundaries: [
              {
                edgeId: "room-2:west",
                roomId: "room-2",
                adjacentRoomId: "room-1",
                adjacentEdgeId: "room-1:east",
              },
            ],
          },
        ],
      },
    ],
  });

  const nextProject = updateEditorRoom(project, "floor-1", "room-1", {
    roomPolygon: [
      { x: 0, y: 0 },
      { x: 5, y: 1 },
      { x: 5, y: 5 },
      { x: 0, y: 4 },
    ],
  });

  assert.deepEqual(nextProject.floors[0].rooms[0].roomPolygon.slice(1, 3), [
    { x: 5, y: 1 },
    { x: 5, y: 5 },
  ]);
  assert.deepEqual(nextProject.floors[0].rooms[1].roomPolygon[0], {
    x: 5,
    y: 1,
  });
  assert.deepEqual(nextProject.floors[0].rooms[1].roomPolygon[3], {
    x: 5,
    y: 5,
  });
  assert.deepEqual(
    [
      nextProject.floors[0].rooms[1].roomPolygon[3],
      nextProject.floors[0].rooms[1].roomPolygon[0],
    ],
    nextProject.floors[0].rooms[0].roomPolygon.slice(1, 3).reverse(),
  );
  assert.equal(nextProject.floors[0].rooms[1].area, 12);
  assert.deepEqual(nextProject.floors[0].rooms[1].labelPosition, {
    x: 6.5,
    y: 2.5,
  });
});

test("updateEditorRoom mirrors an inserted shared-boundary vertex into the adjacent room", () => {
  const project = createEditorProject({
    projectId: "project-shared-edge-insert",
    floors: [
      {
        floorId: "floor-1",
        rooms: [
          {
            roomId: "room-1",
            roomName: "Reception",
            roomPolygon: [
              { x: 0, y: 0 },
              { x: 4, y: 0 },
              { x: 4, y: 4 },
              { x: 0, y: 4 },
            ],
            sharedBoundaries: [
              {
                edgeId: "room-1:east",
                roomId: "room-1",
                adjacentRoomId: "room-2",
                adjacentEdgeId: "room-2:west",
              },
            ],
            edgeOpenings: [
              {
                openingId: "door-before-insert",
                openingType: "door",
                attachedEdgeId: "room-1:edge:1",
                edgeRelativePosition: 0.25,
              },
              {
                openingId: "window-after-insert",
                openingType: "window",
                attachedEdgeId: "room-1:edge:2",
                edgeRelativePosition: 0.5,
              },
            ],
          },
          {
            roomId: "room-2",
            roomName: "Office",
            roomPolygon: [
              { x: 4, y: 0 },
              { x: 8, y: 0 },
              { x: 8, y: 4 },
              { x: 4, y: 4 },
            ],
            sharedBoundaries: [
              {
                edgeId: "room-2:west",
                roomId: "room-2",
                adjacentRoomId: "room-1",
                adjacentEdgeId: "room-1:east",
              },
            ],
            edgeOpenings: [
              {
                openingId: "adjacent-door",
                openingType: "door",
                attachedEdgeId: "room-2:edge:3",
                edgeRelativePosition: 0.25,
              },
            ],
          },
        ],
      },
    ],
  });

  const nextProject = updateEditorRoom(project, "floor-1", "room-1", {
    roomPolygon: [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 4, y: 2 },
      { x: 4, y: 4 },
      { x: 0, y: 4 },
    ],
  });

  assert.deepEqual(nextProject.floors[0].rooms[1].roomPolygon, [
    { x: 4, y: 0 },
    { x: 8, y: 0 },
    { x: 8, y: 4 },
    { x: 4, y: 4 },
    { x: 4, y: 2 },
  ]);
  assert.deepEqual(nextProject.floors[0].rooms[0].edgeOpenings, [
    {
      openingId: "door-before-insert",
      openingType: "door",
      attachedEdgeId: "room-1:edge:1",
      edgeRelativePosition: 0.5,
    },
    {
      openingId: "window-after-insert",
      openingType: "window",
      attachedEdgeId: "room-1:edge:3",
      edgeRelativePosition: 0.5,
    },
  ]);
  assert.deepEqual(nextProject.floors[0].rooms[1].edgeOpenings, [
    {
      openingId: "adjacent-door",
      openingType: "door",
      attachedEdgeId: "room-2:edge:3",
      edgeRelativePosition: 0.5,
    },
  ]);
  assert.equal(nextProject.floors[0].rooms[0].area, 16);
  assert.equal(nextProject.floors[0].rooms[1].area, 16);
  assert.deepEqual(project.floors[0].rooms[1].roomPolygon, [
    { x: 4, y: 0 },
    { x: 8, y: 0 },
    { x: 8, y: 4 },
    { x: 4, y: 4 },
  ]);
});

test("updateEditorRoom mirrors a removed shared-boundary vertex into the adjacent room", () => {
  const project = createEditorProject({
    projectId: "project-shared-edge-delete",
    floors: [
      {
        floorId: "floor-1",
        rooms: [
          {
            roomId: "room-1",
            roomName: "Reception",
            roomPolygon: [
              { x: 0, y: 0 },
              { x: 4, y: 0 },
              { x: 4, y: 2 },
              { x: 4, y: 4 },
              { x: 0, y: 4 },
            ],
            sharedBoundaries: [
              {
                edgeId: "room-1:east",
                roomId: "room-1",
                adjacentRoomId: "room-2",
                adjacentEdgeId: "room-2:west",
              },
            ],
          },
          {
            roomId: "room-2",
            roomName: "Office",
            roomPolygon: [
              { x: 4, y: 0 },
              { x: 8, y: 0 },
              { x: 8, y: 4 },
              { x: 4, y: 4 },
              { x: 4, y: 2 },
            ],
            sharedBoundaries: [
              {
                edgeId: "room-2:west",
                roomId: "room-2",
                adjacentRoomId: "room-1",
                adjacentEdgeId: "room-1:east",
              },
            ],
          },
        ],
      },
    ],
  });

  const nextProject = updateEditorRoom(project, "floor-1", "room-1", {
    roomPolygon: [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 4, y: 4 },
      { x: 0, y: 4 },
    ],
  });

  assert.deepEqual(nextProject.floors[0].rooms[1].roomPolygon, [
    { x: 4, y: 0 },
    { x: 8, y: 0 },
    { x: 8, y: 4 },
    { x: 4, y: 4 },
  ]);
  assert.equal(nextProject.floors[0].rooms[0].area, 16);
  assert.equal(nextProject.floors[0].rooms[1].area, 16);
});

test("updateEditorRoom updates only declared shared-vertex rooms and preserves untouched adjacent geometry", () => {
  const project = createEditorProject({
    projectId: "project-declared-shared-vertex-only",
    floors: [
      {
        floorId: "floor-1",
        rooms: [
          {
            roomId: "room-1",
            roomName: "Reception",
            roomPolygon: [
              { x: 0, y: 0 },
              { x: 4, y: 0 },
              { x: 4, y: 4 },
              { x: 0, y: 4 },
            ],
            sharedBoundaries: [
              {
                edgeId: "room-1:east",
                roomId: "room-1",
                adjacentRoomId: "room-2",
                adjacentEdgeId: "room-2:west",
              },
            ],
          },
          {
            roomId: "room-2",
            roomName: "Office",
            roomPolygon: [
              { x: 4, y: 0 },
              { x: 8, y: 0 },
              { x: 8, y: 4 },
              { x: 4, y: 4 },
            ],
            sharedBoundaries: [
              {
                edgeId: "room-2:west",
                roomId: "room-2",
                adjacentRoomId: "room-1",
                adjacentEdgeId: "room-1:east",
              },
            ],
          },
          {
            roomId: "room-3",
            roomName: "Storage",
            roomPolygon: [
              { x: 10, y: 0 },
              { x: 14, y: 0 },
              { x: 14, y: 4 },
              { x: 10, y: 4 },
            ],
            sharedBoundaries: [],
          },
        ],
      },
    ],
  });

  const untouchedSourceVertices = [
    project.floors[0].rooms[0].roomPolygon[0],
    project.floors[0].rooms[0].roomPolygon[3],
  ];
  const untouchedAdjacentVertices = [
    project.floors[0].rooms[1].roomPolygon[1],
    project.floors[0].rooms[1].roomPolygon[2],
    project.floors[0].rooms[1].roomPolygon[3],
  ];
  const untouchedAdjacentEdge = project.floors[0].rooms[1].roomPolygon.slice(1, 3);
  const untouchedThirdRoomPolygon = project.floors[0].rooms[2].roomPolygon;

  const nextProject = updateEditorRoom(project, "floor-1", "room-1", {
    roomPolygon: [
      { x: 0, y: 0 },
      { x: 5, y: 1 },
      { x: 4, y: 4 },
      { x: 0, y: 4 },
    ],
  });

  assert.deepEqual(
    [nextProject.floors[0].rooms[0].roomPolygon[0], nextProject.floors[0].rooms[0].roomPolygon[3]],
    untouchedSourceVertices,
  );
  assert.deepEqual(
    [
      nextProject.floors[0].rooms[1].roomPolygon[1],
      nextProject.floors[0].rooms[1].roomPolygon[2],
      nextProject.floors[0].rooms[1].roomPolygon[3],
    ],
    untouchedAdjacentVertices,
  );
  assert.deepEqual(
    nextProject.floors[0].rooms[1].roomPolygon.slice(1, 3),
    untouchedAdjacentEdge,
  );
  assert.deepEqual(
    nextProject.floors[0].rooms[2].roomPolygon,
    untouchedThirdRoomPolygon,
  );
  assert.deepEqual(nextProject.floors[0].rooms[1].roomPolygon[0], {
    x: 5,
    y: 1,
  });
  assert.equal(nextProject.floors[0].rooms[2], project.floors[0].rooms[2]);
});

test("updateEditorRoom does not propagate a moved edge when more than one adjacent room matches it", () => {
  const project = createEditorProject({
    projectId: "project-ambiguous-shared-segment",
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
          {
            roomId: "room-2",
            roomPolygon: [
              { x: 4, y: 0 },
              { x: 8, y: 0 },
              { x: 8, y: 4 },
              { x: 4, y: 4 },
            ],
          },
          {
            roomId: "room-3",
            roomPolygon: [
              { x: 8, y: 4 },
              { x: 4, y: 4 },
              { x: 4, y: 0 },
              { x: 8, y: 0 },
            ],
          },
        ],
      },
    ],
  });

  const nextProject = updateEditorRoom(project, "floor-1", "room-1", {
    roomPolygon: [
      { x: 0, y: 0 },
      { x: 5, y: 1 },
      { x: 5, y: 5 },
      { x: 0, y: 4 },
    ],
  });

  assert.equal(nextProject.floors[0].rooms[1], project.floors[0].rooms[1]);
  assert.equal(nextProject.floors[0].rooms[2], project.floors[0].rooms[2]);
});

test("updateEditorRoom leaves non-shared vertices in adjacent rooms untouched", () => {
  const project = createEditorProject({
    projectId: "project-non-shared-vertex",
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
          {
            roomId: "room-2",
            roomPolygon: [
              { x: 4, y: 0 },
              { x: 8, y: 0 },
              { x: 8, y: 4 },
              { x: 4, y: 4 },
            ],
          },
        ],
      },
    ],
  });

  const nextProject = updateEditorRoom(project, "floor-1", "room-1", {
    roomPolygon: [
      { x: -1, y: -1 },
      { x: 4, y: 0 },
      { x: 4, y: 4 },
      { x: 0, y: 4 },
    ],
  });

  assert.equal(nextProject.floors[0].rooms[1], project.floors[0].rooms[1]);
});

test("removeEditorRoom removes only the owning floor room and clears stale selection", () => {
  const project = createEditorProject({
    projectId: "project-remove-room",
    floors: [
      {
        floorId: "floor-1",
        rooms: [
          {
            roomId: "room-1",
          },
          {
            roomId: "room-2",
          },
        ],
      },
      {
        floorId: "floor-2",
        rooms: [
          {
            roomId: "room-3",
          },
        ],
      },
    ],
    viewState: {
      activeFloorId: "floor-1",
      selectedRoomId: "room-2",
    },
  });

  const nextProject = removeEditorRoom(project, "floor-1", "room-2");

  assert.deepEqual(
    nextProject.floors[0].rooms.map((room) => room.roomId),
    ["room-1"],
  );
  assert.equal(nextProject.floors[1], project.floors[1]);
  assert.equal(nextProject.viewState.activeFloorId, "floor-1");
  assert.equal(nextProject.viewState.selectedRoomId, null);
});

test("room mutation helpers enforce floor ownership and missing room failures", () => {
  const project = createEditorProject({
    projectId: "project-room-ownership",
    floors: [
      {
        floorId: "floor-1",
        rooms: [
          {
            roomId: "room-1",
          },
        ],
      },
      {
        floorId: "floor-2",
      },
    ],
  });

  assert.throws(
    () =>
      updateEditorRoom(project, "floor-2", "room-1", {
        roomName: "Moved",
      }),
    /was not found on floor "floor-2"/,
  );
  assert.throws(
    () => removeEditorRoom(project, "floor-2", "room-1"),
    /was not found on floor "floor-2"/,
  );
  assert.throws(
    () =>
      addEditorRoom(project, "missing-floor", {
        roomId: "room-2",
      }),
    /Floor "missing-floor" was not found/,
  );
});

test("polygon helpers handle incomplete or empty geometry predictably", () => {
  assert.equal(
    calculatePolygonArea([
      { x: 0, y: 0 },
      { x: 3, y: 0 },
    ]),
    0,
  );
  assert.equal(calculatePolygonLabelPosition([]), null);
});
