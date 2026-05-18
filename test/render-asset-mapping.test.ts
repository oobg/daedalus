import assert from "node:assert/strict";
import test from "node:test";

import { createEditorProject } from "../src/domain/editor-state.ts";
import {
  RENDERER_CONTRACT_FIELDS,
  createReadonlyEditorStateProjection,
  mapProjectSnapshotToRenderAssetMetadata,
  mapReadonlyEditorStateProjectionToRenderAssetMetadata,
} from "../src/features/renderer/index.ts";

test("mapReadonlyEditorStateProjectionToRenderAssetMetadata derives readonly viewer/export asset metadata from normalized editor objects", () => {
  const projection = createReadonlyEditorStateProjection(
    createEditorProject({
      projectId: "project-render-assets",
      projectName: "Render Asset Tower",
      objectVersion: 12,
      floors: [
        {
          floorId: "floor-1",
          floorName: "Ground",
          floorHeight: 3.5,
          referenceImage: "floor-plan://render-assets/ground.png",
          rooms: [
            {
              roomId: "room-lobby",
              roomName: "Lobby",
              roomPolygon: [
                { x: 0, y: 0 },
                { x: 12, y: 0 },
                { x: 12, y: 8 },
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
                  openingId: "opening-front-door",
                  openingType: "door",
                  attachedEdgeId: "room-lobby:edge:0",
                  edgeRelativePosition: 0.25,
                },
              ],
              openings: [
                {
                  id: "editor-canvas-marker",
                  type: "door",
                  x: 24,
                  y: 0,
                  angle: 0,
                },
              ],
              metadata: {
                notes: "editor-only-room-notes",
              },
            },
          ],
          verticalConnectors: [
            {
              connectorId: "connector-stair-1",
              connectorType: "stair",
              roomId: "room-lobby",
              targetFloorId: "floor-2",
              position: { x: 3, y: 2 },
            },
          ],
          guideObjects: [
            {
              guideObjectId: "guide-poi-1",
              guideObjectType: "point-of-interest",
              floorId: "floor-1",
              roomId: "room-lobby",
              name: "Desk",
              position: { x: 2, y: 2 },
            },
          ],
        },
        {
          floorId: "floor-2",
          floorName: "Upper",
          floorHeight: 4,
          rooms: [
            {
              roomId: "room-office",
              roomName: "Office",
              roomPolygon: [
                { x: 4, y: 2 },
                { x: 10, y: 2 },
                { x: 10, y: 6 },
                { x: 4, y: 6 },
                { x: 4, y: 2 },
              ],
            },
          ],
        },
      ],
      viewState: {
        activeFloorId: "floor-2",
        selectedRoomId: "room-office",
      },
      exteriorPolygon: [
        { x: -2, y: -2 },
        { x: 14, y: -2 },
        { x: 14, y: 10 },
        { x: -2, y: 10 },
      ],
      metadata: {
        notes: "editor-only-project-notes",
      },
    }),
    {
      projectedAt: new Date("2026-05-18T10:00:00.000Z"),
      consumers: ["viewer", "renderer"],
    },
  );

  const renderAssets =
    mapReadonlyEditorStateProjectionToRenderAssetMetadata(projection);

  assert.deepEqual(renderAssets, {
    projectionVersion: 1,
    projectedAt: "2026-05-18T10:00:00.000Z",
    consumers: ["viewer", "renderer"],
    project: {
      projectId: "project-render-assets",
      projectName: "Render Asset Tower",
      objectVersion: 12,
      defaultFloorId: "floor-2",
      floors: [
        {
          assetId: "floor:floor-1",
          floorId: "floor-1",
          floorName: "Ground",
          floorHeight: 3.5,
          referenceImage: "floor-plan://render-assets/ground.png",
          isActive: false,
          verticalOffset: 0,
          renderHeight: 1.05,
          renderVerticalOffset: 0,
          roomCount: 1,
          openingCount: 1,
          verticalConnectorCount: 1,
          roomAssetIds: ["room:floor-1:room-lobby"],
          openingAssetIds: ["opening:floor-1:room-lobby:opening-front-door"],
          verticalConnectorAssetIds: ["connector:floor-1:connector-stair-1"],
          bounds: {
            minX: 0,
            minY: 0,
            maxX: 12,
            maxY: 8,
          },
        },
        {
          assetId: "floor:floor-2",
          floorId: "floor-2",
          floorName: "Upper",
          floorHeight: 4,
          referenceImage: null,
          isActive: true,
          verticalOffset: 3.5,
          renderHeight: 1.2,
          renderVerticalOffset: 1.05,
          roomCount: 1,
          openingCount: 0,
          verticalConnectorCount: 0,
          roomAssetIds: ["room:floor-2:room-office"],
          openingAssetIds: [],
          verticalConnectorAssetIds: [],
          bounds: {
            minX: 4,
            minY: 2,
            maxX: 10,
            maxY: 6,
          },
        },
      ],
      rooms: [
        {
          assetId: "room:floor-1:room-lobby",
          floorId: "floor-1",
          roomId: "room-lobby",
          roomName: "Lobby",
          area: 96,
          polygonVertexCount: 4,
          sharedBoundaryCount: 1,
          wallEdgeIds: [
            "room-lobby:edge:0",
            "room-lobby:edge:1",
            "room-lobby:edge:2",
            "room-lobby:edge:3",
          ],
          openingAssetIds: ["opening:floor-1:room-lobby:opening-front-door"],
          bounds: {
            minX: 0,
            minY: 0,
            maxX: 12,
            maxY: 8,
          },
          label: {
            text: "Lobby",
            position: { x: 6, y: 4 },
          },
        },
        {
          assetId: "room:floor-2:room-office",
          floorId: "floor-2",
          roomId: "room-office",
          roomName: "Office",
          area: 24,
          polygonVertexCount: 4,
          sharedBoundaryCount: 0,
          wallEdgeIds: [
            "room-office:edge:0",
            "room-office:edge:1",
            "room-office:edge:2",
            "room-office:edge:3",
          ],
          openingAssetIds: [],
          bounds: {
            minX: 4,
            minY: 2,
            maxX: 10,
            maxY: 6,
          },
          label: {
            text: "Office",
            position: { x: 7, y: 4 },
          },
        },
      ],
      openings: [
        {
          assetId: "opening:floor-1:room-lobby:opening-front-door",
          floorId: "floor-1",
          roomId: "room-lobby",
          openingId: "opening-front-door",
          openingType: "door",
          attachedEdgeId: "room-lobby:edge:0",
          edgeRelativePosition: 0.25,
          anchor: { x: 3, y: 0 },
        },
      ],
      verticalConnectors: [
        {
          assetId: "connector:floor-1:connector-stair-1",
          floorId: "floor-1",
          connectorId: "connector-stair-1",
          connectorType: "stair",
          roomId: "room-lobby",
          targetFloorId: "floor-2",
          position: { x: 3, y: 2 },
        },
      ],
    },
  });

  assert.equal("selectedRoomId" in renderAssets.project, false);
  assert.equal("metadata" in renderAssets.project, false);
  assert.equal("exteriorPolygon" in renderAssets.project, false);
  assert.equal(
    JSON.stringify(renderAssets).includes("editor-only-project-notes"),
    false,
  );
  assert.equal(
    JSON.stringify(renderAssets).includes("editor-canvas-marker"),
    false,
  );
  assert.equal(
    JSON.stringify(renderAssets).includes("guide-poi-1"),
    false,
  );
  assertNoCallables(renderAssets);
  assert.equal(Object.isFrozen(renderAssets), true);
  assert.equal(Object.isFrozen(renderAssets.project), true);
  assert.equal(Object.isFrozen(renderAssets.project.floors), true);
  assert.equal(Object.isFrozen(renderAssets.project.rooms[0]), true);
});

test("mapProjectSnapshotToRenderAssetMetadata stays a pure snapshot mapper and omits editor-only envelope state", () => {
  const projection = createReadonlyEditorStateProjection(
    createEditorProject({
      projectId: "project-snapshot-assets",
      floors: [
        {
          floorId: "floor-1",
          rooms: [
            {
              roomId: "room-1",
              roomPolygon: [
                { x: 0, y: 0 },
                { x: 5, y: 0 },
                { x: 5, y: 5 },
                { x: 0, y: 5 },
                { x: 0, y: 0 },
              ],
            },
          ],
        },
      ],
    }),
  );

  const assetProject = mapProjectSnapshotToRenderAssetMetadata(projection.project);

  assert.deepEqual(RENDERER_CONTRACT_FIELDS.assetMapping, [
    "projectionVersion",
    "projectedAt",
    "consumers",
    "project",
  ]);
  assert.deepEqual(RENDERER_CONTRACT_FIELDS.assetProject, [
    "projectId",
    "projectName",
    "objectVersion",
    "defaultFloorId",
    "floors",
    "rooms",
    "openings",
    "verticalConnectors",
  ]);
  assert.equal(assetProject.projectId, "project-snapshot-assets");
  assert.equal(assetProject.defaultFloorId, "floor-1");
  assert.equal("projectedAt" in assetProject, false);
  assert.equal("consumers" in assetProject, false);
});

function assertNoCallables(value: unknown): void {
  if (value == null) {
    return;
  }

  if (typeof value === "function") {
    assert.fail("render asset mapping must not expose callables");
  }

  if (typeof value !== "object") {
    return;
  }

  for (const nestedValue of Object.values(value)) {
    assertNoCallables(nestedValue);
  }
}
