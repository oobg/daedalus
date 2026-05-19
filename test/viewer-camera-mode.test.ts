import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";

import {
  createViewer25DSceneGraph,
  resolveViewer25DRenderPlan,
} from "../src/components/viewer/viewer25dSceneGraph.ts";
import { resolveViewer25DFloorRenderPlacements } from "../src/components/viewer/viewer25dGeometry.ts";
import {
  applyViewerCameraModeConfig,
  resolveViewerCameraModeConfig,
  resolveViewerViewportState,
  switchViewerCameraMode,
} from "../src/features/viewer/viewer-camera-mode.ts";
import {
  resolveTopDownSceneBounds,
  resolveTopDownSceneBoundsFromProject,
} from "../src/features/viewer/top-down-camera-configuration.ts";
import { createEditorProject } from "../src/domain/editor-state.ts";

test("top-down camera mode resolves to an orthographic camera aligned above the shared scene", () => {
  const sceneBounds = resolveTopDownSceneBounds({
    floors: [
      {
        floorId: "floor-1",
        floorName: "Ground",
        floorHeight: 3,
        referenceImage: null,
        rooms: [
          {
            roomId: "room-1",
            roomName: "Offset Room",
            roomPolygon: [
              { x: 400, y: 200 },
              { x: 1000, y: 200 },
              { x: 1000, y: 800 },
              { x: 400, y: 800 },
            ],
            sharedBoundaries: [],
            area: 36,
            labelPosition: null,
            openings: [],
          },
        ],
      },
    ],
    exteriorPolygon: [
      { x: 300, y: 100 },
      { x: 1100, y: 100 },
      { x: 1100, y: 900 },
      { x: 300, y: 900 },
    ],
  });
  const config = resolveViewerCameraModeConfig({
    cameraMode: "top-down-orthographic",
    sceneBounds,
    perspectivePosition: [7.6, 7.8, 8.4],
    perspectiveFov: 34,
    fixedPolarAngle: Math.PI / 3,
  });

  assert.equal(config.orthographic, true);
  assert.deepEqual(config.lookAt, [7, 0, 5]);
  assert.deepEqual(config.up, [0, 0, -1]);
  assert.equal(config.position[0], 7);
  assert.equal(config.position[1], 20);
  assert.equal(config.position[2], 5.001);
  assert.equal(config.enableRotate, false);
  assert.equal(config.zoom, 32);
});

test("top-down scene bounds derive directly from the shared editor project state", () => {
  const project = createEditorProject({
    projectId: "project-camera-bounds",
    floors: [
      {
        floorId: "floor-1",
        rooms: [
          {
            roomId: "room-1",
            roomPolygon: [
              { x: 200, y: 400 },
              { x: 700, y: 400 },
              { x: 700, y: 1000 },
              { x: 200, y: 1000 },
            ],
          },
        ],
      },
    ],
    exteriorPolygon: [
      { x: 100, y: 300 },
      { x: 900, y: 300 },
      { x: 900, y: 1200 },
      { x: 100, y: 1200 },
    ],
  });

  assert.deepEqual(resolveTopDownSceneBoundsFromProject(project), {
    minX: 1,
    maxX: 9,
    minZ: 3,
    maxZ: 12,
    width: 8,
    depth: 9,
    centerX: 5,
    centerZ: 7.5,
  });
});

test("perspective camera mode preserves the existing miniature viewer framing", () => {
  const config = resolveViewerCameraModeConfig({
    cameraMode: "perspective",
    sceneBounds: {
      minX: -6,
      maxX: 6,
      minZ: -4,
      maxZ: 4,
      width: 12,
      depth: 8,
      centerX: 0,
      centerZ: 0,
    },
    perspectivePosition: [7.6, 7.8, 8.4],
    perspectiveFov: 34,
    fixedPolarAngle: Math.PI / 3,
  });

  assert.equal(config.orthographic, false);
  assert.deepEqual(config.position, [7.6, 7.8, 8.4]);
  assert.deepEqual(config.up, [0, 1, 0]);
  assert.equal(config.fov, 34);
  assert.equal(config.enableRotate, true);
  assert.equal(config.zoom, undefined);
  assert.equal(config.minPolarAngle, Math.PI / 3);
  assert.equal(config.maxPolarAngle, Math.PI / 3);
});

test("camera mode switching preserves the shared scene graph while reconfiguring the viewport camera", () => {
  const sceneGraph = Object.freeze({
    sceneGraphId: "shared-r3f-scene",
  });
  const rendererSession = Object.freeze({
    renderer: Object.freeze({
      rendererId: "shared-webgl-renderer",
    }),
    renderState: Object.freeze({
      initializedPasses: Object.freeze(["main-scene", "contact-shadows"]),
      devicePixelRatio: 2,
    }),
  });
  const perspectiveViewport = resolveViewerViewportState({
    sceneGraph,
    cameraMode: "perspective",
    sceneBounds: {
      minX: -6,
      maxX: 6,
      minZ: -4,
      maxZ: 4,
      width: 12,
      depth: 8,
      centerX: 0,
      centerZ: 0,
    },
    perspectivePosition: [7.6, 7.8, 8.4],
    perspectiveFov: 34,
    fixedPolarAngle: Math.PI / 3,
    rendererSession,
  });
  const topDownViewport = switchViewerCameraMode({
    viewport: perspectiveViewport,
    nextCameraMode: "top-down-orthographic",
    sceneBounds: {
      minX: -6,
      maxX: 6,
      minZ: -4,
      maxZ: 4,
      width: 12,
      depth: 8,
      centerX: 0,
      centerZ: 0,
    },
    perspectivePosition: [7.6, 7.8, 8.4],
    perspectiveFov: 34,
    fixedPolarAngle: Math.PI / 3,
  });

  assert.equal(perspectiveViewport.sceneGraph, sceneGraph);
  assert.equal(topDownViewport.sceneGraph, sceneGraph);
  assert.equal(perspectiveViewport.sceneGraph, topDownViewport.sceneGraph);
  assert.equal(perspectiveViewport.rendererSession, rendererSession);
  assert.equal(topDownViewport.rendererSession, rendererSession);
  assert.equal(
    topDownViewport.rendererSession?.renderer,
    perspectiveViewport.rendererSession?.renderer,
  );
  assert.equal(
    topDownViewport.rendererSession?.renderState,
    perspectiveViewport.rendererSession?.renderState,
  );
  assert.notEqual(perspectiveViewport, topDownViewport);
  assert.equal(topDownViewport.cameraMode, "top-down-orthographic");
  assert.equal(perspectiveViewport.camera.orthographic, false);
  assert.equal(topDownViewport.camera.orthographic, true);
  assert.notDeepEqual(
    perspectiveViewport.camera.position,
    topDownViewport.camera.position,
  );
});

test("activating top-down mode updates the viewport camera configuration to an orthographic top-down projection", () => {
  const perspectiveViewport = resolveViewerViewportState({
    sceneGraph: Object.freeze({
      sceneGraphId: "shared-r3f-scene",
    }),
    cameraMode: "perspective",
    sceneBounds: {
      minX: -2,
      maxX: 10,
      minZ: -1,
      maxZ: 7,
      width: 12,
      depth: 8,
      centerX: 4,
      centerZ: 3,
    },
    perspectivePosition: [7.6, 7.8, 8.4],
    perspectiveFov: 34,
    fixedPolarAngle: Math.PI / 3,
  });

  const topDownViewport = switchViewerCameraMode({
    viewport: perspectiveViewport,
    nextCameraMode: "top-down-orthographic",
    sceneBounds: {
      minX: -2,
      maxX: 10,
      minZ: -1,
      maxZ: 7,
      width: 12,
      depth: 8,
      centerX: 4,
      centerZ: 3,
    },
    perspectivePosition: [7.6, 7.8, 8.4],
    perspectiveFov: 34,
    fixedPolarAngle: Math.PI / 3,
  });

  assert.equal(topDownViewport.cameraMode, "top-down-orthographic");
  assert.equal(topDownViewport.camera.orthographic, true);
  assert.deepEqual(topDownViewport.camera.position, [4, 28, 3.001]);
  assert.deepEqual(topDownViewport.camera.lookAt, [4, 0, 3]);
  assert.deepEqual(topDownViewport.camera.up, [0, 0, -1]);
  assert.equal(topDownViewport.camera.zoom, 32);
  assert.equal(topDownViewport.camera.enableRotate, false);
});

test("entering top-down mode reuses the existing Viewer25D scene graph instance for the active project scene", () => {
  const project = createEditorProject({
    projectId: "project-shared-scene-graph",
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
              { x: 500, y: 0 },
              { x: 500, y: 400 },
              { x: 0, y: 400 },
            ],
            openings: [],
          },
        ],
      },
    ],
    exteriorPolygon: [
      { x: -100, y: -100 },
      { x: 600, y: -100 },
      { x: 600, y: 500 },
      { x: -100, y: 500 },
    ],
    viewState: {
      activeFloorId: "floor-ground",
    },
  });
  const sceneGraph = createViewer25DSceneGraph({
    floors: project.floors,
    activeFloorId: project.viewState.activeFloorId,
    exteriorPolygon: project.exteriorPolygon,
    exteriorEdgeOpenings: project.exteriorEdgeOpenings,
    floorRenderOffsets: resolveViewer25DFloorRenderPlacements(
      project.floors,
      0.3,
    ).map((placement) => placement.renderVerticalOffset),
  });
  const perspectiveViewport = resolveViewerViewportState({
    sceneGraph,
    cameraMode: "perspective",
    sceneBounds: resolveTopDownSceneBoundsFromProject(project),
    perspectivePosition: [7.6, 7.8, 8.4],
    perspectiveFov: 34,
    fixedPolarAngle: Math.PI / 3,
  });
  const topDownViewport = switchViewerCameraMode({
    viewport: perspectiveViewport,
    nextCameraMode: "top-down-orthographic",
    sceneBounds: resolveTopDownSceneBoundsFromProject(project),
    perspectivePosition: [7.6, 7.8, 8.4],
    perspectiveFov: 34,
    fixedPolarAngle: Math.PI / 3,
  });

  assert.equal(topDownViewport.sceneGraph, sceneGraph);
  assert.equal(topDownViewport.sceneGraph, perspectiveViewport.sceneGraph);
  assert.equal(topDownViewport.sceneGraph.sceneGraphId, "viewer25d-shared-scene");
  assert.equal(topDownViewport.cameraMode, "top-down-orthographic");
});

test("switching from perspective to top-down preserves renderable scene geometry in the shared scene graph", () => {
  const project = createEditorProject({
    projectId: "project-mode-switch-geometry",
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
              { x: 500, y: 0 },
              { x: 500, y: 400 },
              { x: 0, y: 400 },
            ],
            openings: [
              {
                id: "opening-room-door",
                type: "door",
                x: 250,
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
            floorId: "floor-ground",
            roomId: "room-lobby",
            name: "Desk",
            position: { x: 120, y: 160 },
          },
        ],
        verticalConnectors: [
          {
            connectorId: "connector-core",
            connectorType: "stair",
            roomId: "room-lobby",
            targetFloorId: "floor-upper",
            position: { x: 360, y: 220 },
          },
        ],
      },
    ],
    exteriorPolygon: [
      { x: -100, y: -100 },
      { x: 600, y: -100 },
      { x: 600, y: 500 },
      { x: -100, y: 500 },
    ],
    exteriorEdgeOpenings: [
      {
        id: "opening-exterior-door",
        type: "door",
        x: -100,
        y: 200,
        angle: Math.PI / 2,
      },
    ],
    viewState: {
      activeFloorId: "floor-ground",
      selectedRoomId: "room-lobby",
    },
  });
  const sceneGraph = createViewer25DSceneGraph({
    floors: project.floors,
    activeFloorId: project.viewState.activeFloorId,
    exteriorPolygon: project.exteriorPolygon,
    exteriorEdgeOpenings: project.exteriorEdgeOpenings,
    floorRenderOffsets: resolveViewer25DFloorRenderPlacements(
      project.floors,
      0.3,
    ).map((placement) => placement.renderVerticalOffset),
  });
  const perspectiveViewport = resolveViewerViewportState({
    sceneGraph,
    cameraMode: "perspective",
    sceneBounds: resolveTopDownSceneBoundsFromProject(project),
    perspectivePosition: [7.6, 7.8, 8.4],
    perspectiveFov: 34,
    fixedPolarAngle: Math.PI / 3,
  });
  const topDownViewport = switchViewerCameraMode({
    viewport: perspectiveViewport,
    nextCameraMode: "top-down-orthographic",
    sceneBounds: resolveTopDownSceneBoundsFromProject(project),
    perspectivePosition: [7.6, 7.8, 8.4],
    perspectiveFov: 34,
    fixedPolarAngle: Math.PI / 3,
  });
  const perspectivePlan = resolveViewer25DRenderPlan({
    sceneGraph: perspectiveViewport.sceneGraph as ReturnType<
      typeof createViewer25DSceneGraph
    >,
    cameraMode: perspectiveViewport.cameraMode,
  });
  const topDownPlan = resolveViewer25DRenderPlan({
    sceneGraph: topDownViewport.sceneGraph as ReturnType<
      typeof createViewer25DSceneGraph
    >,
    cameraMode: topDownViewport.cameraMode,
  });

  assert.equal(topDownPlan.sceneGraph, perspectivePlan.sceneGraph);
  assert.equal(topDownPlan.roomNodes, perspectivePlan.roomNodes);
  assert.equal(topDownPlan.exteriorNode, perspectivePlan.exteriorNode);
  assert.equal(
    topDownPlan.exteriorOpeningNodes,
    perspectivePlan.exteriorOpeningNodes,
  );
  assert.equal(topDownPlan.guideObjectNodes, perspectivePlan.guideObjectNodes);
  assert.equal(
    topDownPlan.verticalConnectorNodes,
    perspectivePlan.verticalConnectorNodes,
  );
  assert.equal(topDownPlan.roomNodes[0]?.points, project.floors[0]?.rooms[0]?.roomPolygon);
  assert.equal(topDownPlan.roomNodes[0]?.openings, project.floors[0]?.rooms[0]?.openings);
  assert.equal(topDownPlan.exteriorNode?.points, project.exteriorPolygon);
  assert.equal(topDownPlan.exteriorOpeningNodes, project.exteriorEdgeOpenings);
  assert.equal(
    topDownPlan.guideObjectNodes[0]?.position,
    project.floors[0]?.guideObjects?.[0]?.position,
  );
  assert.equal(
    topDownPlan.verticalConnectorNodes[0]?.position,
    project.floors[0]?.verticalConnectors?.[0]?.position,
  );
});

test("camera mode switching updates the existing camera instance in place for top-down orthographic mode", () => {
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
  const updateProjectionMatrix = camera.updateProjectionMatrix.bind(camera);
  let updateProjectionMatrixCalls = 0;

  camera.updateProjectionMatrix = () => {
    updateProjectionMatrixCalls += 1;
    updateProjectionMatrix();
  };

  const topDownConfig = resolveViewerCameraModeConfig({
    cameraMode: "top-down-orthographic",
    sceneBounds: {
      minX: -3,
      maxX: 9,
      minZ: -2,
      maxZ: 6,
      width: 12,
      depth: 8,
      centerX: 3,
      centerZ: 2,
    },
    perspectivePosition: [7.6, 7.8, 8.4],
    perspectiveFov: 34,
    fixedPolarAngle: Math.PI / 3,
  });

  const updatedCamera = applyViewerCameraModeConfig(camera, topDownConfig);

  assert.equal(updatedCamera, camera);
  assert.equal(camera.position.x, 3);
  assert.equal(camera.position.y, 28);
  assert.equal(camera.position.z, 2.001);
  assert.deepEqual(camera.up.toArray(), [0, 0, -1]);
  assert.equal(camera.zoom, topDownConfig.zoom);
  assert.equal(camera.near, 0.1);
  assert.equal(camera.far, 96);
  assert.equal(updateProjectionMatrixCalls, 1);
});

test("camera mode switching does not invoke scene initialization or reload routines", () => {
  const lifecycleEvents: string[] = [];
  let initializeSceneCalls = 0;
  let reloadSceneCalls = 0;
  const sceneGraph = Object.freeze({
    sceneGraphId: "shared-r3f-scene",
  });
  const rendererSession = Object.freeze({
    renderer: Object.freeze({
      rendererId: "shared-webgl-renderer",
    }),
    renderState: Object.freeze({
      initializedPasses: Object.freeze(["main-scene", "contact-shadows"]),
      devicePixelRatio: 2,
    }),
    initializeScene: () => {
      initializeSceneCalls += 1;
      lifecycleEvents.push("scene-initialized");
    },
    reloadScene: () => {
      reloadSceneCalls += 1;
      lifecycleEvents.push("scene-reloaded");
    },
  });
  const perspectiveViewport = resolveViewerViewportState({
    sceneGraph,
    cameraMode: "perspective",
    sceneBounds: {
      minX: -6,
      maxX: 6,
      minZ: -4,
      maxZ: 4,
      width: 12,
      depth: 8,
      centerX: 0,
      centerZ: 0,
    },
    perspectivePosition: [7.6, 7.8, 8.4],
    perspectiveFov: 34,
    fixedPolarAngle: Math.PI / 3,
    rendererSession,
  });

  const topDownViewport = switchViewerCameraMode({
    viewport: perspectiveViewport,
    nextCameraMode: "top-down-orthographic",
    sceneBounds: {
      minX: -6,
      maxX: 6,
      minZ: -4,
      maxZ: 4,
      width: 12,
      depth: 8,
      centerX: 0,
      centerZ: 0,
    },
    perspectivePosition: [7.6, 7.8, 8.4],
    perspectiveFov: 34,
    fixedPolarAngle: Math.PI / 3,
  });

  assert.equal(topDownViewport.rendererSession, rendererSession);
  assert.equal(initializeSceneCalls, 0);
  assert.equal(reloadSceneCalls, 0);
  assert.deepEqual(lifecycleEvents, []);
});

test("entering and exiting top-down mode does not invoke renderer or scene initialization routines", () => {
  const lifecycleEvents: string[] = [];
  let initializeRendererCalls = 0;
  let initializeSceneCalls = 0;
  const sceneGraph = Object.freeze({
    sceneGraphId: "shared-r3f-scene",
  });
  const rendererSession = Object.freeze({
    renderer: Object.freeze({
      rendererId: "shared-webgl-renderer",
      initializeRenderer: () => {
        initializeRendererCalls += 1;
        lifecycleEvents.push("renderer-initialized");
      },
    }),
    renderState: Object.freeze({
      initializedPasses: Object.freeze(["main-scene", "contact-shadows"]),
      devicePixelRatio: 2,
    }),
    initializeScene: () => {
      initializeSceneCalls += 1;
      lifecycleEvents.push("scene-initialized");
    },
  });
  const sceneBounds = {
    minX: -6,
    maxX: 6,
    minZ: -4,
    maxZ: 4,
    width: 12,
    depth: 8,
    centerX: 0,
    centerZ: 0,
  } as const;
  const topDownViewport = resolveViewerViewportState({
    sceneGraph,
    cameraMode: "top-down-orthographic",
    sceneBounds,
    perspectivePosition: [7.6, 7.8, 8.4],
    perspectiveFov: 34,
    fixedPolarAngle: Math.PI / 3,
    rendererSession,
  });

  const perspectiveViewport = switchViewerCameraMode({
    viewport: topDownViewport,
    nextCameraMode: "perspective",
    sceneBounds,
    perspectivePosition: [7.6, 7.8, 8.4],
    perspectiveFov: 34,
    fixedPolarAngle: Math.PI / 3,
  });
  const returnedTopDownViewport = switchViewerCameraMode({
    viewport: perspectiveViewport,
    nextCameraMode: "top-down-orthographic",
    sceneBounds,
    perspectivePosition: [7.6, 7.8, 8.4],
    perspectiveFov: 34,
    fixedPolarAngle: Math.PI / 3,
  });

  assert.equal(perspectiveViewport.sceneGraph, sceneGraph);
  assert.equal(returnedTopDownViewport.sceneGraph, sceneGraph);
  assert.equal(perspectiveViewport.rendererSession, rendererSession);
  assert.equal(returnedTopDownViewport.rendererSession, rendererSession);
  assert.equal(initializeRendererCalls, 0);
  assert.equal(initializeSceneCalls, 0);
  assert.deepEqual(lifecycleEvents, []);
});

test("renderer mode switching keeps the shared 2.5D render pipeline and changes only view parameters", () => {
  const sharedSceneGraph = createViewer25DSceneGraph({
    floors: [
      {
        floorId: "floor-1",
        floorName: "Ground",
        floorHeight: 3.5,
        referenceImage: null,
        rooms: [
          {
            roomId: "room-1",
            roomName: "Lobby",
            roomPolygon: [
              { x: 0, y: 0 },
              { x: 6, y: 0 },
              { x: 6, y: 4 },
              { x: 0, y: 4 },
            ],
            sharedBoundaries: [],
            area: 24,
            labelPosition: null,
            openings: [
              {
                id: "opening-1",
                type: "door",
                x: 3,
                y: 0,
                angle: 0,
              },
            ],
          },
        ],
        guideObjects: [
          {
            guideObjectId: "guide-lobby-desk",
            guideObjectType: "furniture",
            floorId: "floor-1",
            roomId: "room-1",
            name: "Desk",
            position: { x: 2, y: 1.5 },
          },
        ],
        verticalConnectors: [
          {
            connectorId: "connector-core-1",
            connectorType: "stair",
            roomId: "room-1",
            targetFloorId: "floor-2",
            position: { x: 5, y: 3 },
          },
        ],
      },
    ],
    activeFloorId: "floor-1",
    exteriorPolygon: [
      { x: -1, y: -1 },
      { x: 7, y: -1 },
      { x: 7, y: 5 },
      { x: -1, y: 5 },
    ],
    exteriorEdgeOpenings: [
      {
        id: "exterior-opening-1",
        type: "window",
        x: 7,
        y: 2,
        angle: Math.PI / 2,
      },
    ],
    floorRenderOffsets: [0],
  });

  const perspectivePlan = resolveViewer25DRenderPlan({
    sceneGraph: sharedSceneGraph,
    cameraMode: "perspective",
  });
  const topDownPlan = resolveViewer25DRenderPlan({
    sceneGraph: sharedSceneGraph,
    cameraMode: "top-down-orthographic",
  });
  const perspectiveViewport = resolveViewerViewportState({
    sceneGraph: perspectivePlan.sceneGraph,
    cameraMode: perspectivePlan.cameraMode,
    sceneBounds: {
      minX: -1,
      maxX: 7,
      minZ: -1,
      maxZ: 5,
      width: 8,
      depth: 6,
      centerX: 3,
      centerZ: 2,
    },
    perspectivePosition: [7.6, 7.8, 8.4],
    perspectiveFov: 34,
    fixedPolarAngle: Math.PI / 3,
  });
  const topDownViewport = resolveViewerViewportState({
    sceneGraph: topDownPlan.sceneGraph,
    cameraMode: topDownPlan.cameraMode,
    sceneBounds: {
      minX: -1,
      maxX: 7,
      minZ: -1,
      maxZ: 5,
      width: 8,
      depth: 6,
      centerX: 3,
      centerZ: 2,
    },
    perspectivePosition: [7.6, 7.8, 8.4],
    perspectiveFov: 34,
    fixedPolarAngle: Math.PI / 3,
  });

  assert.equal(perspectivePlan.sceneGraph.sceneGraphId, "viewer25d-shared-scene");
  assert.equal(topDownPlan.sceneGraph.sceneGraphId, "viewer25d-shared-scene");
  assert.equal(perspectivePlan.sceneGraph, topDownPlan.sceneGraph);
  assert.equal(perspectivePlan.roomNodes, topDownPlan.roomNodes);
  assert.equal(perspectivePlan.exteriorNode, topDownPlan.exteriorNode);
  assert.equal(
    perspectivePlan.exteriorOpeningNodes,
    topDownPlan.exteriorOpeningNodes,
  );
  assert.equal(perspectivePlan.guideObjectNodes, topDownPlan.guideObjectNodes);
  assert.equal(
    perspectivePlan.verticalConnectorNodes,
    topDownPlan.verticalConnectorNodes,
  );
  assert.deepEqual(
    {
      sceneGraph: perspectivePlan.sceneGraph,
      roomNodes: perspectivePlan.roomNodes,
      exteriorNode: perspectivePlan.exteriorNode,
      exteriorOpeningNodes: perspectivePlan.exteriorOpeningNodes,
      guideObjectNodes: perspectivePlan.guideObjectNodes,
      verticalConnectorNodes: perspectivePlan.verticalConnectorNodes,
    },
    {
      sceneGraph: topDownPlan.sceneGraph,
      roomNodes: topDownPlan.roomNodes,
      exteriorNode: topDownPlan.exteriorNode,
      exteriorOpeningNodes: topDownPlan.exteriorOpeningNodes,
      guideObjectNodes: topDownPlan.guideObjectNodes,
      verticalConnectorNodes: topDownPlan.verticalConnectorNodes,
    },
  );
  assert.equal(perspectivePlan.cameraMode, "perspective");
  assert.equal(topDownPlan.cameraMode, "top-down-orthographic");
  assert.equal(perspectiveViewport.sceneGraph, topDownViewport.sceneGraph);
  assert.equal(perspectiveViewport.camera.orthographic, false);
  assert.equal(topDownViewport.camera.orthographic, true);
  assert.deepEqual(topDownViewport.camera.lookAt, [3, 0, 2]);
  assert.notDeepEqual(
    perspectiveViewport.camera.lookAt,
    topDownViewport.camera.lookAt,
  );
  assert.notDeepEqual(
    perspectiveViewport.camera.position,
    topDownViewport.camera.position,
  );
});
