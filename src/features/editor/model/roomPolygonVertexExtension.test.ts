import assert from "node:assert/strict";
import test from "node:test";

import { extendActiveRoomPolygonDraft } from "./roomPolygonVertexExtension.ts";

test("extendActiveRoomPolygonDraft appends subsequent pointer vertices in source order for the active room draft", () => {
  const firstExtension = extendActiveRoomPolygonDraft(
    {
      activeTool: "room",
      isDrawing: true,
      draftPoints: [{ x: 12, y: 18 }],
    },
    { x: 48, y: 18 },
  );

  const secondExtension = extendActiveRoomPolygonDraft(firstExtension.state, {
    x: 48,
    y: 52,
  });

  const thirdExtension = extendActiveRoomPolygonDraft(secondExtension.state, {
    x: 16,
    y: 56,
  });

  assert.equal(firstExtension.handled, true);
  assert.equal(thirdExtension.completed, undefined);
  assert.deepEqual(thirdExtension.state, {
    activeTool: "room",
    isDrawing: true,
    draftPoints: [
      { x: 12, y: 18 },
      { x: 48, y: 18 },
      { x: 48, y: 52 },
      { x: 16, y: 56 },
    ],
  });
});

test("extendActiveRoomPolygonDraft ignores extension input when no active room draft exists yet", () => {
  const state = {
    activeTool: "room",
    isDrawing: false,
    draftPoints: [],
  } as const;

  const result = extendActiveRoomPolygonDraft(state, { x: 12, y: 18 });

  assert.deepEqual(result, {
    handled: false,
    state,
  });
});
