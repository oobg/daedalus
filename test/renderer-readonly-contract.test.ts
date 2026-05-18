import assert from "node:assert/strict";
import test from "node:test";
import { execFileSync } from "node:child_process";

test("renderer-facing room polygon snapshots stay deeply readonly under TypeScript", () => {
  assert.doesNotThrow(() => {
    execFileSync(
      "./node_modules/.bin/tsc",
      ["-p", "test/fixtures/tsconfig.renderer-readonly.json", "--pretty", "false"],
      {
        cwd: process.cwd(),
        stdio: "pipe",
      },
    );
  });
});
