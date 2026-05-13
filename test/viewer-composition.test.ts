import assert from "node:assert/strict";
import test from "node:test";

import { type RendererPort, type RenderSceneData } from "../src/features/renderer/index.ts";
import { createViewerComposition } from "../src/features/viewer/index.ts";

test("viewer composition renders a supplied render scene without editor state dependencies", () => {
  const calls: Readonly<RenderSceneData>[] = [];
  const renderer: RendererPort<string> = {
    render(scene) {
      calls.push(scene);
      return `${scene.projectId}:${scene.activeFloorId}:${scene.floors.length}`;
    },
  };

  const viewer = createViewerComposition(renderer);
  const scene = createRenderScene();
  const result = viewer.renderScene(scene);

  assert.equal(result, "project-viewer:floor-2:2");
  assert.equal(calls.length, 1);
  assert.notEqual(calls[0], scene);
  assert.deepEqual(calls[0], scene);
});

test("viewer composition loads a scene into an immutable read-only snapshot before rendering", () => {
  const renderer: RendererPort<Readonly<RenderSceneData>> = {
    render(scene) {
      return scene;
    },
  };

  const viewer = createViewerComposition(renderer);
  const scene = createRenderScene();
  const loadedViewer = viewer.createLoadedSceneViewer(scene);
  const loadedScene = loadedViewer.getScene();

  scene.projectName = "Mutated Project";
  scene.floors[0].rooms[0].polygon[1].x = 999;
  scene.floors[0].rooms[0].openings[0].anchor!.x = 999;

  const renderedScene = loadedViewer.render();

  assert.equal(renderedScene.projectName, "Viewer Project");
  assert.deepEqual(renderedScene.floors[0].rooms[0].polygon[1], { x: 8, y: 0 });
  assert.deepEqual(renderedScene.floors[0].rooms[0].openings[0].anchor, {
    x: 8,
    y: 3,
  });
  assert.ok(Object.isFrozen(loadedScene));
  assert.ok(Object.isFrozen(loadedScene.floors));
  assert.ok(Object.isFrozen(loadedScene.floors[0].rooms[0].polygon));
});

test("viewer composition exposes only read-only viewer and export capabilities", () => {
  const renderer: RendererPort<string> = {
    render(scene) {
      return scene.projectId;
    },
  };

  const viewer = createViewerComposition(renderer);

  assert.equal("loadScene" in viewer, false);
  assert.equal("renderLoadedScene" in viewer, false);
  assert.equal(typeof viewer.createLoadedSceneViewer, "function");
  assert.equal(typeof viewer.renderScene, "function");
});

function createRenderScene(): RenderSceneData {
  return {
    projectId: "project-viewer",
    projectName: "Viewer Project",
    objectVersion: 4,
    activeFloorId: "floor-2",
    selectedRoomId: "room-gallery",
    floors: [
      {
        floorId: "floor-1",
        floorName: "Ground",
        floorHeight: 3.5,
        verticalOffset: 0,
        referenceImage: "floor-plan://viewer/floor-1.png",
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
            walls: [
              {
                edgeId: "room-gallery:edge:0",
                start: { x: 0, y: 0 },
                end: { x: 6, y: 0 },
              },
            ],
            openings: [],
          },
        ],
        verticalConnectors: [],
      },
    ],
  };
}
