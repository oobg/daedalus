import assert from "node:assert/strict";
import test from "node:test";

import { collectRoomOutlinePoint } from "./roomOutlinePointCollection.ts";

test("collectRoomOutlinePoint records ordered room outline points in editor state", () => {
  const initialState = {
    activeTool: "room",
    isDrawing: false,
    draftPoints: [],
  } as const;

  const firstCapture = collectRoomOutlinePoint(initialState, { x: 12, y: 18 });
  const secondCapture = collectRoomOutlinePoint(firstCapture.state, { x: 48, y: 18 });
  const thirdCapture = collectRoomOutlinePoint(secondCapture.state, { x: 48, y: 52 });

  assert.equal(firstCapture.handled, true);
  assert.equal(thirdCapture.completed, undefined);
  assert.deepEqual(thirdCapture.state, {
    activeTool: "room",
    isDrawing: true,
    draftPoints: [
      { x: 12, y: 18 },
      { x: 48, y: 18 },
      { x: 48, y: 52 },
    ],
  });
  assert.deepEqual(initialState.draftPoints, []);
});

test("collectRoomOutlinePoint marks the outline complete when the first point is clicked again", () => {
  const capture = collectRoomOutlinePoint(
    {
      activeTool: "room",
      isDrawing: true,
      draftPoints: [
        { x: 12, y: 18 },
        { x: 48, y: 18 },
        { x: 48, y: 52 },
      ],
    },
    { x: 12, y: 18 },
  );

  assert.deepEqual(capture, {
    handled: true,
    completed: true,
    state: {
      activeTool: "room",
      isDrawing: false,
      draftPoints: [
        { x: 12, y: 18 },
        { x: 48, y: 18 },
        { x: 48, y: 52 },
      ],
    },
  });
});
