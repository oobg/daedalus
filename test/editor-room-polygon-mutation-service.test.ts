import assert from "node:assert/strict";
import test from "node:test";

import { createEditorRoomPolygonMutationService } from "../src/domain/editor-room-polygon-mutation-service.ts";

test("room-polygon source-of-truth snapshots are read-only outside the mutation service", () => {
  const service = createEditorRoomPolygonMutationService({
    projectId: "project-1",
    floors: [
      {
        floorId: "floor-1",
        rooms: [
          {
            roomId: "room-1",
            roomPolygon: [
              { x: 0, y: 0 },
              { x: 4, y: 0 },
              { x: 4, y: 4 },
              { x: 0, y: 4 },
            ],
          },
        ],
      },
    ],
  });

  const snapshot = service.getSnapshot();

  assert.throws(
    () => {
      (
        snapshot.project.floors[0].rooms[0].roomPolygon[0] as {
          x: number;
          y: number;
        }
      ).x = 99;
    },
    /Cannot assign to read only property/,
  );

  assert.deepEqual(snapshot.project.floors[0].rooms[0].roomPolygon, [
    { x: 0, y: 0 },
    { x: 4, y: 0 },
    { x: 4, y: 4 },
    { x: 0, y: 4 },
  ]);
});

test("room-polygon source-of-truth updates can occur through the exported mutation functions", () => {
  const service = createEditorRoomPolygonMutationService({
    projectId: "project-1",
    floors: [
      {
        floorId: "floor-1",
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
          },
        ],
      },
    ],
  });

  const added = service.addRoom("floor-1", {
    roomId: "room-2",
    roomName: "Office",
    roomPolygon: [
      { x: 6, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 4 },
      { x: 6, y: 4 },
    ],
  });
  assert.equal(added.project.floors[0].rooms.length, 2);

  const updated = service.updateRoomPolygon("floor-1", "room-1", [
    { x: 0, y: 0 },
    { x: 8, y: 0 },
    { x: 8, y: 4 },
    { x: 0, y: 4 },
  ]);

  assert.deepEqual(updated.project.floors[0].rooms[0].roomPolygon, [
    { x: 0, y: 0 },
    { x: 8, y: 0 },
    { x: 8, y: 4 },
    { x: 0, y: 4 },
  ]);
  assert.equal(updated.project.floors[0].rooms[0].area, 32);
  assert.deepEqual(updated.project.floors[0].rooms[0].labelPosition, {
    x: 4,
    y: 2,
  });

  const removed = service.removeRoom("floor-1", "room-2");
  assert.deepEqual(
    removed.project.floors[0].rooms.map((room) => room.roomId),
    ["room-1"],
  );
});

test("previous read-only snapshots stay unchanged after later room-polygon mutations", () => {
  const service = createEditorRoomPolygonMutationService({
    projectId: "project-1",
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
            ],
          },
        ],
      },
    ],
  });

  const before = service.getSnapshot();
  const after = service.updateRoomPolygon("floor-1", "room-1", [
    { x: 0, y: 0 },
    { x: 7, y: 0 },
    { x: 7, y: 5 },
    { x: 0, y: 5 },
  ]);

  assert.deepEqual(before.project.floors[0].rooms[0].roomPolygon, [
    { x: 0, y: 0 },
    { x: 5, y: 0 },
    { x: 5, y: 5 },
    { x: 0, y: 5 },
  ]);
  assert.deepEqual(after.project.floors[0].rooms[0].roomPolygon, [
    { x: 0, y: 0 },
    { x: 7, y: 0 },
    { x: 7, y: 5 },
    { x: 0, y: 5 },
  ]);
  assert.notDeepEqual(
    before.project.floors[0].rooms[0].roomPolygon,
    after.project.floors[0].rooms[0].roomPolygon,
  );
});
