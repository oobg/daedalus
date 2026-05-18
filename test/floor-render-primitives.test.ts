import assert from "node:assert/strict";
import test from "node:test";

import {
  adaptSnapshotFloorToRenderSceneFloor,
  type RendererSnapshotFloor,
} from "../src/features/renderer/index.ts";

test("adaptSnapshotFloorToRenderSceneFloor converts one normalized floor into viewer/export render primitives", () => {
  const floor: RendererSnapshotFloor = {
    floorId: "floor-1",
    floorName: "Ground",
    floorHeight: 3.5,
    referenceImage: "floor-plan://project-ground.png",
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
      {
        roomId: "room-gallery",
        roomName: "Gallery",
        roomPolygon: [
          { x: 8, y: 0 },
          { x: 12, y: 0 },
          { x: 12, y: 4 },
          { x: 8, y: 4 },
          { x: 8, y: 0 },
        ],
        sharedBoundaries: [],
        area: 16,
        labelPosition: { x: 10, y: 2 },
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
  };

  const renderFloor = adaptSnapshotFloorToRenderSceneFloor(floor, {
    verticalOffset: 3.5,
    renderVerticalOffset: 1.05,
    isActive: true,
  });

  assert.deepEqual(renderFloor, {
    floorId: "floor-1",
    floorName: "Ground",
    floorHeight: 3.5,
    verticalOffset: 3.5,
    renderHeight: 1.05,
    renderVerticalOffset: 1.05,
    referenceImage: "floor-plan://project-ground.png",
    isActive: true,
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
      {
        roomId: "room-gallery",
        roomName: "Gallery",
        polygon: [
          { x: 8, y: 0 },
          { x: 12, y: 0 },
          { x: 12, y: 4 },
          { x: 8, y: 4 },
          { x: 8, y: 0 },
        ],
        boundaries: [],
        area: 16,
        labelPosition: { x: 10, y: 2 },
        bounds: {
          minX: 8,
          minY: 0,
          maxX: 12,
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
            start: { x: 8, y: 0 },
            end: { x: 12, y: 0 },
          },
          {
            edgeId: "room-gallery:edge:1",
            start: { x: 12, y: 0 },
            end: { x: 12, y: 4 },
          },
          {
            edgeId: "room-gallery:edge:2",
            start: { x: 12, y: 4 },
            end: { x: 8, y: 4 },
          },
          {
            edgeId: "room-gallery:edge:3",
            start: { x: 8, y: 4 },
            end: { x: 8, y: 0 },
          },
        ],
        openings: [],
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
  });
});

test("adaptSnapshotFloorToRenderSceneFloor deep-freezes the floor primitive tree", () => {
  const floor: RendererSnapshotFloor = {
    floorId: "floor-1",
    floorName: "Ground",
    floorHeight: 3,
    referenceImage: null,
    rooms: [
      {
        roomId: "room-1",
        roomName: "Room 1",
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
  };

  const renderFloor = adaptSnapshotFloorToRenderSceneFloor(floor, {
    verticalOffset: 0,
    renderVerticalOffset: 0,
    isActive: true,
  });

  assert.equal(Object.isFrozen(renderFloor), true);
  assert.equal(Object.isFrozen(renderFloor.rooms), true);
  assert.equal(Object.isFrozen(renderFloor.rooms[0]), true);
  assert.equal(Object.isFrozen(renderFloor.rooms[0].polygon), true);
  assert.equal(Object.isFrozen(renderFloor.rooms[0].polygon[0]), true);

  assert.throws(() => {
    (renderFloor.rooms[0].polygon[0] as { x: number; y: number }).x = 99;
  }, TypeError);
});

test("adaptSnapshotFloorToRenderSceneFloor preserves same-floor geometry when only configured height changes", () => {
  const floor: RendererSnapshotFloor = {
    floorId: "floor-lab",
    floorName: "Lab",
    floorHeight: 3,
    referenceImage: "floor-plan://lab.png",
    rooms: [
      {
        roomId: "room-lab",
        roomName: "Lab Room",
        roomPolygon: [
          { x: 1, y: 1 },
          { x: 7, y: 1 },
          { x: 7, y: 5 },
          { x: 1, y: 5 },
          { x: 1, y: 1 },
        ],
        sharedBoundaries: [
          {
            edgeId: "edge-lab-east",
            adjacentRoomId: "room-storage",
            adjacentEdgeId: "edge-storage-west",
          },
        ],
        area: 24,
        labelPosition: { x: 4, y: 3 },
        walls: [
          {
            edgeId: "edge-lab-east",
            start: { x: 7, y: 1 },
            end: { x: 7, y: 5 },
          },
        ],
        openings: [
          {
            openingId: "opening-lab-door",
            openingType: "door",
            attachedEdgeId: "edge-lab-east",
            edgeRelativePosition: 0.25,
          },
        ],
      },
    ],
    verticalConnectors: [
      {
        connectorId: "connector-lab-stair",
        connectorType: "stair",
        roomId: "room-lab",
        targetFloorId: "floor-upper",
        position: { x: 2, y: 2 },
      },
    ],
  };

  const baseline = adaptSnapshotFloorToRenderSceneFloor(floor, {
    verticalOffset: 0,
    renderVerticalOffset: 0,
    isActive: true,
  });
  const tallerFloor = adaptSnapshotFloorToRenderSceneFloor(
    {
      ...floor,
      floorHeight: 4.5,
    },
    {
      verticalOffset: 0,
      renderVerticalOffset: 0,
      isActive: true,
    },
  );

  assert.deepEqual(
    {
      referenceImage: tallerFloor.referenceImage,
      rooms: tallerFloor.rooms,
      verticalConnectors: tallerFloor.verticalConnectors,
    },
    {
      referenceImage: baseline.referenceImage,
      rooms: baseline.rooms,
      verticalConnectors: baseline.verticalConnectors,
    },
  );
  assert.equal(tallerFloor.floorHeight, 4.5);
  assert.equal(tallerFloor.renderHeight, 1.35);
  assert.equal(baseline.renderHeight, 0.9);
});
