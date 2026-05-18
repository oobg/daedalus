import assert from "node:assert/strict";
import test from "node:test";

import {
  validateUploadedProjectFile,
} from "../src/features/project-export/validate-uploaded-project-file.ts";

test("validateUploadedProjectFile returns a failing validation result for unsupported file type input", () => {
  const file = new File(["binary"], "floor-plan.png", { type: "image/png" });

  const result = validateUploadedProjectFile(file);

  assert.equal(result.ok, false);
  assert.equal(result.code, "unsupported_type");
  assert.equal(result.message, "Unsupported file type. Use a JSON project file.");
});
