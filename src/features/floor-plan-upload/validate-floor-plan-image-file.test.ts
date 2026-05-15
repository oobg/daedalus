import test from "node:test";
import assert from "node:assert/strict";

import {
  validateFloorPlanImageFile,
  ACCEPTED_FLOOR_PLAN_IMAGE_TYPES,
  ACCEPTED_FLOOR_PLAN_IMAGE_EXTENSIONS,
  isSupportedFloorPlanImageFileType,
} from "./validate-floor-plan-image-file.ts";
import {
  createInitialFloorPlanUploadState,
  validateFloorPlanImageSelection,
} from "./floor-plan-upload-state.ts";

test("accepts a supported non-empty floor plan image file", () => {
  const file = new File(["binary"], "level-1.png", { type: "image/png" });
  const result = validateFloorPlanImageFile(file);

  assert.equal(result.ok, true);
  assert.equal(result.code, "valid");
  assert.equal(result.file, file);
});

test("rejects when no file is provided", () => {
  const result = validateFloorPlanImageFile(null);

  assert.equal(result.ok, false);
  assert.equal(result.code, "missing_file");
});

test("rejects empty files", () => {
  const file = new File([""], "empty.png", { type: "image/png" });
  const result = validateFloorPlanImageFile(file);

  assert.equal(result.ok, false);
  assert.equal(result.code, "empty_file");
});

test("rejects unsupported file types with an explicit validation result", () => {
  const file = new File(["vector"], "plan.svg", { type: "image/svg+xml" });
  const result = validateFloorPlanImageFile(file);

  assert.equal(result.ok, false);
  assert.equal(result.code, "unsupported_type");
  assert.match(result.message, /PNG, JPG, JPEG, or WebP/);
});

test("rejects files above the upload size limit", () => {
  const file = new File([new Uint8Array(10 * 1024 * 1024 + 1)], "large.png", {
    type: "image/png",
  });
  const result = validateFloorPlanImageFile(file);

  assert.equal(result.ok, false);
  assert.equal(result.code, "file_too_large");
});

test("exposes the accepted MIME types as a stable contract", () => {
  assert.deepEqual(ACCEPTED_FLOOR_PLAN_IMAGE_TYPES, [
    "image/png",
    "image/jpeg",
    "image/webp",
  ]);
});

test("exposes the accepted file extensions as a stable contract", () => {
  assert.deepEqual(ACCEPTED_FLOOR_PLAN_IMAGE_EXTENSIONS, [
    ".png",
    ".jpg",
    ".jpeg",
    ".webp",
  ]);
});

test("accepts supported file extensions when the MIME type is unavailable", () => {
  const file = new File(["binary"], "level-1.JPEG", { type: "" });
  const result = validateFloorPlanImageFile(file);

  assert.equal(result.ok, true);
  assert.equal(result.code, "valid");
});

test("rejects unsupported file extensions when the MIME type is unavailable", () => {
  const file = new File(["binary"], "level-1.gif", { type: "" });
  const result = validateFloorPlanImageFile(file);

  assert.equal(result.ok, false);
  assert.equal(result.code, "unsupported_type");
});

test("reports support for accepted MIME types and extensions", () => {
  assert.equal(
    isSupportedFloorPlanImageFileType({
      name: "level-1.floorplan",
      type: "image/png",
    } as File),
    true,
  );
  assert.equal(
    isSupportedFloorPlanImageFileType({
      name: "level-1.webp",
      type: "",
    } as File),
    true,
  );
  assert.equal(
    isSupportedFloorPlanImageFileType({
      name: "level-1.gif",
      type: "image/gif",
    } as File),
    false,
  );
});

test("initial upload state starts invalid until a file is selected", () => {
  const state = createInitialFloorPlanUploadState();

  assert.equal(state.selectedFile, null);
  assert.equal(state.validation.ok, false);
  assert.equal(state.validation.code, "missing_file");
});

test("selection state keeps the accepted file and validation result together", () => {
  const file = new File(["binary"], "level-2.webp", { type: "image/webp" });
  const state = validateFloorPlanImageSelection(file);

  assert.equal(state.selectedFile, file);
  assert.equal(state.validation.ok, true);
  assert.equal(state.validation.code, "valid");
});

test("selection state clears invalid uploads", () => {
  const file = new File(["binary"], "level-2.gif", { type: "image/gif" });
  const state = validateFloorPlanImageSelection(file);

  assert.equal(state.selectedFile, null);
  assert.equal(state.validation.ok, false);
  assert.equal(state.validation.code, "unsupported_type");
});
