import assert from "node:assert/strict";
import test from "node:test";

import {
  createRendererEntrypoint,
  renderProjectSnapshot,
  type RendererPort,
  type RendererSnapshotProject,
  type RenderSceneData,
} from "../src/features/renderer/index.ts";

test("createRendererEntrypoint delegates renderScene through the supplied renderer port", () => {
  const calls: RenderSceneData[] = [];
  const renderer: RendererPort<string> = {
    render(scene) {
      calls.push(scene);
      return `${scene.projectId}:${scene.floors.length}`;
    },
  };

  const entrypoint = createRendererEntrypoint(renderer);
  const scene: RenderSceneData = {
    projectId: "project-scene",
    projectName: "Scene Project",
    objectVersion: 1,
    activeFloorId: "floor-1",
    selectedRoomId: null,
    floors: [],
  };

  const result = entrypoint.renderScene(scene);

  assert.equal(result, "project-scene:0");
  assert.deepEqual(calls, [scene]);
});

test("renderProjectSnapshot adapts snapshot input before delegating to the renderer port", () => {
  const renderer: RendererPort<Readonly<RenderSceneData>> = {
    render(scene) {
      return scene;
    },
  };

  const result = renderProjectSnapshot(createSnapshotProject(), renderer);

  assert.equal(result.activeFloorId, "floor-2");
  assert.equal(result.floors[0].isActive, false);
  assert.equal(result.floors[1].isActive, true);
  assert.deepEqual(result.floors[0].rooms[0].openings[0].anchor, {
    x: 8,
    y: 3,
  });
});

test("compatible renderer implementations can be swapped without changing the caller", () => {
  const project = createSnapshotProject();
  const sceneRenderer: RendererPort<string> = {
    render(scene) {
      const activeFloor = scene.floors.find((floor) => floor.isActive);
      return `scene:${activeFloor?.floorId ?? "none"}:${scene.floors.length}`;
    },
  };
  const exportRenderer: RendererPort<string> = {
    render(scene) {
      return JSON.stringify({
        projectId: scene.projectId,
        selectedRoomId: scene.selectedRoomId,
        roomCount: scene.floors.reduce(
          (count, floor) => count + floor.rooms.length,
          0,
        ),
      });
    },
  };

  const renderWith = (
    renderer: RendererPort<string>,
    input: RendererSnapshotProject,
  ): string => createRendererEntrypoint(renderer).renderProjectSnapshot(input);

  assert.equal(renderWith(sceneRenderer, project), "scene:floor-2:2");
  assert.equal(
    renderWith(exportRenderer, project),
    JSON.stringify({
      projectId: "project-atlas",
      selectedRoomId: "room-gallery",
      roomCount: 2,
    }),
  );
});

function createSnapshotProject(): RendererSnapshotProject {
  return {
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
}
