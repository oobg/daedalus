import assert from "node:assert/strict";
import test from "node:test";

import {
  createValidatedEditorRoom,
  validateEditorRoomInput,
} from "../src/domain/editor-room.ts";
import { createEditorState } from "../src/domain/editor-state.ts";

test("validateEditorRoomInput accepts valid room data and preserves room shape for creation", () => {
  const result = validateEditorRoomInput({
    roomId: "room-1",
    roomName: "Lobby",
    roomPolygon: [
      { x: 0, y: 0 },
      { x: 8, y: 0 },
      { x: 8, y: 4 },
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
  });

  assert.equal(result.ok, true);

  if (!result.ok) {
    throw new Error("Expected valid room input.");
  }

  assert.deepEqual(result.value, {
    roomId: "room-1",
    roomName: "Lobby",
    roomPolygon: [
      { x: 0, y: 0 },
      { x: 8, y: 0 },
      { x: 8, y: 4 },
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
  });

  const room = createValidatedEditorRoom(result.value);

  assert.equal(room.area, 32);
  assert.deepEqual(room.labelPosition, { x: 4, y: 2 });
});

test("validateEditorRoomInput rejects invalid room polygon data", () => {
  const result = validateEditorRoomInput({
    roomId: "room-1",
    roomPolygon: [
      { x: 0, y: 0 },
      { x: 8, y: 0 },
    ],
  });

  assert.deepEqual(result, {
    ok: false,
    error: {
      code: "invalid_room_polygon",
      message: "Room polygon must contain at least 3 points.",
    },
  });
});

test("createEditorState uses validated room creation when loading project rooms", () => {
  assert.throws(
    () =>
      createEditorState({
        projectId: "project-invalid",
        floors: [
          {
            floorId: "floor-1",
            rooms: [
              {
                roomId: "room-1",
                roomPolygon: [
                  { x: 0, y: 0 },
                  { x: 4, y: 0 },
                ],
              },
            ],
          },
        ],
      }),
    /Room polygon must contain at least 3 points\./,
  );
});
