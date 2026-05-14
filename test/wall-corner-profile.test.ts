import assert from "node:assert/strict";
import test from "node:test";

import {
  createInnerWallCornerProfile,
  createOuterWallCornerProfile,
} from "../src/features/viewer/wall-corner-profile.ts";

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

test("createInnerWallCornerProfile removes a sharp 90-degree interior notch while keeping a continuous inner boundary", () => {
  const corner = createInnerWallCornerProfile(
    { x: 0, y: 0 },
    { x: 4, y: 0 },
    { x: 4, y: -3 },
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
  assert.deepEqual(corner.path.at(-1), { x: 4, y: -0.45 });
  assert.equal(
    corner.path.some((point) => almostEqual(point.x, 4) && almostEqual(point.y, 0)),
    false,
  );
  assert.ok(
    corner.path.every(
      (point, index) =>
        index === 0 ||
        point.x >= corner.path[index - 1].x - 1e-6 ||
        point.y <= corner.path[index - 1].y + 1e-6,
    ),
    "Expected the inner-corner path ordering to remain continuous from one wall segment into the next.",
  );
  assert.ok(
    corner.path.some(
      (point) => point.x > 3.55 && point.x < 4 && point.y < 0 && point.y > -0.45,
    ),
    "Expected the interior corner to bridge across the former notch with intermediate softened points.",
  );
});

function almostEqual(left: number, right: number, epsilon = 1e-6): boolean {
  return Math.abs(left - right) <= epsilon;
}
