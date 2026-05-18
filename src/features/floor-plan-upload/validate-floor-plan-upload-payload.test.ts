import test from "node:test";
import assert from "node:assert/strict";

import { validateFloorPlanUploadPayload } from "./validate-floor-plan-upload-payload.ts";
import { createPngTestFile } from "./test-floor-plan-image-fixtures.ts";

test("accepts a valid uploaded floor payload before save", async () => {
  const upload = createPngTestFile("level-1.png");

  const result = await validateFloorPlanUploadPayload({
    projectId: "  project-alpha  ",
    floorId: " floor-1 ",
    upload,
  });

  assert.deepEqual(result, {
    ok: true,
    code: "valid",
    message: "Floor upload payload accepted.",
    value: {
      projectId: "project-alpha",
      floorId: "floor-1",
      upload,
    },
  });
});
