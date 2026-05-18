import assert from "node:assert/strict";
import test from "node:test";

import {
  beginRoomPolygonPointerDrawing,
  completeRoomPolygonPointerDrawing,
  updateRoomPolygonPointerDrawing,
} from "./roomPolygonPointerDrawing.ts";

test("room polygon pointer handlers start a room draft and record the first ordered vertex on the initial pointer action", () => {
  const initialState = {
    activeTool: "room",
    isDrawing: false,
    draftPoints: [],
    pointerSession: null,
  } as const;

  const begun = beginRoomPolygonPointerDrawing(initialState, { x: 12, y: 18 });

  assert.deepEqual(begun, {
    handled: true,
    started: true,
    placementPoint: { x: 12, y: 18 },
    state: {
      activeTool: "room",
      isDrawing: true,
      draftPoints: [{ x: 12, y: 18 }],
      pointerSession: {
        pointerDownPoint: { x: 12, y: 18 },
        pointerCurrentPoint: { x: 12, y: 18 },
      },
    },
  });
  assert.deepEqual(initialState.draftPoints, []);
});

test("room polygon pointer handlers do not create a duplicate vertex when the initial pointer action ends", () => {
  const begun = beginRoomPolygonPointerDrawing(
    {
      activeTool: "room",
      isDrawing: false,
      draftPoints: [],
      pointerSession: null,
    },
    { x: 12, y: 18 },
  );
  const completed = completeRoomPolygonPointerDrawing(begun.state, { x: 12, y: 18 });

  assert.deepEqual(completed, {
    handled: true,
    state: {
      activeTool: "room",
      isDrawing: true,
      draftPoints: [{ x: 12, y: 18 }],
      pointerSession: null,
    },
  });
});

test("room polygon pointer handlers create the next vertex from a pointer down/move/up sequence after the draft has started", () => {
  const initialState = {
    activeTool: "room",
    isDrawing: true,
    draftPoints: [{ x: 12, y: 18 }],
    pointerSession: null,
  } as const;

  const begun = beginRoomPolygonPointerDrawing(initialState, { x: 12, y: 18 });
  const moved = updateRoomPolygonPointerDrawing(begun.state, { x: 16, y: 22 });
  const completed = completeRoomPolygonPointerDrawing(moved.state, { x: 16, y: 22 });

  assert.equal(begun.handled, true);
  assert.equal(begun.started, false);
  assert.deepEqual(moved.state.pointerSession, {
    pointerDownPoint: { x: 12, y: 18 },
    pointerCurrentPoint: { x: 16, y: 22 },
  });
  assert.deepEqual(completed, {
    handled: true,
    placementPoint: { x: 16, y: 22 },
    state: {
      activeTool: "room",
      isDrawing: true,
      draftPoints: [{ x: 12, y: 18 }, { x: 16, y: 22 }],
      pointerSession: null,
    },
  });
});

test("room polygon pointer handlers preserve ordered vertex placement across repeated pointer sequences", () => {
  const first = completeRoomPolygonPointerDrawing(
    beginRoomPolygonPointerDrawing(
      {
        activeTool: "room",
        isDrawing: false,
        draftPoints: [],
        pointerSession: null,
      },
      { x: 10, y: 10 },
    ).state,
    { x: 10, y: 10 },
  );

  const second = completeRoomPolygonPointerDrawing(
    beginRoomPolygonPointerDrawing(first.state, { x: 40, y: 10 }).state,
    { x: 40, y: 10 },
  );

  const third = completeRoomPolygonPointerDrawing(
    beginRoomPolygonPointerDrawing(second.state, { x: 40, y: 44 }).state,
    { x: 40, y: 44 },
  );

  assert.deepEqual(third.state.draftPoints, [
    { x: 10, y: 10 },
    { x: 40, y: 10 },
    { x: 40, y: 44 },
  ]);
  assert.equal(third.state.isDrawing, true);
});

test("room polygon pointer handlers complete the draft when pointer up closes near the first vertex", () => {
  const completion = completeRoomPolygonPointerDrawing(
    {
      activeTool: "room",
      isDrawing: true,
      draftPoints: [
        { x: 24, y: 36 },
        { x: 72, y: 36 },
        { x: 72, y: 90 },
      ],
      pointerSession: {
        pointerDownPoint: { x: 26, y: 38 },
        pointerCurrentPoint: { x: 28, y: 40 },
      },
    },
    { x: 28, y: 40 },
  );

  assert.deepEqual(completion, {
    handled: true,
    completed: true,
    state: {
      activeTool: "room",
      isDrawing: false,
      draftPoints: [
        { x: 24, y: 36 },
        { x: 72, y: 36 },
        { x: 72, y: 90 },
      ],
      pointerSession: null,
    },
  });
});

test("room polygon pointer handlers reject duplicate release points and clear the active pointer session", () => {
  const duplicate = completeRoomPolygonPointerDrawing(
    {
      activeTool: "room",
      isDrawing: true,
      draftPoints: [
        { x: 10, y: 10 },
        { x: 40, y: 10 },
      ],
      pointerSession: {
        pointerDownPoint: { x: 10, y: 10 },
        pointerCurrentPoint: { x: 10, y: 10 },
      },
    },
    { x: 10, y: 10 },
  );

  assert.deepEqual(duplicate, {
    handled: true,
    error: "duplicate_point",
    state: {
      activeTool: "room",
      isDrawing: true,
      draftPoints: [
        { x: 10, y: 10 },
        { x: 40, y: 10 },
      ],
      pointerSession: null,
    },
  });
});

test("room polygon pointer handlers ignore pointer sequences when another tool is active", () => {
  const state = {
    activeTool: "select",
    isDrawing: false,
    draftPoints: [],
    pointerSession: null,
  } as const;

  const begun = beginRoomPolygonPointerDrawing(state, { x: 12, y: 18 });
  const moved = updateRoomPolygonPointerDrawing(state, { x: 16, y: 22 });
  const completed = completeRoomPolygonPointerDrawing(state, { x: 16, y: 22 });

  assert.equal(begun.handled, false);
  assert.equal(moved.handled, false);
  assert.equal(completed.handled, false);
  assert.equal(begun.state, state);
  assert.equal(moved.state, state);
  assert.equal(completed.state, state);
});
