import assert from "node:assert/strict";
import test from "node:test";

import { createOuterWallCornerProfile } from "../src/features/viewer/wall-corner-profile.ts";

test("createOuterWallCornerProfile replaces a sharp 90-degree outer edge with a softened transition path", () => {
  const corner = createOuterWallCornerProfile(
    { x: 0, y: 0 },
    { x: 4, y: 0 },
    { x: 4, y: 3 },
    {
      radius: 0.45,
      style: "rounded",
      segments: 4,
      winding: 1,
    },
  );

  assert.equal(corner.isSoftened, true);
  assert.equal(corner.style, "rounded");
  assert.equal(corner.path.length, 5);
  assert.deepEqual(corner.path[0], { x: 3.55, y: 0 });
  assert.deepEqual(corner.path.at(-1), { x: 4, y: 0.45 });
  assert.equal(
    corner.path.some((point) => almostEqual(point.x, 4) && almostEqual(point.y, 0)),
    false,
  );
  assert.ok(
    corner.path.some(
      (point) => point.x > 3.55 && point.x < 4 && point.y > 0 && point.y < 0.45,
    ),
    "Expected a rounded transition point between the incoming and outgoing wall edges.",
  );
});

function almostEqual(left: number, right: number, epsilon = 1e-6): boolean {
  return Math.abs(left - right) <= epsilon;
}
