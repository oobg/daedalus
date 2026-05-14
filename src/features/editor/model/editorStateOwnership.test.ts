import assert from "node:assert/strict";
import test from "node:test";

import {
  EDITOR_STATE_OWNERSHIP_BOUNDARIES,
  assertEditorStatePathOwnership,
  classifyEditorStatePath,
  getEditorStateOwnershipBoundary,
} from "./editorStateOwnership.ts";

test("editor state ownership boundaries define the four required state categories", () => {
  assert.deepEqual(
    EDITOR_STATE_OWNERSHIP_BOUNDARIES.map((boundary) => boundary.layer),
    [
      "canonical-editor-data",
      "derived-readonly-render-data",
      "selection-state",
      "transient-ui-interaction-state",
    ],
  );

  for (const boundary of EDITOR_STATE_OWNERSHIP_BOUNDARIES) {
    assert.ok(boundary.owner.length > 0);
    assert.ok(boundary.description.length > 0);
    assert.ok(boundary.ownedPaths.length > 0);
  }
});

test("canonical editor data owns the editable building-guide source of truth", () => {
  const boundary = getEditorStateOwnershipBoundary("canonical-editor-data");

  assert.equal(boundary.persistence, "project-json");
  assert.equal(boundary.mutability, "editable-source");
  assert.ok(boundary.ownedPaths.includes("project.floors[].rooms[].roomPolygon"));
  assert.ok(boundary.ownedPaths.includes("project.floors[].rooms[].sharedBoundaries"));
  assert.ok(boundary.ownedPaths.includes("project.floors[].rooms[].area"));
  assert.ok(boundary.ownedPaths.includes("project.floors[].rooms[].labelPosition"));
  assert.ok(boundary.excludedPaths.includes("renderScene"));
  assert.ok(boundary.excludedPaths.includes("activeTool"));
  assert.ok(boundary.excludedPaths.includes("draftPoints"));

  assertEditorStatePathOwnership(
    "project.floors[0].rooms[1].roomPolygon[2].x",
    "canonical-editor-data",
  );
  assertEditorStatePathOwnership(
    "project.floors[0].rooms[1].edgeOpenings[0].edgeRelativePosition",
    "canonical-editor-data",
  );
});

test("derived render data is read-only adapter output and does not own source geometry", () => {
  const boundary = getEditorStateOwnershipBoundary(
    "derived-readonly-render-data",
  );

  assert.equal(boundary.persistence, "derived-only");
  assert.equal(boundary.mutability, "readonly-derived");
  assert.ok(boundary.ownedPaths.includes("renderScene.floors[].rooms[].walls"));
  assert.ok(boundary.ownedPaths.includes("renderScene.floors[].rooms[].bounds"));
  assert.ok(boundary.ownedPaths.includes("renderScene.floors[].rooms[].openings[].anchor"));
  assert.ok(boundary.excludedPaths.includes("project.floors[].rooms[].roomPolygon"));
  assert.ok(boundary.excludedPaths.includes("project.floors[].rooms[].sharedBoundaries"));

  assertEditorStatePathOwnership(
    "renderScene.floors[0].rooms[0].walls[0].start.x",
    "derived-readonly-render-data",
  );
  assertEditorStatePathOwnership(
    "renderScene.floors[0].rooms[0].openings[0].anchor.x",
    "derived-readonly-render-data",
  );
});

test("selection and transient interaction state stay separate from geometry ownership", () => {
  const selectionBoundary = getEditorStateOwnershipBoundary("selection-state");
  const transientBoundary = getEditorStateOwnershipBoundary(
    "transient-ui-interaction-state",
  );

  assert.equal(selectionBoundary.persistence, "project-json");
  assert.equal(selectionBoundary.mutability, "ui-controlled");
  assert.ok(selectionBoundary.ownedPaths.includes("project.viewState.activeFloorId"));
  assert.ok(selectionBoundary.ownedPaths.includes("project.viewState.selectedRoomId"));
  assert.ok(selectionBoundary.excludedPaths.includes("project.floors[].rooms[].roomPolygon"));

  assert.equal(transientBoundary.persistence, "session-only");
  assert.equal(transientBoundary.mutability, "ui-controlled");
  assert.ok(transientBoundary.ownedPaths.includes("activeTool"));
  assert.ok(transientBoundary.ownedPaths.includes("isDrawing"));
  assert.ok(transientBoundary.ownedPaths.includes("draftPoints"));
  assert.ok(transientBoundary.excludedPaths.includes("project.viewState.activeFloorId"));

  assertEditorStatePathOwnership("project.viewState.activeFloorId", "selection-state");
  assertEditorStatePathOwnership("project.viewState.selectedRoomId", "selection-state");
  assertEditorStatePathOwnership("activeTool", "transient-ui-interaction-state");
  assertEditorStatePathOwnership("draftPoints[2].x", "transient-ui-interaction-state");
});

test("state path classifier leaves unknown and out-of-scope fields unowned", () => {
  assert.equal(classifyEditorStatePath("project.viewState.zoom"), "selection-state");
  assert.equal(classifyEditorStatePath("backend.syncStatus"), null);
  assert.equal(classifyEditorStatePath("shareUrl"), null);
});
