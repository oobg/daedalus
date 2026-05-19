import assert from "node:assert/strict";
import test from "node:test";

import {
  adaptProjectSnapshotToRenderScene,
  createReadonlyEditorStateProjection,
  type RendererPort,
  type RenderSceneData,
  type RendererSnapshotProject,
} from "../src/features/renderer/index.ts";
import { createViewerComposition } from "../src/features/viewer/index.ts";
import { createEditorProject } from "../src/domain/editor-state.ts";
import {
  createViewer25DSceneGraph,
  resolveViewer25DRenderPlan,
  resolveViewer25DSceneGeometrySource,
} from "../src/components/viewer/viewer25dSceneGraph.ts";

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

test("viewer composition preserves distinct ordered floor, furniture, and wall layers in assembled viewer data", () => {
  const renderer: RendererPort<Readonly<RenderSceneData>> = {
    render(scene) {
      return scene;
    },
  };
  const viewer = createViewerComposition(renderer);
  const scene = adaptProjectSnapshotToRenderScene(createSnapshotProject());
  const layers =
    viewer.createLoadedSceneViewer(scene).getScene().floors[0].rooms[0].layers;

  assert.deepEqual(layers, {
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
  assert.deepEqual(
    [layers.floor.order, layers.furniture.order, layers.wall.order],
    [0, 1, 2],
  );
  assert.equal(layers.floor.baseElevation < layers.furniture.baseElevation, true);
  assert.equal(layers.furniture.baseElevation < layers.wall.baseElevation, true);
});

test("top-down viewer render planning reuses shared 2.5D scene nodes instead of a duplicate 2D source", () => {
  const project = createEditorProject({
    projectId: "project-shared-top-down",
    projectName: "Shared Top Down",
    objectVersion: 5,
    floors: [
      {
        floorId: "floor-1",
        floorName: "Ground",
        floorHeight: 3.5,
        rooms: [
          {
            roomId: "room-lobby",
            roomName: "Lobby",
            roomPolygon: [
              { x: 0, y: 0 },
              { x: 8, y: 0 },
              { x: 8, y: 6 },
              { x: 0, y: 6 },
            ],
            openings: [
              {
                id: "opening-lobby-door",
                type: "door",
                x: 4,
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
            roomId: "room-lobby",
            name: "Desk",
            position: { x: 2, y: 2 },
          },
        ],
        verticalConnectors: [
          {
            connectorId: "connector-core-1",
            connectorType: "stair",
            roomId: "room-lobby",
            targetFloorId: "floor-2",
            position: { x: 6, y: 4 },
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
      { x: 9, y: -1 },
      { x: 9, y: 7 },
      { x: -1, y: 7 },
    ],
    exteriorEdgeOpenings: [
      {
        id: "opening-exterior-door",
        type: "door",
        x: 0,
        y: 3,
        angle: 0,
      },
    ],
  });
  const projection = createReadonlyEditorStateProjection(project);
  const viewerScene = createViewerComposition({
    render(scene) {
      return scene;
    },
  }).createLoadedSceneViewer(adaptProjectSnapshotToRenderScene(projection.project));
  const sharedSceneGraph = createViewer25DSceneGraph({
    floors: project.floors,
    activeFloorId: project.viewState.activeFloorId,
    exteriorPolygon: project.exteriorPolygon,
    exteriorEdgeOpenings: project.exteriorEdgeOpenings,
    floorRenderOffsets: viewerScene
      .getScene()
      .floors.map((floor) => floor.renderVerticalOffset ?? 0),
  });

  const perspectivePlan = resolveViewer25DRenderPlan({
    sceneGraph: sharedSceneGraph,
    cameraMode: "perspective",
  });
  const topDownPlan = resolveViewer25DRenderPlan({
    sceneGraph: sharedSceneGraph,
    cameraMode: "top-down-orthographic",
  });

  assert.equal(perspectivePlan.sceneGraph, topDownPlan.sceneGraph);
  assert.equal(perspectivePlan.roomNodes, topDownPlan.roomNodes);
  assert.equal(topDownPlan.roomNodes[0].points, project.floors[0].rooms[0].roomPolygon);
  assert.equal(topDownPlan.roomNodes[0].openings, project.floors[0].rooms[0].openings);
  assert.equal(topDownPlan.exteriorNode?.points, project.exteriorPolygon);
  assert.equal(topDownPlan.exteriorOpeningNodes, project.exteriorEdgeOpenings);
  assert.equal(
    topDownPlan.guideObjectNodes[0]?.position,
    project.floors[0].guideObjects?.[0]?.position,
  );
  assert.equal(
    topDownPlan.verticalConnectorNodes[0]?.position,
    project.floors[0].verticalConnectors?.[0]?.position,
  );
  assert.equal("canvas2DNodes" in topDownPlan, false);
});

test("top-down scene geometry selection resolves to the standard shared 2.5D scene source", () => {
  const project = createEditorProject({
    projectId: "project-geometry-source",
    floors: [
      {
        floorId: "floor-1",
        floorName: "Ground",
        floorHeight: 3.5,
        rooms: [
          {
            roomId: "room-1",
            roomName: "Lobby",
            roomPolygon: [
              { x: 0, y: 0 },
              { x: 8, y: 0 },
              { x: 8, y: 6 },
              { x: 0, y: 6 },
            ],
            openings: [
              {
                id: "opening-1",
                type: "door",
                x: 4,
                y: 0,
                angle: 0,
              },
            ],
          },
        ],
        guideObjects: [
          {
            guideObjectId: "guide-1",
            guideObjectType: "furniture",
            floorId: "floor-1",
            roomId: "room-1",
            name: "Desk",
            position: { x: 2, y: 2 },
          },
        ],
        verticalConnectors: [
          {
            connectorId: "connector-1",
            connectorType: "stair",
            roomId: "room-1",
            targetFloorId: "floor-2",
            position: { x: 6, y: 4 },
          },
        ],
      },
    ],
    viewState: {
      activeFloorId: "floor-1",
      selectedRoomId: "room-1",
    },
    exteriorPolygon: [
      { x: -1, y: -1 },
      { x: 9, y: -1 },
      { x: 9, y: 7 },
      { x: -1, y: 7 },
    ],
    exteriorEdgeOpenings: [
      {
        id: "opening-exterior-1",
        type: "window",
        x: 9,
        y: 3,
        angle: Math.PI / 2,
      },
    ],
  });
  const sharedSceneGraph = createViewer25DSceneGraph({
    floors: project.floors,
    activeFloorId: project.viewState.activeFloorId,
    exteriorPolygon: project.exteriorPolygon,
    exteriorEdgeOpenings: project.exteriorEdgeOpenings,
    floorRenderOffsets: [0],
  });

  const standardSceneSource = resolveViewer25DSceneGeometrySource({
    sceneGraph: sharedSceneGraph,
    cameraMode: "perspective",
  });
  const topDownSceneSource = resolveViewer25DSceneGeometrySource({
    sceneGraph: sharedSceneGraph,
    cameraMode: "top-down-orthographic",
  });

  assert.equal(topDownSceneSource.sceneGraph, standardSceneSource.sceneGraph);
  assert.equal(topDownSceneSource.roomNodes, standardSceneSource.roomNodes);
  assert.equal(topDownSceneSource.exteriorNode, standardSceneSource.exteriorNode);
  assert.equal(
    topDownSceneSource.exteriorOpeningNodes,
    standardSceneSource.exteriorOpeningNodes,
  );
  assert.equal(
    topDownSceneSource.guideObjectNodes,
    standardSceneSource.guideObjectNodes,
  );
  assert.equal(
    topDownSceneSource.verticalConnectorNodes,
    standardSceneSource.verticalConnectorNodes,
  );
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
            ],
            openings: [],
          },
        ],
        verticalConnectors: [],
      },
    ],
  };
}

function createSnapshotProject(): RendererSnapshotProject {
  return {
    projectId: "project-layers",
    projectName: "Layer Study",
    objectVersion: 1,
    floors: [
      {
        floorId: "floor-1",
        floorName: "Ground",
        floorHeight: 3.5,
        referenceImage: null,
        rooms: [
          {
            roomId: "room-lounge",
            roomName: "Lounge",
            roomPolygon: [
              { x: 0, y: 0 },
              { x: 8, y: 0 },
              { x: 8, y: 6 },
              { x: 0, y: 6 },
              { x: 0, y: 0 },
            ],
            sharedBoundaries: [],
            area: 48,
            labelPosition: { x: 4, y: 3 },
          },
        ],
      },
    ],
    viewState: {
      activeFloorId: "floor-1",
      selectedRoomId: "room-lounge",
    },
  };
}
