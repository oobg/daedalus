import assert from "node:assert/strict";
import test from "node:test";

import {
  createValidatedEditorOpening,
  validateEditorOpeningInput,
} from "../src/domain/opening.ts";

test("validateEditorOpeningInput accepts a valid window opening for object creation", () => {
  const result = validateEditorOpeningInput({
    openingId: "opening-gallery-window",
    openingType: "window",
    attachedEdgeId: "edge-gallery-west",
    edgeRelativePosition: 0.25,
  });

  assert.deepEqual(result, {
    ok: true,
    value: {
      openingId: "opening-gallery-window",
      openingType: "window",
      attachedEdgeId: "edge-gallery-west",
      edgeRelativePosition: 0.25,
    },
  });
});

test("createValidatedEditorOpening creates a normalized window object", () => {
  const opening = createValidatedEditorOpening({
    openingId: " opening-atrium-window ",
    openingType: "window",
    attachedEdgeId: " edge-atrium-north ",
    edgeRelativePosition: 1,
  });

  assert.deepEqual(opening, {
    openingId: "opening-atrium-window",
    openingType: "window",
    attachedEdgeId: "edge-atrium-north",
    edgeRelativePosition: 1,
  });
});

test("validateEditorOpeningInput rejects invalid window creation when the relative edge position is out of range", () => {
  const result = validateEditorOpeningInput({
    openingId: "opening-gallery-window",
    openingType: "window",
    attachedEdgeId: "edge-gallery-west",
    edgeRelativePosition: 1.25,
  });

  assert.deepEqual(result, {
    ok: false,
    error: {
      code: "invalid_opening_position",
      message:
        "Opening edge relative position must be a finite number between 0 and 1.",
    },
  });
});

test("createValidatedEditorOpening rejects invalid window creation when the attached edge id is blank", () => {
  assert.throws(
    () =>
      createValidatedEditorOpening({
        openingId: "opening-gallery-window",
        openingType: "window",
        attachedEdgeId: "   ",
        edgeRelativePosition: 0.4,
      }),
    /Opening attached edge id must be a non-empty string\./,
  );
});
