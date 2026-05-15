import test from "node:test";
import assert from "node:assert/strict";

import {
  ACCEPTED_FLOOR_PLAN_IMAGE_EXTENSIONS,
  ACCEPTED_FLOOR_PLAN_IMAGE_TYPES,
  isSupportedFloorPlanImageFileType,
  validateFloorPlanImageUpload,
} from "./validate-floor-plan-image-upload.ts";

test("accepts a supported non-empty floor plan upload within the size limit", () => {
  const file = new File(["binary"], "level-1.png", { type: "image/png" });
  const result = validateFloorPlanImageUpload(file);

  assert.equal(result.ok, true);
  assert.equal(result.code, "valid");
  assert.equal(result.file, file);
});

test("rejects when no floor plan upload file is provided", () => {
  const result = validateFloorPlanImageUpload(null);

  assert.equal(result.ok, false);
  assert.equal(result.code, "missing_file");
});

test("rejects empty floor plan uploads before size validation", () => {
  const file = new File([""], "empty.png", { type: "image/png" });
  const result = validateFloorPlanImageUpload(file);

  assert.equal(result.ok, false);
  assert.equal(result.code, "empty_file");
});

test("rejects unsupported floor plan upload types", () => {
  const file = new File(["vector"], "plan.svg", { type: "image/svg+xml" });
  const result = validateFloorPlanImageUpload(file);

  assert.equal(result.ok, false);
  assert.equal(result.code, "unsupported_type");
  assert.match(result.message, /PNG, JPG, JPEG, or WebP/);
});

test("rejects floor plan uploads above the configured size limit", () => {
  const file = new File([new Uint8Array(10 * 1024 * 1024 + 1)], "large.png", {
    type: "image/png",
  });
  const result = validateFloorPlanImageUpload(file);

  assert.equal(result.ok, false);
  assert.equal(result.code, "file_too_large");
});

test("accepts supported file extensions when the MIME type is unavailable", () => {
  const file = new File(["binary"], "level-1.JPEG", { type: "" });
  const result = validateFloorPlanImageUpload(file);

  assert.equal(result.ok, true);
  assert.equal(result.code, "valid");
});

test("exposes the accepted MIME types and extensions as stable upload contracts", () => {
  assert.deepEqual(ACCEPTED_FLOOR_PLAN_IMAGE_TYPES, [
    "image/png",
    "image/jpeg",
    "image/webp",
  ]);
  assert.deepEqual(ACCEPTED_FLOOR_PLAN_IMAGE_EXTENSIONS, [
    ".png",
    ".jpg",
    ".jpeg",
    ".webp",
  ]);
});

test("reports support for accepted upload MIME types and extensions", () => {
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
