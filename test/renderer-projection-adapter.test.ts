import assert from "node:assert/strict";
import test from "node:test";

import { createEditorProject } from "../src/domain/editor-state.ts";
import {
  adaptProjectSnapshotToRenderScene,
  adaptReadonlyEditorStateProjectionToRenderScene,
  createReadonlyEditorStateProjection,
} from "../src/features/renderer/index.ts";

test("adaptReadonlyEditorStateProjectionToRenderScene accepts normalized readonly editor output and returns the top-level render payload", () => {
  const projection = createReadonlyEditorStateProjection(
    createEditorProject({
      projectId: "project-viewer-export",
      projectName: "Viewer Export Center",
      objectVersion: 9,
      floors: [
        {
          floorId: "floor-1",
          floorName: "Ground",
          floorHeight: 3,
          referenceImage: "floor-plan://viewer-export/floor-1.png",
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
              sharedBoundaries: [
                {
                  edgeId: "room-lobby:edge:1",
                  roomId: "room-lobby",
                  adjacentRoomId: "room-office",
                  adjacentEdgeId: "room-office:edge:3",
                },
              ],
              edgeOpenings: [
                {
                  openingId: "opening-main-door",
                  openingType: "door",
                  attachedEdgeId: "room-lobby:edge:0",
                  edgeRelativePosition: 0.25,
                },
              ],
            },
          ],
          verticalConnectors: [
            {
              connectorId: "connector-elevator-1",
              connectorType: "elevator",
              roomId: "room-lobby",
              targetFloorId: "floor-2",
              position: { x: 3, y: 2 },
            },
          ],
        },
      ],
      viewState: {
        activeFloorId: "floor-1",
        selectedRoomId: "room-lobby",
      },
      metadata: {
        editorOnly: true,
      },
    }),
    {
      projectedAt: new Date("2026-05-18T08:00:00.000Z"),
      consumers: ["viewer", "renderer"],
    },
  );

  const payload = adaptReadonlyEditorStateProjectionToRenderScene(projection);

  assert.deepEqual(payload, {
    projectId: "project-viewer-export",
    projectName: "Viewer Export Center",
    objectVersion: 9,
    activeFloorId: "floor-1",
    selectedRoomId: "room-lobby",
    floors: [
      {
        floorId: "floor-1",
        floorName: "Ground",
        floorHeight: 3,
        verticalOffset: 0,
        renderHeight: 0.9,
        renderVerticalOffset: 0,
        referenceImage: "floor-plan://viewer-export/floor-1.png",
        isActive: true,
        rooms: [
          {
            roomId: "room-lobby",
            roomName: "Lobby",
            polygon: [
              { x: 0, y: 0 },
              { x: 10, y: 0 },
              { x: 10, y: 8 },
              { x: 0, y: 8 },
            ],
            boundaries: [
              {
                edgeId: "room-lobby:edge:1",
                adjacentRoomId: "room-office",
                adjacentEdgeId: "room-office:edge:3",
              },
            ],
            area: 80,
            labelPosition: { x: 5, y: 4 },
            bounds: {
              minX: 0,
              minY: 0,
              maxX: 10,
              maxY: 8,
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
                edgeId: "room-lobby:edge:0",
                start: { x: 0, y: 0 },
                end: { x: 10, y: 0 },
              },
              {
                edgeId: "room-lobby:edge:1",
                start: { x: 10, y: 0 },
                end: { x: 10, y: 8 },
              },
              {
                edgeId: "room-lobby:edge:2",
                start: { x: 10, y: 8 },
                end: { x: 0, y: 8 },
              },
              {
                edgeId: "room-lobby:edge:3",
                start: { x: 0, y: 8 },
                end: { x: 0, y: 0 },
              },
            ],
            openings: [
              {
                openingId: "opening-main-door",
                openingType: "door",
                attachedEdgeId: "room-lobby:edge:0",
                edgeRelativePosition: 0.25,
                anchor: { x: 2.5, y: 0 },
              },
            ],
          },
        ],
        verticalConnectors: [
          {
            connectorId: "connector-elevator-1",
            connectorType: "elevator",
            roomId: "room-lobby",
            targetFloorId: "floor-2",
            position: { x: 3, y: 2 },
          },
        ],
      },
    ],
  });
});

test("adaptReadonlyEditorStateProjectionToRenderScene stays a pure adapter over the readonly projection envelope", () => {
  const projection = createReadonlyEditorStateProjection(
    createEditorProject({
      projectId: "project-pure-adapter",
      floors: [{ floorId: "floor-1" }],
    }),
  );

  const expected = adaptProjectSnapshotToRenderScene(projection.project);
  const payload = adaptReadonlyEditorStateProjectionToRenderScene(projection);

  assert.deepEqual(payload, expected);
  assert.equal(Object.isFrozen(payload), true);
  assert.equal(Object.isFrozen(payload.floors), true);
  assert.equal(Object.isFrozen(payload.floors[0]), true);
});
