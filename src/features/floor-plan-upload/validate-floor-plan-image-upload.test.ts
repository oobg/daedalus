import test from "node:test";
import assert from "node:assert/strict";

import {
  ACCEPTED_FLOOR_PLAN_IMAGE_EXTENSIONS,
  ACCEPTED_FLOOR_PLAN_IMAGE_TYPES,
  isSupportedFloorPlanImageFileType,
  validateFloorPlanImageUpload,
} from "./validate-floor-plan-image-upload.ts";
import {
  createCorruptPngTestFile,
  createJpegTestFile,
  createPngTestFile,
} from "./test-floor-plan-image-fixtures.ts";

test("accepts a supported non-empty floor plan upload within the size limit", async () => {
  const file = createPngTestFile("level-1.png");
  const result = await validateFloorPlanImageUpload(file);

  assert.equal(result.ok, true);
  assert.equal(result.code, "valid");
  assert.equal(result.file, file);
});

test("rejects when no floor plan upload file is provided", async () => {
  const result = await validateFloorPlanImageUpload(null);

  assert.equal(result.ok, false);
  assert.equal(result.code, "missing_file");
});

test("rejects empty floor plan uploads before size validation", async () => {
  const file = new File([""], "empty.png", { type: "image/png" });
  const result = await validateFloorPlanImageUpload(file);

  assert.equal(result.ok, false);
  assert.equal(result.code, "empty_file");
});

test("rejects unsupported floor plan upload types", async () => {
  const file = new File(["vector"], "plan.svg", { type: "image/svg+xml" });
  const result = await validateFloorPlanImageUpload(file);

  assert.equal(result.ok, false);
  assert.equal(result.code, "unsupported_type");
  assert.match(result.message, /PNG, JPG, JPEG, or WebP/);
});

test("rejects floor plan uploads above the configured size limit", async () => {
  const file = new File([new Uint8Array(10 * 1024 * 1024 + 1)], "large.png", {
    type: "image/png",
  });
  const result = await validateFloorPlanImageUpload(file);

  assert.equal(result.ok, false);
  assert.equal(result.code, "file_too_large");
});

test("accepts supported file extensions when the MIME type is unavailable", async () => {
  const file = createJpegTestFile("level-1.JPEG", "");
  const result = await validateFloorPlanImageUpload(file);

  assert.equal(result.ok, true);
  assert.equal(result.code, "valid");
});

test("rejects corrupt uploads even when the MIME type and extension look valid", async () => {
  const file = createCorruptPngTestFile("corrupt-level.png");
  const result = await validateFloorPlanImageUpload(file);

  assert.equal(result.ok, false);
  assert.equal(result.code, "invalid_image_content");
  assert.match(result.message, /could not be validated/i);
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
