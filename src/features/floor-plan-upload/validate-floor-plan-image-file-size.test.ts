import test from "node:test";
import assert from "node:assert/strict";

import {
  MAX_FLOOR_PLAN_IMAGE_SIZE_BYTES,
  validateFloorPlanImageFileSize,
} from "./validate-floor-plan-image-file-size.ts";

test("accepts uploads that are within the configured size limit", () => {
  const result = validateFloorPlanImageFileSize({
    size: MAX_FLOOR_PLAN_IMAGE_SIZE_BYTES,
  } as File);

  assert.equal(result.ok, true);
  assert.equal(result.code, "within_size_limit");
  assert.equal(result.fileSizeBytes, MAX_FLOOR_PLAN_IMAGE_SIZE_BYTES);
  assert.equal(result.maxSizeBytes, MAX_FLOOR_PLAN_IMAGE_SIZE_BYTES);
});

test("rejects uploads that exceed the configured size limit", () => {
  const oversizedBytes = MAX_FLOOR_PLAN_IMAGE_SIZE_BYTES + 1;
  const result = validateFloorPlanImageFileSize({
    size: oversizedBytes,
  } as File);

  assert.equal(result.ok, false);
  assert.equal(result.code, "file_too_large");
  assert.equal(result.fileSizeBytes, oversizedBytes);
  assert.equal(result.maxSizeBytes, MAX_FLOOR_PLAN_IMAGE_SIZE_BYTES);
  assert.match(result.message, /10 MB upload limit/);
});
