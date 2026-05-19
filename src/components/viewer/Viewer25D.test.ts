import assert from "node:assert/strict";
import test from "node:test";
import type React from "react";

type HtmlHandleProps = { position: [number, number, number]; children?: React.ReactElement };
type ButtonProps = Record<string, unknown>;

function handleId(el: React.ReactElement): string | undefined {
  const htmlProps = el.props as HtmlHandleProps;
  const btn = htmlProps.children;
  return btn ? (btn.props as ButtonProps)["data-world-handle-id"] as string : undefined;
}

function handlePos(el: React.ReactElement): [number, number, number] {
  return (el.props as HtmlHandleProps).position;
}

import { createEditorProject } from "../../domain/editor-state.ts";
import {
  DEFAULT_WALL_HEIGHT_SCALE,
  resolveViewer25DFloorRenderPlacements,
} from "./viewer25dGeometry.ts";
import {
  createViewer25DTopDownHandleOverlayScene,
  mountViewer25DTopDownHandleOverlayScene,
} from "./viewer25dTopDownHandleOverlayScene.ts";
import {
  createViewer25DSceneGraph,
  resolveViewer25DSceneGeometrySource,
} from "./viewer25dSceneGraph.ts";
import { collectWorldSpaceHtmlHandleElements } from "./worldSpaceEditHandles.ts";
import { createEditorStore } from "../../store/createEditorStore.ts";
import { resolveViewer25DSharedSceneInstance } from "./viewer25dSharedScene.ts";

test("Viewer25D top-down overlay scene mounts Html edit handles for the shared canvas scene path", () => {
  const project = createEditorProject({
    projectId: "project-top-down-scene",
    floors: [
      {
        floorId: "floor-ground",
        floorName: "Ground",
        floorHeight: 3.2,
        rooms: [
          {
            roomId: "room-lobby",
            roomName: "Lobby",
            roomPolygon: [
              { x: 0, y: 0 },
              { x: 400, y: 0 },
              { x: 400, y: 300 },
              { x: 0, y: 300 },
            ],
            openings: [
              {
                id: "opening-window-east",
                type: "window",
                x: 400,
                y: 120,
                angle: Math.PI / 2,
              },
            ],
          },
        ],
        guideObjects: [
          {
            guideObjectId: "guide-desk",
            guideObjectType: "furniture",
            floorId: "floor-ground",
            roomId: "room-lobby",
            name: "Desk",
            position: { x: 180, y: 140 },
          },
        ],
        verticalConnectors: [
          {
            connectorId: "connector-core",
            connectorType: "stair",
            roomId: "room-lobby",
            targetFloorId: "floor-upper",
            position: { x: 260, y: 160 },
          },
        ],
      },
    ],
    exteriorPolygon: [
      { x: -100, y: -100 },
      { x: 500, y: -100 },
      { x: 500, y: 400 },
    ],
    viewState: {
      activeFloorId: "floor-ground",
      selectedRoomId: "room-lobby",
    },
  });
  const floorPlacements = resolveViewer25DFloorRenderPlacements(
    project.floors,
    DEFAULT_WALL_HEIGHT_SCALE,
  );
  const sceneTree = createViewer25DTopDownHandleOverlayScene({
    geometrySource: resolveViewer25DSceneGeometrySource({
      sceneGraph: createViewer25DSceneGraph({
        floors: project.floors,
        activeFloorId: project.viewState.activeFloorId,
        exteriorPolygon: project.exteriorPolygon,
        exteriorEdgeOpenings: project.exteriorEdgeOpenings,
        floorRenderOffsets: floorPlacements.map(
          (placement) => placement.renderVerticalOffset ?? 0,
        ),
      }),
      cameraMode: "top-down-orthographic",
    }),
    cameraMode: "top-down-orthographic",
  });
  const htmlHandles = collectWorldSpaceHtmlHandleElements(sceneTree);

  assert.deepEqual(
    htmlHandles.map(handleId),
    [
      "floor-ground:room-lobby:vertex:0",
      "floor-ground:room-lobby:vertex:1",
      "floor-ground:room-lobby:vertex:2",
      "floor-ground:room-lobby:vertex:3",
      "floor-ground:room-lobby:opening:opening-window-east",
      "floor-ground:guide-object:guide-desk",
      "floor-ground:vertical-connector:connector-core",
      "exterior:vertex:0",
      "exterior:vertex:1",
      "exterior:vertex:2",
    ],
  );
});

test("Viewer25D top-down overlay scene updates mounted Html handles when shared scene state changes after mount", () => {
  const store = createEditorStore({ storage: null });

  store.getState().replaceProject(
    createEditorProject({
      projectId: "project-top-down-overlay-sync",
      floors: [
        {
          floorId: "floor-ground",
          floorName: "Ground",
          floorHeight: 3.2,
          rooms: [
            {
              roomId: "room-lobby",
              roomName: "Lobby",
              roomPolygon: [
                { x: 0, y: 0 },
                { x: 400, y: 0 },
                { x: 400, y: 300 },
                { x: 0, y: 300 },
              ],
              openings: [
                {
                  id: "opening-door-east",
                  type: "door",
                  x: 400,
                  y: 140,
                  angle: Math.PI / 2,
                },
              ],
            },
          ],
        },
      ],
      exteriorPolygon: [
        { x: -100, y: -100 },
        { x: 500, y: -100 },
        { x: 500, y: 400 },
      ],
      viewState: {
        activeFloorId: "floor-ground",
        selectedRoomId: "room-lobby",
      },
    }),
  );

  const floorRenderOffsets = resolveViewer25DFloorRenderPlacements(
    store.getState().project.floors,
    DEFAULT_WALL_HEIGHT_SCALE,
  ).map((placement) => placement.renderVerticalOffset ?? 0);
  const emittedScenes = [];
  const mountedOverlayScene = mountViewer25DTopDownHandleOverlayScene({
    store,
    cameraMode: "top-down-orthographic",
    floorRenderOffsets,
    onSceneChange: (scene) => {
      emittedScenes.push(scene);
    },
  });

  assert.equal(emittedScenes.length, 1);
  const firstHandle = collectWorldSpaceHtmlHandleElements(mountedOverlayScene.getScene())[0];
  assert.ok(firstHandle);
  assert.equal(handlePos(firstHandle)[0], 0);
  assert.equal(
    collectWorldSpaceHtmlHandleElements(mountedOverlayScene.getScene()).some(
      (handle) => handleId(handle) === "floor-ground:room-lobby:opening:opening-door-east",
    ),
    true,
  );

  store.getState().updateRoom("floor-ground", "room-lobby", {
    roomPolygon: [
      { x: 120, y: 40 },
      { x: 400, y: 0 },
      { x: 400, y: 300 },
      { x: 0, y: 300 },
    ],
    openings: [],
  });

  assert.equal(emittedScenes.length, 2);

  const updatedHandles = collectWorldSpaceHtmlHandleElements(
    mountedOverlayScene.getScene(),
  );
  const updatedVertexHandle = updatedHandles.find(
    (handle) => handleId(handle) === "floor-ground:room-lobby:vertex:0",
  );

  assert.ok(updatedVertexHandle);
  assert.deepEqual(handlePos(updatedVertexHandle), [1.2, 0.02, 0.4]);
  assert.equal(
    updatedHandles.some(
      (handle) => handleId(handle) === "floor-ground:room-lobby:opening:opening-door-east",
    ),
    false,
  );

  mountedOverlayScene.dispose();
});

test("Viewer25D top-down overlay scene consumes the resolved shared geometry input", () => {
  const sceneGraph = createViewer25DSceneGraph({
    floors: [],
    activeFloorId: null,
    exteriorPolygon: null,
    exteriorEdgeOpenings: null,
    floorRenderOffsets: [],
  });
  const geometrySource = {
    sceneGraph,
    roomNodes: [
      Object.freeze({
        nodeId: "floor-test:room-test",
        floorId: "floor-test",
        roomId: "room-test",
        roomName: "Geometry Source Room",
        points: Object.freeze([
          Object.freeze({ x: 100, y: 200 }),
          Object.freeze({ x: 300, y: 200 }),
          Object.freeze({ x: 300, y: 400 }),
        ]),
        openings: Object.freeze([]),
        floorHeight: 3,
        floorRenderY: 0.9,
        colorIndex: 0,
        isActive: true,
      }),
    ],
    exteriorNode: null,
    exteriorOpeningNodes: Object.freeze([]),
    guideObjectNodes: Object.freeze([]),
    verticalConnectorNodes: Object.freeze([]),
  } as const;

  const sceneTree = createViewer25DTopDownHandleOverlayScene({
    geometrySource,
    cameraMode: "top-down-orthographic",
  });
  const htmlHandles = collectWorldSpaceHtmlHandleElements(sceneTree);

  assert.deepEqual(
    htmlHandles.map(handleId),
    [
      "floor-test:room-test:vertex:0",
      "floor-test:room-test:vertex:1",
      "floor-test:room-test:vertex:2",
    ],
  );
  assert.deepEqual(handlePos(htmlHandles[0]!), [1, 0.92, 2]);
});

test("Viewer25D camera mode switching preserves the exact shared THREE.Scene instance", () => {
  const sharedScene = resolveViewer25DSharedSceneInstance();

  const editScene = resolveViewer25DSharedSceneInstance(sharedScene);
  const previewScene = resolveViewer25DSharedSceneInstance(editScene);

  assert.equal(editScene, sharedScene);
  assert.equal(previewScene, sharedScene);
  assert.equal(sharedScene.name, "viewer25d-shared-scene");
});
