import assert from "node:assert/strict";
import test from "node:test";

import {
  RENDERER_CONTRACT_FIELDS,
  adaptProjectSnapshotToRenderScene,
  createRendererEntrypoint,
  renderProjectSnapshot,
  type RendererSnapshotProject,
  type RenderSceneData,
} from "../src/features/renderer/index.ts";

test("renderer public API exposes the stable contract and adapter entrypoint", () => {
  assert.equal(typeof adaptProjectSnapshotToRenderScene, "function");
  assert.equal(typeof createRendererEntrypoint, "function");
  assert.equal(typeof renderProjectSnapshot, "function");
  assert.deepEqual(RENDERER_CONTRACT_FIELDS.snapshotProject, [
    "projectId",
    "projectName",
    "objectVersion",
    "floors",
    "viewState",
  ]);
  assert.deepEqual(RENDERER_CONTRACT_FIELDS.sceneData, [
    "projectId",
    "projectName",
    "objectVersion",
    "activeFloorId",
    "selectedRoomId",
    "floors",
  ]);
});

test("renderer contract field lists cover the required snapshot and scene structures", () => {
  assert.deepEqual(RENDERER_CONTRACT_FIELDS.snapshotFloor, [
    "floorId",
    "floorName",
    "floorHeight",
    "referenceImage",
    "rooms",
  ]);
  assert.deepEqual(RENDERER_CONTRACT_FIELDS.snapshotRoom, [
    "roomId",
    "roomName",
    "roomPolygon",
    "sharedBoundaries",
    "area",
    "labelPosition",
  ]);
  assert.deepEqual(RENDERER_CONTRACT_FIELDS.snapshotOpening, [
    "openingId",
    "openingType",
    "attachedEdgeId",
    "edgeRelativePosition",
  ]);
  assert.deepEqual(RENDERER_CONTRACT_FIELDS.sceneFloor, [
    "floorId",
    "floorName",
    "floorHeight",
    "verticalOffset",
    "referenceImage",
    "isActive",
    "rooms",
    "verticalConnectors",
  ]);
  assert.deepEqual(RENDERER_CONTRACT_FIELDS.sceneRoom, [
    "roomId",
    "roomName",
    "polygon",
    "boundaries",
    "area",
    "labelPosition",
    "bounds",
    "layers",
    "walls",
    "openings",
  ]);
  assert.deepEqual(RENDERER_CONTRACT_FIELDS.sceneOpening, [
    "openingId",
    "openingType",
    "attachedEdgeId",
    "edgeRelativePosition",
    "anchor",
  ]);
});

test("renderer public types describe a render-ready scene with required fields", () => {
  const snapshot: RendererSnapshotProject = {
    projectId: "project-contract",
    projectName: "Contract Tower",
    objectVersion: 1,
    floors: [
      {
        floorId: "floor-1",
        floorName: "Ground",
        floorHeight: 3,
        referenceImage: null,
        rooms: [
          {
            roomId: "room-lobby",
            roomName: "Lobby",
            roomPolygon: [
              { x: 0, y: 0 },
              { x: 10, y: 0 },
              { x: 10, y: 8 },
              { x: 0, y: 8 },
              { x: 0, y: 0 },
            ],
            sharedBoundaries: [],
            area: 80,
            labelPosition: { x: 5, y: 4 },
            openings: [
              {
                openingId: "opening-1",
                openingType: "door",
                attachedEdgeId: "room-lobby:edge:1",
                edgeRelativePosition: 0.5,
              },
            ],
          },
        ],
      },
    ],
    viewState: {
      activeFloorId: "floor-1",
      selectedRoomId: "room-lobby",
    },
  };

  const scene: Readonly<RenderSceneData> =
    adaptProjectSnapshotToRenderScene(snapshot);

  assert.deepEqual(Object.keys(scene).sort(), [
    "activeFloorId",
    "floors",
    "objectVersion",
    "projectId",
    "projectName",
    "selectedRoomId",
  ]);
  assert.deepEqual(Object.keys(scene.floors[0]).sort(), [
    "floorHeight",
    "floorId",
    "floorName",
    "isActive",
    "referenceImage",
    "rooms",
    "verticalConnectors",
    "verticalOffset",
  ]);
  assert.deepEqual(Object.keys(scene.floors[0].rooms[0]).sort(), [
    "area",
    "boundaries",
    "bounds",
    "labelPosition",
    "layers",
    "openings",
    "polygon",
    "roomId",
    "roomName",
    "walls",
  ]);
  assert.deepEqual(
    Object.keys(scene.floors[0].rooms[0].layers).sort(),
    ["floor", "furniture", "wall"],
  );
  assert.deepEqual(Object.keys(scene.floors[0].rooms[0].openings[0]).sort(), [
    "anchor",
    "attachedEdgeId",
    "edgeRelativePosition",
    "openingId",
    "openingType",
  ]);
});
