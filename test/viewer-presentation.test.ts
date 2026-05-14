import assert from "node:assert/strict";
import test from "node:test";

import { getViewerPresentationPreset } from "../src/features/viewer/viewer-presentation.ts";

test("viewer presentation preset removes the debug-grid read and frames the scene as a miniature object", () => {
  const presentation = getViewerPresentationPreset("miniatureArchitecture");

  assert.deepEqual(presentation.cameraPosition, [7.6, 7.8, 8.4]);
  assert.equal(presentation.cameraFov, 34);
  assert.equal(presentation.backgroundColor, "#F4EFE7");
  assert.equal(presentation.fogColor, "#F4EFE7");
  assert.equal(presentation.showGrid, false);
  assert.ok(presentation.fogNear < presentation.fogFar);
  assert.ok(presentation.pedestalHeight > 0.1);
  assert.ok(presentation.pedestalCornerRadius > 0.05);
  assert.ok(presentation.pedestalMargin >= 1);
  assert.ok(Object.isFrozen(presentation));
});
