import assert from "node:assert/strict";
import test from "node:test";

import { getWallColorPalette } from "../src/features/viewer/index.ts";

test("interior wall color palette keeps the warm handcrafted miniature tone", () => {
  const palette = getWallColorPalette("interior");

  assert.deepEqual(palette, {
    color: "#B7AEA1",
    emissive: "#8D7F6B",
  });
  assert.ok(Object.isFrozen(palette));
});

test("exterior wall color palette is slightly denser for silhouette separation", () => {
  const interior = getWallColorPalette("interior");
  const exterior = getWallColorPalette("exterior");

  assert.deepEqual(exterior, {
    color: "#A79C8D",
    emissive: "#7F7363",
  });
  assert.notEqual(exterior, interior);
  assert.ok(Object.isFrozen(exterior));
});

test("wall color palette defaults to the interior wall profile", () => {
  assert.equal(
    getWallColorPalette(),
    getWallColorPalette("interior"),
  );
});
