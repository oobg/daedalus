import assert from "node:assert/strict";
import test from "node:test";

import { type RenderSceneData } from "../src/features/renderer/index.ts";
import { classifySceneElementMaterialTags } from "../src/features/viewer/index.ts";

test("classifySceneElementMaterialTags assigns wall, wood-accent, and glass tags from render scene elements", () => {
  const assignments = classifySceneElementMaterialTags(createRenderScene());

  assert.deepEqual(assignments, [
    {
      elementId: "floor-1:room-lobby:floor",
      elementKind: "room-floor",
      floorId: "floor-1",
      roomId: "room-lobby",
      sourceId: "room-lobby",
      materialTag: "wood-accent",
    },
    {
      elementId: "floor-1:room-lobby:wall:edge-lobby-north",
      elementKind: "wall-segment",
      floorId: "floor-1",
      roomId: "room-lobby",
      sourceId: "edge-lobby-north",
      materialTag: "wall",
    },
    {
      elementId: "floor-1:room-lobby:wall:edge-lobby-east",
      elementKind: "wall-segment",
      floorId: "floor-1",
      roomId: "room-lobby",
      sourceId: "edge-lobby-east",
      materialTag: "wall",
    },
    {
      elementId: "floor-1:room-lobby:opening:opening-lobby-door",
      elementKind: "opening",
      floorId: "floor-1",
      roomId: "room-lobby",
      sourceId: "opening-lobby-door",
      materialTag: "wood-accent",
    },
    {
      elementId: "floor-1:room-lobby:opening:opening-lobby-window",
      elementKind: "opening",
      floorId: "floor-1",
      roomId: "room-lobby",
      sourceId: "opening-lobby-window",
      materialTag: "glass",
    },
    {
      elementId: "floor-1:connector:connector-stair-1",
      elementKind: "vertical-connector",
      floorId: "floor-1",
      roomId: "room-lobby",
      sourceId: "connector-stair-1",
      materialTag: "wood-accent",
    },
    {
      elementId: "floor-2:room-gallery:floor",
      elementKind: "room-floor",
      floorId: "floor-2",
      roomId: "room-gallery",
      sourceId: "room-gallery",
      materialTag: "wood-accent",
    },
    {
      elementId: "floor-2:room-gallery:opening:opening-gallery-window",
      elementKind: "opening",
      floorId: "floor-2",
      roomId: "room-gallery",
      sourceId: "opening-gallery-window",
      materialTag: "glass",
    },
    {
      elementId: "floor-2:connector:connector-elevator-1",
      elementKind: "vertical-connector",
      floorId: "floor-2",
      roomId: "room-gallery",
      sourceId: "connector-elevator-1",
      materialTag: "wood-accent",
    },
  ]);
});

test("classifySceneElementMaterialTags normalizes window detection and returns a deeply frozen result", () => {
  const assignments = classifySceneElementMaterialTags({
    projectId: "project-materials",
    projectName: "Materials",
    objectVersion: 1,
    activeFloorId: "floor-1",
    selectedRoomId: null,
    floors: [
      {
        floorId: "floor-1",
        floorName: "Only",
        floorHeight: 3,
        verticalOffset: 0,
        referenceImage: null,
        isActive: true,
        rooms: [
          {
            roomId: "room-study",
            roomName: "Study",
            polygon: [],
            boundaries: [],
            area: 0,
            labelPosition: null,
            bounds: null,
            walls: [],
            openings: [
              {
                openingId: "opening-study-window",
                openingType: " Window ",
                attachedEdgeId: "edge-study-east",
                edgeRelativePosition: 0.5,
                anchor: null,
              },
            ],
          },
        ],
        verticalConnectors: [],
      },
    ],
  });

  assert.equal(assignments[1].materialTag, "glass");
  assert.ok(Object.isFrozen(assignments));
  assert.ok(Object.isFrozen(assignments[0]));
  assert.ok(Object.isFrozen(assignments[1]));
});

function createRenderScene(): RenderSceneData {
  return {
    projectId: "project-materials",
    projectName: "Materials",
    objectVersion: 2,
    activeFloorId: "floor-1",
    selectedRoomId: "room-lobby",
    floors: [
      {
        floorId: "floor-1",
        floorName: "Ground",
        floorHeight: 3.5,
        verticalOffset: 0,
        referenceImage: "floor-plan://project-materials/floor-1.png",
        isActive: true,
        rooms: [
          {
            roomId: "room-lobby",
            roomName: "Lobby",
            polygon: [],
            boundaries: [],
            area: 48,
            labelPosition: { x: 4, y: 3 },
            bounds: null,
            walls: [
              {
                edgeId: "edge-lobby-north",
                start: { x: 0, y: 0 },
                end: { x: 8, y: 0 },
              },
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
              {
                openingId: "opening-lobby-window",
                openingType: "window",
                attachedEdgeId: "edge-lobby-north",
                edgeRelativePosition: 0.25,
                anchor: { x: 2, y: 0 },
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
        referenceImage: null,
        isActive: false,
        rooms: [
          {
            roomId: "room-gallery",
            roomName: "Gallery",
            polygon: [],
            boundaries: [],
            area: 24,
            labelPosition: { x: 3, y: 2 },
            bounds: null,
            walls: [],
            openings: [
              {
                openingId: "opening-gallery-window",
                openingType: "window",
                attachedEdgeId: "edge-gallery-south",
                edgeRelativePosition: 0.5,
                anchor: { x: 3, y: 4 },
              },
            ],
          },
        ],
        verticalConnectors: [
          {
            connectorId: "connector-elevator-1",
            connectorType: "elevator",
            roomId: "room-gallery",
            targetFloorId: "floor-1",
            position: { x: 1, y: 1 },
          },
        ],
      },
    ],
  };
}
