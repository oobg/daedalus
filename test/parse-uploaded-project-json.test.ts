import assert from "node:assert/strict";
import test from "node:test";

import { parseUploadedProjectJson } from "../src/features/project-export/parse-uploaded-project-json.ts";

test("parseUploadedProjectJson returns a raw object for valid uploaded project content", () => {
  const result = parseUploadedProjectJson(`
    {
      "projectId": "project-alpha",
      "projectName": "Museum Guide",
      "objectVersion": 1,
      "floors": []
    }
  `);

  assert.equal(result.ok, true);

  if (!result.ok) {
    return;
  }

  assert.deepEqual(result.value, {
    projectId: "project-alpha",
    projectName: "Museum Guide",
    objectVersion: 1,
    floors: [],
  });
});

test("parseUploadedProjectJson returns a clear error when uploaded JSON is malformed", () => {
  const result = parseUploadedProjectJson(
    '{"projectId":"project-alpha","floors":[}',
  );

  assert.equal(result.ok, false);

  if (result.ok) {
    return;
  }

  assert.equal(result.error.code, "invalid_project_json");
  assert.match(
    result.error.message,
    /^Uploaded project JSON is malformed and could not be parsed\./,
  );
  assert.match(result.error.message, /Unexpected token/);
});

test("parseUploadedProjectJson rejects non-object JSON payloads", () => {
  const result = parseUploadedProjectJson('["floor-1", "floor-2"]');

  assert.deepEqual(result, {
    ok: false,
    error: {
      code: "invalid_project_json_root",
      message: "Uploaded project JSON must contain a top-level object.",
    },
  });
});

test("parseUploadedProjectJson accepts a UTF-8 BOM-prefixed JSON upload", () => {
  const result = parseUploadedProjectJson('\uFEFF{"projectId":"project-bom"}');

  assert.equal(result.ok, true);

  if (!result.ok) {
    return;
  }

  assert.deepEqual(result.value, {
    projectId: "project-bom",
  });
});
