import assert from "node:assert/strict";
import test from "node:test";

import {
  formatFloorHeightEditorValue,
  parseFloorHeightEditorValue,
} from "./floorHeightEditing.ts";

test("parseFloorHeightEditorValue accepts positive floor heights for source updates", () => {
  assert.equal(parseFloorHeightEditorValue("3"), 3);
  assert.equal(parseFloorHeightEditorValue(" 4.25 "), 4.25);
  assert.equal(parseFloorHeightEditorValue("0.5"), 0.5);
});

test("parseFloorHeightEditorValue rejects empty, non-numeric, and non-positive edits", () => {
  for (const value of ["", " ", "height", "0", "-1", "NaN", "Infinity"]) {
    assert.equal(parseFloorHeightEditorValue(value), null);
  }
});

test("formatFloorHeightEditorValue mirrors valid source floor heights into the editor field", () => {
  assert.equal(formatFloorHeightEditorValue(3), "3");
  assert.equal(formatFloorHeightEditorValue(4.25), "4.25");
  assert.equal(formatFloorHeightEditorValue(Number.NaN), "");
  assert.equal(formatFloorHeightEditorValue(0), "");
});
