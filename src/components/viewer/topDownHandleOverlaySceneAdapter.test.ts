import assert from "node:assert/strict";
import test from "node:test";

import { createEditorProject } from "../../domain/editor-state.ts";
import { resolveTopDownHandleOverlayDescriptors } from "./topDownHandleOverlaySceneAdapter.ts";
import {
  createViewer25DSceneGraph,
  resolveViewer25DSceneGeometrySource,
} from "./viewer25dSceneGraph.ts";

test("resolveTopDownHandleOverlayDescriptors hides all edit handles outside top-down orthographic mode", () => {
  const project = createEditorProject({
    projectId: "project-perspective",
    floors: [
      {
        floorId: "floor-ground",
        rooms: [
          {
            roomId: "room-lobby",
            roomName: "Lobby",
            roomPolygon: [
              { x: 0, y: 0 },
              { x: 400, y: 0 },
              { x: 400, y: 300 },
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
  });

  const handles = resolveTopDownHandleOverlayDescriptors({
    geometrySource: resolveViewer25DSceneGeometrySource({
      sceneGraph: createViewer25DSceneGraph({
        floors: project.floors,
        activeFloorId: project.viewState.activeFloorId,
        exteriorPolygon: project.exteriorPolygon,
        exteriorEdgeOpenings: project.exteriorEdgeOpenings,
        floorRenderOffsets: [0],
      }),
      cameraMode: "perspective",
    }),
    cameraMode: "perspective",
  });

  assert.deepEqual(handles, []);
});

test("resolveTopDownHandleOverlayDescriptors maps active-floor editable entities and exterior vertices into shared-scene world positions", () => {
  const project = createEditorProject({
    projectId: "project-top-down",
    floors: [
      {
        floorId: "floor-ground",
        floorName: "Ground",
        floorHeight: 3.2,
        rooms: [
          {
            roomId: "room-storage",
            roomName: "Storage",
            roomPolygon: [
              { x: 900, y: 900 },
              { x: 1200, y: 900 },
              { x: 1200, y: 1200 },
            ],
            openings: [],
          },
        ],
      },
      {
        floorId: "floor-upper",
        floorName: "Upper",
        floorHeight: 3.6,
        rooms: [
          {
            roomId: "room-studio",
            roomName: "Studio",
            roomPolygon: [
              { x: 0, y: 0 },
              { x: 400, y: 0 },
              { x: 400, y: 300 },
              { x: 0, y: 300 },
            ],
            openings: [
              {
                id: "opening-window-north",
                type: "window",
                x: 200,
                y: 0,
                angle: 0,
              },
            ],
          },
        ],
        guideObjects: [
          {
            guideObjectId: "guide-desk",
            guideObjectType: "furniture",
            floorId: "floor-upper",
            roomId: "room-studio",
            name: "Desk",
            position: { x: 150, y: 120 },
          },
        ],
        verticalConnectors: [
          {
            connectorId: "connector-core-1",
            connectorType: "stair",
            roomId: "room-studio",
            targetFloorId: "floor-roof",
            position: { x: 320, y: 180 },
          },
        ],
      },
    ],
    exteriorPolygon: [
      { x: -50, y: -50 },
      { x: 450, y: -50 },
      { x: 450, y: 350 },
    ],
    viewState: {
      activeFloorId: "floor-upper",
      selectedRoomId: "room-studio",
    },
  });

  const handles = resolveTopDownHandleOverlayDescriptors({
    geometrySource: resolveViewer25DSceneGeometrySource({
      sceneGraph: createViewer25DSceneGraph({
        floors: project.floors,
        activeFloorId: project.viewState.activeFloorId,
        exteriorPolygon: project.exteriorPolygon,
        exteriorEdgeOpenings: project.exteriorEdgeOpenings,
        floorRenderOffsets: [0, 1.08],
      }),
      cameraMode: "top-down-orthographic",
    }),
    cameraMode: "top-down-orthographic",
  });

  assert.deepEqual(
    handles.map((handle) => ({
      id: handle.id,
      entityKind: handle.entityKind,
      floorId: handle.floorId,
      roomId: handle.roomId,
      worldPosition: handle.worldPosition,
    })),
    [
      {
        id: "floor-upper:room-studio:vertex:0",
        entityKind: "room-vertex",
        floorId: "floor-upper",
        roomId: "room-studio",
        worldPosition: { x: 0, y: 1.1, z: 0 },
      },
      {
        id: "floor-upper:room-studio:vertex:1",
        entityKind: "room-vertex",
        floorId: "floor-upper",
        roomId: "room-studio",
        worldPosition: { x: 4, y: 1.1, z: 0 },
      },
      {
        id: "floor-upper:room-studio:vertex:2",
        entityKind: "room-vertex",
        floorId: "floor-upper",
        roomId: "room-studio",
        worldPosition: { x: 4, y: 1.1, z: 3 },
      },
      {
        id: "floor-upper:room-studio:vertex:3",
        entityKind: "room-vertex",
        floorId: "floor-upper",
        roomId: "room-studio",
        worldPosition: { x: 0, y: 1.1, z: 3 },
      },
      {
        id: "floor-upper:room-studio:opening:opening-window-north",
        entityKind: "room-opening",
        floorId: "floor-upper",
        roomId: "room-studio",
        worldPosition: { x: 2, y: 1.1, z: 0 },
      },
      {
        id: "floor-upper:guide-object:guide-desk",
        entityKind: "guide-object",
        floorId: "floor-upper",
        roomId: "room-studio",
        worldPosition: { x: 1.5, y: 1.1, z: 1.2 },
      },
      {
        id: "floor-upper:vertical-connector:connector-core-1",
        entityKind: "vertical-connector",
        floorId: "floor-upper",
        roomId: "room-studio",
        worldPosition: { x: 3.2, y: 1.1, z: 1.8 },
      },
      {
        id: "exterior:vertex:0",
        entityKind: "exterior-vertex",
        floorId: null,
        roomId: null,
        worldPosition: { x: -0.5, y: 0, z: -0.5 },
      },
      {
        id: "exterior:vertex:1",
        entityKind: "exterior-vertex",
        floorId: null,
        roomId: null,
        worldPosition: { x: 4.5, y: 0, z: -0.5 },
      },
      {
        id: "exterior:vertex:2",
        entityKind: "exterior-vertex",
        floorId: null,
        roomId: null,
        worldPosition: { x: 4.5, y: 0, z: 3.5 },
      },
    ],
  );

  assert.equal(
    handles.some((handle) => handle.id.startsWith("floor-ground:")),
    false,
  );
});
