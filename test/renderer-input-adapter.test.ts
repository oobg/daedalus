import assert from "node:assert/strict";
import test from "node:test";

import {
  adaptProjectSnapshotToRenderScene,
  type RendererSnapshotProject,
} from "../src/features/renderer/index.ts";

test("adaptProjectSnapshotToRenderScene clones editor snapshot data into render-ready floor scenes", () => {
  const project: RendererSnapshotProject = {
    projectId: "project-atlas",
    projectName: "Atlas Center",
    objectVersion: 3,
    floors: [
      {
        floorId: "floor-1",
        floorName: "Ground",
        floorHeight: 3.5,
        referenceImage: "floor-plan://project-atlas/floor-1.png",
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
            sharedBoundaries: [
              {
                edgeId: "edge-lobby-east",
                adjacentRoomId: "room-gallery",
                adjacentEdgeId: "edge-gallery-west",
              },
            ],
            area: 48,
            labelPosition: { x: 4, y: 3 },
            walls: [
              {
                edgeId: "edge-lobby-east",
                start: { x: 8, y: 0 },
                end: { x: 8, y: 6 },
              },
            ],
            openings: [
              {
                openingId: "opening-lobby-door",
                openingType: "door",
                attachedEdgeId: "edge-lobby-east",
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
            targetFloorId: "floor-2",
            position: { x: 2, y: 1 },
          },
        ],
      },
      {
        floorId: "floor-2",
        floorName: "Upper",
        floorHeight: 4,
        referenceImage: null,
        rooms: [
          {
            roomId: "room-gallery",
            roomName: "Gallery",
            roomPolygon: [
              { x: 0, y: 0 },
              { x: 6, y: 0 },
              { x: 6, y: 4 },
              { x: 0, y: 4 },
              { x: 0, y: 0 },
            ],
            sharedBoundaries: [],
            area: 24,
            labelPosition: { x: 3, y: 2 },
          },
        ],
      },
    ],
    viewState: {
      activeFloorId: "floor-2",
      selectedRoomId: "room-gallery",
    },
  };

  const scene = adaptProjectSnapshotToRenderScene(project);

  assert.deepEqual(scene, {
    projectId: "project-atlas",
    projectName: "Atlas Center",
    objectVersion: 3,
    activeFloorId: "floor-2",
    selectedRoomId: "room-gallery",
    floors: [
      {
        floorId: "floor-1",
        floorName: "Ground",
        floorHeight: 3.5,
        verticalOffset: 0,
        renderHeight: 1.05,
        renderVerticalOffset: 0,
        referenceImage: "floor-plan://project-atlas/floor-1.png",
        isActive: false,
        rooms: [
          {
            roomId: "room-lobby",
            roomName: "Lobby",
            polygon: [
              { x: 0, y: 0 },
              { x: 8, y: 0 },
              { x: 8, y: 6 },
              { x: 0, y: 6 },
              { x: 0, y: 0 },
            ],
            boundaries: [
              {
                edgeId: "edge-lobby-east",
                adjacentRoomId: "room-gallery",
                adjacentEdgeId: "edge-gallery-west",
              },
            ],
            area: 48,
            labelPosition: { x: 4, y: 3 },
            bounds: {
              minX: 0,
              minY: 0,
              maxX: 8,
              maxY: 6,
            },
            layers: {
              floor: {
                elementClass: "floor",
                order: 0,
                baseElevation: -0.01575,
              },
              furniture: {
                elementClass: "furniture",
                order: 1,
                baseElevation: -0.00175,
              },
              wall: {
                elementClass: "wall",
                order: 2,
                baseElevation: 0.014,
              },
            },
            walls: [
              {
                edgeId: "edge-lobby-east",
                start: { x: 8, y: 0 },
                end: { x: 8, y: 6 },
              },
            ],
            openings: [
              {
                openingId: "opening-lobby-door",
                openingType: "door",
                attachedEdgeId: "edge-lobby-east",
                edgeRelativePosition: 0.5,
                anchor: { x: 8, y: 3 },
              },
            ],
          },
        ],
        verticalConnectors: [
          {
            connectorId: "connector-stair-1",
            connectorType: "stair",
            roomId: "room-lobby",
            targetFloorId: "floor-2",
            position: { x: 2, y: 1 },
          },
        ],
      },
      {
        floorId: "floor-2",
        floorName: "Upper",
        floorHeight: 4,
        verticalOffset: 3.5,
        renderHeight: 1.2,
        renderVerticalOffset: 1.05,
        referenceImage: null,
        isActive: true,
        rooms: [
          {
            roomId: "room-gallery",
            roomName: "Gallery",
            polygon: [
              { x: 0, y: 0 },
              { x: 6, y: 0 },
              { x: 6, y: 4 },
              { x: 0, y: 4 },
              { x: 0, y: 0 },
            ],
            boundaries: [],
            area: 24,
            labelPosition: { x: 3, y: 2 },
            bounds: {
              minX: 0,
              minY: 0,
              maxX: 6,
              maxY: 4,
            },
            layers: {
              floor: {
                elementClass: "floor",
                order: 0,
                baseElevation: -0.01575,
              },
              furniture: {
                elementClass: "furniture",
                order: 1,
                baseElevation: -0.00175,
              },
              wall: {
                elementClass: "wall",
                order: 2,
                baseElevation: 0.014,
              },
            },
            walls: [
              {
                edgeId: "room-gallery:edge:0",
                start: { x: 0, y: 0 },
                end: { x: 6, y: 0 },
              },
              {
                edgeId: "room-gallery:edge:1",
                start: { x: 6, y: 0 },
                end: { x: 6, y: 4 },
              },
              {
                edgeId: "room-gallery:edge:2",
                start: { x: 6, y: 4 },
                end: { x: 0, y: 4 },
              },
              {
                edgeId: "room-gallery:edge:3",
                start: { x: 0, y: 4 },
                end: { x: 0, y: 0 },
              },
            ],
            openings: [],
          },
        ],
        verticalConnectors: [],
      },
    ],
  });
});

test("adaptProjectSnapshotToRenderScene stacks floors from each configured floor height", () => {
  const project: RendererSnapshotProject = {
    projectId: "project-variable-heights",
    projectName: "Variable Height Center",
    objectVersion: 1,
    floors: [
      createMinimalSnapshotFloor("floor-low", "Low", 2.25),
      createMinimalSnapshotFloor("floor-tall", "Tall", 5.5),
      createMinimalSnapshotFloor("floor-short", "Short", 2.75),
    ],
    viewState: {
      activeFloorId: "floor-low",
      selectedRoomId: null,
    },
  };

  const scene = adaptProjectSnapshotToRenderScene(project);

  assert.deepEqual(
    scene.floors.map(
      ({
        floorId,
        floorHeight,
        verticalOffset,
        renderHeight,
        renderVerticalOffset,
      }) => ({
      floorId,
      floorHeight,
      verticalOffset,
        renderHeight,
        renderVerticalOffset,
      }),
    ),
    [
      {
        floorId: "floor-low",
        floorHeight: 2.25,
        verticalOffset: 0,
        renderHeight: 0.675,
        renderVerticalOffset: 0,
      },
      {
        floorId: "floor-tall",
        floorHeight: 5.5,
        verticalOffset: 2.25,
        renderHeight: 1.65,
        renderVerticalOffset: 0.675,
      },
      {
        floorId: "floor-short",
        floorHeight: 2.75,
        verticalOffset: 7.75,
        renderHeight: 0.825,
        renderVerticalOffset: 2.325,
      },
    ],
  );
});

test("adaptProjectSnapshotToRenderScene derives each floor placement from the cumulative lower-floor heights", () => {
  const project: RendererSnapshotProject = {
    projectId: "project-cumulative-heights",
    projectName: "Cumulative Heights Center",
    objectVersion: 1,
    floors: [
      createMinimalSnapshotFloor("floor-ground", "Ground", 2.4),
      createMinimalSnapshotFloor("floor-mezzanine", "Mezzanine", 3.35),
      createMinimalSnapshotFloor("floor-office", "Office", 4.1),
      createMinimalSnapshotFloor("floor-roof", "Roof", 2.85),
    ],
    viewState: {
      activeFloorId: "floor-ground",
      selectedRoomId: null,
    },
  };

  const scene = adaptProjectSnapshotToRenderScene(project);
  let cumulativeLowerFloorHeight = 0;
  let cumulativeRenderHeight = 0;

  scene.floors.forEach((floor) => {
    assert.equal(floor.verticalOffset, cumulativeLowerFloorHeight);
    assert.equal(floor.renderVerticalOffset, cumulativeRenderHeight);

    cumulativeLowerFloorHeight = Number(
      (cumulativeLowerFloorHeight + floor.floorHeight).toFixed(6),
    );
    cumulativeRenderHeight = Number(
      (cumulativeRenderHeight + floor.renderHeight).toFixed(6),
    );
  });

  assert.deepEqual(
    scene.floors.map(({ floorId, verticalOffset, renderVerticalOffset }) => ({
      floorId,
      verticalOffset,
      renderVerticalOffset,
    })),
    [
      {
        floorId: "floor-ground",
        verticalOffset: 0,
        renderVerticalOffset: 0,
      },
      {
        floorId: "floor-mezzanine",
        verticalOffset: 2.4,
        renderVerticalOffset: 0.72,
      },
      {
        floorId: "floor-office",
        verticalOffset: 5.75,
        renderVerticalOffset: 1.725,
      },
      {
        floorId: "floor-roof",
        verticalOffset: 9.85,
        renderVerticalOffset: 2.955,
      },
    ],
  );
});

test("adaptProjectSnapshotToRenderScene derives distinct render-space floor heights from configured floor heights", () => {
  const scene = adaptProjectSnapshotToRenderScene({
    projectId: "project-render-heights",
    projectName: "Render Height Lab",
    objectVersion: 1,
    floors: [
      createMinimalSnapshotFloor("floor-compact", "Compact", 2),
      createMinimalSnapshotFloor("floor-tall", "Tall", 4.5),
    ],
    viewState: {
      activeFloorId: "floor-compact",
      selectedRoomId: null,
    },
  });

  assert.deepEqual(
    scene.floors.map(({ floorId, renderHeight, renderVerticalOffset }) => ({
      floorId,
      renderHeight,
      renderVerticalOffset,
    })),
    [
      {
        floorId: "floor-compact",
        renderHeight: 0.6,
        renderVerticalOffset: 0,
      },
      {
        floorId: "floor-tall",
        renderHeight: 1.35,
        renderVerticalOffset: 0.6,
      },
    ],
  );
  assert.notEqual(scene.floors[0].renderHeight, scene.floors[1].renderHeight);
});

test("adaptProjectSnapshotToRenderScene does not retain mutable references to editor snapshot objects", () => {
  const project: RendererSnapshotProject = {
    projectId: "project-beta",
    projectName: "Beta Center",
    objectVersion: 1,
    floors: [
      {
        floorId: "floor-1",
        floorName: "Level 1",
        floorHeight: 3,
        referenceImage: null,
        rooms: [
          {
            roomId: "room-a",
            roomName: "Room A",
            roomPolygon: [
              { x: 0, y: 0 },
              { x: 4, y: 0 },
              { x: 4, y: 2 },
              { x: 0, y: 2 },
              { x: 0, y: 0 },
            ],
            sharedBoundaries: [],
            area: 8,
            labelPosition: { x: 2, y: 1 },
            openings: [
              {
                openingId: "opening-a",
                openingType: "door",
                attachedEdgeId: "room-a:edge:1",
                edgeRelativePosition: 0.25,
              },
            ],
          },
        ],
      },
    ],
    viewState: {
      activeFloorId: "floor-1",
      selectedRoomId: "room-a",
    },
  };

  const scene = adaptProjectSnapshotToRenderScene(project);

  project.floors[0].rooms[0].roomPolygon[1].x = 999;
  project.floors[0].rooms[0].labelPosition!.x = 999;
  project.viewState.activeFloorId = null;

  assert.deepEqual(scene.floors[0].rooms[0].polygon[1], { x: 4, y: 0 });
  assert.deepEqual(scene.floors[0].rooms[0].labelPosition, { x: 2, y: 1 });
  assert.equal(scene.activeFloorId, "floor-1");
  assert.deepEqual(scene.floors[0].rooms[0].layers, {
    floor: {
      elementClass: "floor",
      order: 0,
      baseElevation: -0.01575,
    },
    furniture: {
      elementClass: "furniture",
      order: 1,
      baseElevation: -0.00175,
    },
    wall: {
      elementClass: "wall",
      order: 2,
      baseElevation: 0.014,
    },
  });
  assert.deepEqual(scene.floors[0].rooms[0].openings[0].anchor, {
    x: 4,
    y: 0.5,
  });
});

test("adaptProjectSnapshotToRenderScene returns a deeply frozen scene tree", () => {
  const scene = adaptProjectSnapshotToRenderScene({
    projectId: "project-frozen",
    projectName: "Frozen Tower",
    objectVersion: 7,
    floors: [
      {
        floorId: "floor-1",
        floorName: "Only Floor",
        floorHeight: 3.2,
        referenceImage: null,
        rooms: [
          {
            roomId: "room-1",
            roomName: "Control",
            roomPolygon: [
              { x: 0, y: 0 },
              { x: 5, y: 0 },
              { x: 5, y: 5 },
              { x: 0, y: 5 },
              { x: 0, y: 0 },
            ],
            sharedBoundaries: [],
            area: 25,
            labelPosition: null,
          },
        ],
      },
    ],
    viewState: {
      activeFloorId: "missing-floor",
      selectedRoomId: null,
    },
  });

  assert.ok(Object.isFrozen(scene));
  assert.ok(Object.isFrozen(scene.floors));
  assert.ok(Object.isFrozen(scene.floors[0]));
  assert.ok(Object.isFrozen(scene.floors[0].rooms));
  assert.ok(Object.isFrozen(scene.floors[0].rooms[0]));
  assert.ok(Object.isFrozen(scene.floors[0].rooms[0].polygon));
  assert.ok(Object.isFrozen(scene.floors[0].rooms[0].polygon[0]));
  assert.ok(Object.isFrozen(scene.floors[0].rooms[0].layers));
  assert.ok(Object.isFrozen(scene.floors[0].rooms[0].layers.floor));
  assert.equal(scene.activeFloorId, "floor-1");
});

function createMinimalSnapshotFloor(
  floorId: string,
  floorName: string,
  floorHeight: number,
): RendererSnapshotProject["floors"][number] {
  return {
    floorId,
    floorName,
    floorHeight,
    referenceImage: null,
    rooms: [
      {
        roomId: `${floorId}-room`,
        roomName: `${floorName} Room`,
        roomPolygon: [
          { x: 0, y: 0 },
          { x: 4, y: 0 },
          { x: 4, y: 3 },
          { x: 0, y: 3 },
          { x: 0, y: 0 },
        ],
        sharedBoundaries: [],
        area: 12,
        labelPosition: { x: 2, y: 1.5 },
      },
    ],
    verticalConnectors: [],
  };
}
