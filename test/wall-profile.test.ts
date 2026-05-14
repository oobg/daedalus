import assert from "node:assert/strict";
import test from "node:test";

import {
  createWallProfileOutline,
  createWallSegmentGeometry,
} from "../src/features/viewer/wall-profile.ts";

test("createWallProfileOutline softens the top silhouette when a radius is provided", () => {
  const thickness = 0.045;
  const height = 0.9;
  const topEdgeRadius = 0.011;
  const halfThickness = thickness / 2;
  const rectangularOutline = createWallProfileOutline({
    thickness,
    height,
    topEdgeRadius: 0,
    curveSegments: 6,
  });

  const outline = createWallProfileOutline({
    thickness,
    height,
    topEdgeRadius,
    curveSegments: 6,
  });

  assert.equal(
    rectangularOutline.length,
    4,
    "Expected the hard extrusion profile to stay rectangular.",
  );
  assert.ok(outline.length > 4, "Expected a softened wall profile to add silhouette points.");
  assert.notDeepEqual(
    outline,
    rectangularOutline,
    "Softened profile should differ from the hard 90-degree box outline.",
  );
  assert.ok(
    !outline.some(
      (point) =>
        almostEqual(point.x, halfThickness) && almostEqual(point.y, height),
    ),
    "Softened profile should remove the hard top-right corner.",
  );
  assert.ok(
    !outline.some(
      (point) =>
        almostEqual(point.x, -halfThickness) && almostEqual(point.y, height),
    ),
    "Softened profile should remove the hard top-left corner.",
  );
  assert.ok(
    outline.some(
      (point) =>
        point.x > halfThickness - topEdgeRadius &&
        point.x < halfThickness &&
        point.y > height - topEdgeRadius &&
        point.y < height,
    ),
    "Softened profile should add a rounded transition near the top-right edge.",
  );
  assert.ok(
    outline.some(
      (point) =>
        point.x < -halfThickness + topEdgeRadius &&
        point.x > -halfThickness &&
        point.y > height - topEdgeRadius &&
        point.y < height,
    ),
    "Softened profile should add a rounded transition near the top-left edge.",
  );
});

test("createWallSegmentGeometry centers an extruded softened profile on the wall segment", () => {
  const segmentLength = 3.2;
  const geometry = createWallSegmentGeometry(segmentLength, {
    thickness: 0.045,
    height: 0.9,
    topEdgeRadius: 0.011,
    curveSegments: 6,
  });

  geometry.computeBoundingBox();

  assert.ok(geometry.boundingBox, "Expected bounding box for wall segment geometry.");
  assert.ok(almostEqual(geometry.boundingBox.min.z, -segmentLength / 2));
  assert.ok(almostEqual(geometry.boundingBox.max.z, segmentLength / 2));
  assert.ok(almostEqual(geometry.boundingBox.max.y, 0.9));
});

function almostEqual(left: number, right: number, epsilon = 1e-6): boolean {
  return Math.abs(left - right) <= epsilon;
}
