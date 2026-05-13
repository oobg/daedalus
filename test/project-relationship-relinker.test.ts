import assert from "node:assert/strict";
import test from "node:test";

import {
  getProjectRelationshipGraph,
  relinkProjectRelationships,
} from "../src/features/project-export/project-relationship-relinker.ts";
import {
  restoreProjectFromImport,
  serializeProjectForExport,
  type SerializedProjectData,
} from "../src/features/project-export/project-serializer.ts";

function createSerializedProject(): SerializedProjectData {
  return {
    projectId: "project-links",
    projectName: "Relationship Links",
    objectVersion: 3,
    floors: [
      {
        floorId: "floor-1",
        floorName: "Ground Floor",
        floorHeight: 3.5,
        referenceImage: "floor-plan://project-links/floor-1.png",
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
          {
            roomId: "room-gallery",
            roomName: "Gallery",
            roomPolygon: [
              { x: 8, y: 0 },
              { x: 14, y: 0 },
              { x: 14, y: 6 },
              { x: 8, y: 6 },
              { x: 8, y: 0 },
            ],
            sharedBoundaries: [
              {
                edgeId: "edge-gallery-west",
                adjacentRoomId: "room-lobby",
                adjacentEdgeId: "edge-lobby-east",
              },
            ],
            area: 36,
            labelPosition: { x: 11, y: 3 },
            walls: [
              {
                edgeId: "edge-gallery-west",
                start: { x: 8, y: 6 },
                end: { x: 8, y: 0 },
              },
            ],
            openings: [
              {
                openingId: "opening-gallery-window",
                openingType: "window",
                attachedEdgeId: "edge-gallery-west",
                edgeRelativePosition: 0.25,
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
        floorName: "Second Floor",
        floorHeight: 4,
        referenceImage: null,
        rooms: [],
        verticalConnectors: [],
      },
    ],
    viewState: {
      activeFloorId: "floor-1",
      zoom: 1,
      pan: { x: 0, y: 0 },
      uploadedProjectName: null,
    },
    assets: [
      {
        assetId: "asset-floor-1-plan",
        assetType: "reference-image",
        floorId: "floor-1",
        fileName: "ground-floor.png",
        mimeType: "image/png",
        size: 2048,
        storageKey: "daedalus.floorPlanAsset:asset-floor-1-plan",
        assetRef: "floor-plan://project-links/floor-1.png",
      },
    ],
    annotations: [
      {
        annotationId: "annotation-lobby-label",
        floorId: "floor-1",
        annotationType: "label",
        text: "Lobby",
        targetRoomId: "room-lobby",
        position: { x: 4, y: 3 },
        color: "#123456",
        isVisible: true,
      },
    ],
    editorConfig: {
      selectedTool: "select",
      snapToGrid: false,
      gridSize: 16,
      showGrid: true,
      showReferenceImages: true,
      showRoomLabels: true,
    },
  };
}

test("restoreProjectFromImport re-links hydrated ids to floors, rooms, and referenced objects", () => {
  const project = restoreProjectFromImport(createSerializedProject());
  const graph = getProjectRelationshipGraph(project);

  assert.equal(graph.floorById.get("floor-1"), project.floors[0]);
  assert.equal(graph.roomById.get("room-lobby"), project.floors[0].rooms[0]);
  assert.equal(graph.roomFloorById.get("room-gallery"), project.floors[0]);

  const openingLink = graph.openingById.get("opening-lobby-door");
  assert.equal(openingLink?.room, project.floors[0].rooms[0]);
  assert.equal(openingLink?.floor, project.floors[0]);
  assert.equal(openingLink?.wall, project.floors[0].rooms[0].walls[0]);

  const boundaryLink = graph.boundaryByEdgeId.get("edge-lobby-east");
  assert.equal(boundaryLink?.room, project.floors[0].rooms[0]);
  assert.equal(boundaryLink?.adjacentRoom, project.floors[0].rooms[1]);
  assert.equal(boundaryLink?.adjacentFloor, project.floors[0]);

  const connectorLink = graph.connectorById.get("connector-stair-1");
  assert.equal(connectorLink?.room, project.floors[0].rooms[0]);
  assert.equal(connectorLink?.targetFloor, project.floors[1]);

  const assetLink = graph.assetById.get("asset-floor-1-plan");
  assert.equal(assetLink?.floor, project.floors[0]);

  const annotationLink = graph.annotationById.get("annotation-lobby-label");
  assert.equal(annotationLink?.floor, project.floors[0]);
  assert.equal(annotationLink?.room, project.floors[0].rooms[0]);
});

test("relinkProjectRelationships refreshes connections after hydrated editor objects change", () => {
  const project = restoreProjectFromImport(createSerializedProject());
  const nextFloor = project.floors[1];
  const connector = project.floors[0].verticalConnectors[0];

  connector.targetFloorId = nextFloor.id;
  project.annotations?.push({
    annotationId: "annotation-missing-room",
    floorId: "floor-2",
    annotationType: "note",
    text: "Detached",
    targetRoomId: "room-missing",
    position: { x: 1, y: 1 },
    color: "#654321",
    isVisible: true,
  });

  relinkProjectRelationships(project);
  const graph = getProjectRelationshipGraph(project);

  assert.equal(graph.connectorById.get("connector-stair-1")?.targetFloor, nextFloor);
  assert.equal(graph.annotationById.get("annotation-missing-room")?.floor, nextFloor);
  assert.equal(graph.annotationById.get("annotation-missing-room")?.room, null);
});

test("relationship graph attachment stays out of exported JSON shape", () => {
  const project = restoreProjectFromImport(createSerializedProject());
  const graph = getProjectRelationshipGraph(project);

  assert.equal(graph.openingByEdgeId.get("edge-lobby-east")?.length, 1);

  const serialized = serializeProjectForExport(project);

  assert.equal("floorById" in serialized, false);
  assert.equal(
    JSON.stringify(serialized).includes("projectRelationshipGraph"),
    false,
  );
});
