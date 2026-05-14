import assert from "node:assert/strict";
import test from "node:test";

import { formatViewerFloorMetadata } from "../src/features/viewer/viewer-floor-metadata.ts";

test("read-only viewer floor metadata explicitly includes configured floor height", () => {
  assert.equal(
    formatViewerFloorMetadata({
      floorHeight: 3.5,
      roomCount: 12,
    }),
    "층고 3.5m · 12실",
  );
});
