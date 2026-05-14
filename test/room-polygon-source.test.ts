import assert from "node:assert/strict";
import test from "node:test";

import {
  ROOM_POLYGON_SOURCE_FIELD,
  createRoomPolygonMapGeometry,
  createRoomPolygonSource,
  deriveRoomPolygonGeometry,
  getRoomPolygonEdgeId,
  replaceRoomPolygonSource,
} from "../src/domain/room-polygon-source.ts";

test("room polygon source keeps polygon vertices as the authoritative editable geometry", () => {
  const input = {
    roomId: "room-1",
    roomPolygon: [
      { x: 0, y: 0 },
      { x: 8, y: 0 },
      { x: 8, y: 4 },
      { x: 0, y: 4 },
    ],
    sharedBoundaries: [
      {
        edgeId: "room-1:edge:1",
        roomId: "room-1",
        adjacentRoomId: "room-2",
        adjacentEdgeId: "room-2:edge:3",
      },
    ],
    openings: [
      {
        openingId: "door-1",
        openingType: "door",
        attachedEdgeId: "room-1:edge:1",
        edgeRelativePosition: 0.25,
      },
    ],
  } as const;

  const source = createRoomPolygonSource(input);

  assert.equal(ROOM_POLYGON_SOURCE_FIELD, "roomPolygon");
  assert.deepEqual(source, input);
  assert.notEqual(source.roomPolygon, input.roomPolygon);
  assert.notEqual(source.sharedBoundaries, input.sharedBoundaries);
  assert.notEqual(source.openings, input.openings);
});

test("room polygon map geometry derives area label and walls from the source polygon", () => {
  const geometry = createRoomPolygonMapGeometry({
    roomId: "room-1",
    roomPolygon: [
      { x: 0, y: 0 },
      { x: 6, y: 0 },
      { x: 6, y: 3 },
      { x: 0, y: 3 },
    ],
  });

  assert.equal(geometry.derivedGeometry.area, 18);
  assert.deepEqual(geometry.derivedGeometry.labelPosition, { x: 3, y: 1.5 });
  assert.deepEqual(
    geometry.derivedGeometry.walls.map((wall) => wall.edgeId),
    [
      "room-1:edge:0",
      "room-1:edge:1",
      "room-1:edge:2",
      "room-1:edge:3",
    ],
  );
});

test("derived walls are outputs and are not required in the source data", () => {
  const derived = deriveRoomPolygonGeometry({
    roomId: "room-1",
    roomPolygon: [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 4, y: 3 },
      { x: 0, y: 0 },
    ],
  });

  assert.deepEqual(derived.walls, [
    {
      edgeId: "room-1:edge:0",
      start: { x: 0, y: 0 },
      end: { x: 4, y: 0 },
    },
    {
      edgeId: "room-1:edge:1",
      start: { x: 4, y: 0 },
      end: { x: 4, y: 3 },
    },
    {
      edgeId: "room-1:edge:2",
      start: { x: 4, y: 3 },
      end: { x: 0, y: 0 },
    },
  ]);
});

test("replacing the source polygon preserves shared-boundary and opening attachments", () => {
  const source = createRoomPolygonSource({
    roomId: "room-1",
    roomPolygon: [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 4, y: 4 },
      { x: 0, y: 4 },
    ],
    sharedBoundaries: [
      {
        edgeId: getRoomPolygonEdgeId("room-1", 1),
        roomId: "room-1",
        adjacentRoomId: "room-2",
        adjacentEdgeId: getRoomPolygonEdgeId("room-2", 3),
      },
    ],
    openings: [
      {
        openingId: "window-1",
        openingType: "window",
        attachedEdgeId: getRoomPolygonEdgeId("room-1", 1),
        edgeRelativePosition: 0.5,
      },
    ],
  });

  const next = replaceRoomPolygonSource(source, [
    { x: 0, y: 0 },
    { x: 5, y: 1 },
    { x: 5, y: 5 },
    { x: 0, y: 4 },
  ]);

  assert.deepEqual(next.sharedBoundaries, source.sharedBoundaries);
  assert.deepEqual(next.openings, source.openings);
  assert.notEqual(next.sharedBoundaries, source.sharedBoundaries);
  assert.notEqual(next.openings, source.openings);
  assert.equal(next.derivedGeometry.area, 20);
  assert.deepEqual(next.derivedGeometry.labelPosition, { x: 2.5, y: 2.5 });
});
