import assert from "node:assert/strict";
import test from "node:test";

import { createEditorProject } from "../../../domain/editor-state.ts";
import {
  executeEditorCommand,
  executeEditorCommands,
} from "./editingCommands.ts";

test("room polygon update commands synchronize shared boundaries and recalculate room metadata", () => {
  const project = createEditorProject({
    projectId: "project-command-shared-boundary",
    floors: [
      {
        floorId: "floor-1",
        rooms: [
          {
            roomId: "room-1",
            roomName: "Reception",
            roomPolygon: [
              { x: 0, y: 0 },
              { x: 4, y: 0 },
              { x: 4, y: 4 },
              { x: 0, y: 4 },
            ],
            sharedBoundaries: [
              {
                edgeId: "room-1:east",
                roomId: "room-1",
                adjacentRoomId: "room-2",
                adjacentEdgeId: "room-2:west",
              },
            ],
            edgeOpenings: [
              {
                openingId: "door-1",
                openingType: "door",
                attachedEdgeId: "room-1:east",
                edgeRelativePosition: 0.25,
              },
            ],
          },
          {
            roomId: "room-2",
            roomName: "Office",
            roomPolygon: [
              { x: 4, y: 0 },
              { x: 8, y: 0 },
              { x: 8, y: 4 },
              { x: 4, y: 4 },
            ],
            sharedBoundaries: [
              {
                edgeId: "room-2:west",
                roomId: "room-2",
                adjacentRoomId: "room-1",
                adjacentEdgeId: "room-1:east",
              },
            ],
          },
        ],
      },
    ],
  });

  const nextProject = executeEditorCommand(project, {
    type: "room.polygon.update",
    floorId: "floor-1",
    roomId: "room-1",
    roomPolygon: [
      { x: 0, y: 0 },
      { x: 5, y: 1 },
      { x: 5, y: 5 },
      { x: 0, y: 4 },
    ],
  });

  const [reception, office] = nextProject.floors[0].rooms;

  assert.deepEqual(reception.roomPolygon.slice(1, 3), [
    { x: 5, y: 1 },
    { x: 5, y: 5 },
  ]);
  assert.deepEqual([office.roomPolygon[3], office.roomPolygon[0]], [
    { x: 5, y: 5 },
    { x: 5, y: 1 },
  ]);
  assert.deepEqual(reception.edgeOpenings, [
    {
      openingId: "door-1",
      openingType: "door",
      attachedEdgeId: "room-1:east",
      edgeRelativePosition: 0.25,
    },
  ]);
  assert.equal(reception.area, 20);
  assert.deepEqual(reception.labelPosition, { x: 2.5, y: 2.5 });
  assert.equal(office.area, 12);
  assert.deepEqual(office.labelPosition, { x: 6.5, y: 2.5 });
  assert.deepEqual(project.floors[0].rooms[1].roomPolygon[0], { x: 4, y: 0 });
});

test("edge opening commands mutate attached objects without replacing room polygons", () => {
  const project = createEditorProject({
    projectId: "project-command-openings",
    floors: [
      {
        floorId: "floor-1",
        rooms: [
          {
            roomId: "room-1",
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

  const withOpening = executeEditorCommand(project, {
    type: "opening.add",
    floorId: "floor-1",
    roomId: "room-1",
    opening: {
      openingId: "window-1",
      openingType: "window",
      attachedEdgeId: "room-1:north",
      edgeRelativePosition: 0.5,
    },
  });
  const movedOpening = executeEditorCommand(withOpening, {
    type: "opening.update",
    floorId: "floor-1",
    roomId: "room-1",
    openingId: "window-1",
    patch: {
      edgeRelativePosition: 0.75,
    },
  });
  const removedOpening = executeEditorCommand(movedOpening, {
    type: "opening.remove",
    floorId: "floor-1",
    roomId: "room-1",
    openingId: "window-1",
  });

  assert.deepEqual(withOpening.floors[0].rooms[0].edgeOpenings, [
    {
      openingId: "window-1",
      openingType: "window",
      attachedEdgeId: "room-1:north",
      edgeRelativePosition: 0.5,
    },
  ]);
  assert.deepEqual(movedOpening.floors[0].rooms[0].edgeOpenings, [
    {
      openingId: "window-1",
      openingType: "window",
      attachedEdgeId: "room-1:north",
      edgeRelativePosition: 0.75,
    },
  ]);
  assert.equal(removedOpening.floors[0].rooms[0].edgeOpenings, undefined);
  assert.deepEqual(project.floors[0].rooms[0].roomPolygon, [
    { x: 0, y: 0 },
    { x: 6, y: 0 },
    { x: 6, y: 4 },
    { x: 0, y: 4 },
  ]);
});

test("guide object commands are floor scoped and immutable", () => {
  const project = createEditorProject({
    projectId: "project-command-objects",
    floors: [
      {
        floorId: "floor-1",
      },
      {
        floorId: "floor-2",
      },
    ],
  });

  const withObject = executeEditorCommand(project, {
    type: "object.add",
    floorId: "floor-2",
    object: {
      guideObjectId: "object-1",
      guideObjectType: "service",
      floorId: "ignored-floor",
      roomId: null,
      name: "Information Desk",
      position: { x: 10, y: 12 },
    },
  });
  const renamedObject = executeEditorCommand(withObject, {
    type: "object.update",
    floorId: "floor-2",
    guideObjectId: "object-1",
    patch: {
      name: "Reception Desk",
      position: { x: 14, y: 16 },
    },
  });
  const withoutObject = executeEditorCommand(renamedObject, {
    type: "object.remove",
    floorId: "floor-2",
    guideObjectId: "object-1",
  });

  assert.equal(withObject.floors[0], project.floors[0]);
  assert.deepEqual(withObject.floors[1].guideObjects, [
    {
      guideObjectId: "object-1",
      guideObjectType: "service",
      floorId: "floor-2",
      roomId: null,
      name: "Information Desk",
      position: { x: 10, y: 12 },
    },
  ]);
  assert.deepEqual(renamedObject.floors[1].guideObjects, [
    {
      guideObjectId: "object-1",
      guideObjectType: "service",
      floorId: "floor-2",
      roomId: null,
      name: "Reception Desk",
      position: { x: 14, y: 16 },
    },
  ]);
  assert.deepEqual(withoutObject.floors[1].guideObjects, []);
  assert.equal(project.floors[1].guideObjects, undefined);
});

test("executeEditorCommands applies room and object mutations in order", () => {
  const project = createEditorProject({
    projectId: "project-command-sequence",
    floors: [
      {
        floorId: "floor-1",
      },
    ],
  });

  const nextProject = executeEditorCommands(project, [
    {
      type: "room.add",
      floorId: "floor-1",
      room: {
        roomId: "room-1",
        roomName: "Draft Room",
        roomPolygon: [
          { x: 0, y: 0 },
          { x: 4, y: 0 },
          { x: 4, y: 4 },
          { x: 0, y: 4 },
        ],
      },
    },
    {
      type: "room.rename",
      floorId: "floor-1",
      roomId: "room-1",
      roomName: "Lobby",
    },
    {
      type: "object.add",
      floorId: "floor-1",
      object: {
        guideObjectId: "label-1",
        guideObjectType: "label",
        floorId: "floor-1",
        roomId: "room-1",
        name: "Main Lobby",
        position: { x: 2, y: 2 },
      },
    },
  ]);

  assert.equal(nextProject.floors[0].rooms[0].roomName, "Lobby");
  assert.equal(nextProject.floors[0].rooms[0].area, 16);
  assert.deepEqual(nextProject.floors[0].guideObjects?.[0], {
    guideObjectId: "label-1",
    guideObjectType: "label",
    floorId: "floor-1",
    roomId: "room-1",
    name: "Main Lobby",
    position: { x: 2, y: 2 },
  });
});
