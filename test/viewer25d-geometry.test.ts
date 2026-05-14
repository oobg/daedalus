import assert from "node:assert/strict";
import test from "node:test";

import {
  createRoomSurfaceLayout,
  createWallContourOffsets,
  createSoftenedWallCornerPolygon,
  createInsetPolygon,
  DEFAULT_FLOOR_BASE_OFFSET_MIN,
  DEFAULT_FLOOR_PERIMETER_INSET_MIN,
  DEFAULT_WALL_BASE_OFFSET,
  DEFAULT_WALL_CORNER_RADIUS_MIN,
  DEFAULT_WALL_THICKNESS,
  inspectWallTopology,
  resolveFurnitureFootprintClearance,
  resolveFloorBaseElevationOffset,
  resolveFloorPerimeterInset,
  resolveRoomLayerElevations,
  validateWallTopology,
  resolveWallBaseElevationOffset,
  resolveWallCornerRadius,
} from "../src/components/viewer/viewer25dGeometry.ts";

test("resolveWallBaseElevationOffset raises walls above the floor plane by a thin default separation", () => {
  const offset = resolveWallBaseElevationOffset();

  assert.equal(offset > 0, true);
  assert.equal(offset, DEFAULT_WALL_BASE_OFFSET);
});

test("resolveWallBaseElevationOffset supports a fixed custom separation without mutating wall footprint ordering", () => {
  const footprint = [
    { x: 0, y: 0 },
    { x: 4, y: 0 },
    { x: 4, y: 3 },
    { x: 0, y: 3 },
  ];
  const footprintBeforeOffset = footprint.map((point) => ({ ...point }));
  const offset = resolveWallBaseElevationOffset({
    wallBaseOffset: 0.02,
  });

  assert.equal(offset, 0.02);
  assert.deepEqual(footprint, footprintBeforeOffset);
});

test("resolveFloorBaseElevationOffset places the floor slab on a distinct base layer below walls", () => {
  const offset = resolveFloorBaseElevationOffset();

  assert.equal(offset < 0, true);
  assert.equal(Math.abs(offset) >= DEFAULT_FLOOR_BASE_OFFSET_MIN, true);
});

test("resolveFloorBaseElevationOffset supports configurable wall-driven floor separation", () => {
  const offset = resolveFloorBaseElevationOffset({
    wallThickness: DEFAULT_WALL_THICKNESS * 2,
    floorBaseOffsetRatio: 0.5,
    minimumFloorBaseOffset: 0.01,
  });

  assert.equal(offset, -(DEFAULT_WALL_THICKNESS * 2 * 0.5));
});

test("resolveRoomLayerElevations keeps wall and floor layer heights distinct for spatial separation", () => {
  const elevations = resolveRoomLayerElevations({
    wallThickness: DEFAULT_WALL_THICKNESS,
  });

  assert.equal(elevations.wallBaseOffset, DEFAULT_WALL_BASE_OFFSET);
  assert.equal(elevations.floorBaseOffset < elevations.wallBaseOffset, true);
  assert.equal(elevations.wallLayerHeightDelta > 0, true);
  assert.equal(
    elevations.wallLayerHeightDelta,
    elevations.wallBaseOffset - elevations.floorBaseOffset,
  );
});

test("resolveFloorPerimeterInset computes a measurable floor setback from wall boundaries", () => {
  const inset = resolveFloorPerimeterInset();

  assert.equal(inset >= DEFAULT_FLOOR_PERIMETER_INSET_MIN, true);
});

test("resolveFloorPerimeterInset supports configurable wall-driven floor setbacks", () => {
  const inset = resolveFloorPerimeterInset({
    wallThickness: DEFAULT_WALL_THICKNESS * 2,
    floorPerimeterInsetRatio: 0.5,
    minimumFloorPerimeterInset: 0.01,
  });

  assert.equal(inset, DEFAULT_WALL_THICKNESS);
});

test("resolveWallCornerRadius preserves a noticeable softened join even on thin walls", () => {
  const radius = resolveWallCornerRadius();

  assert.equal(radius >= DEFAULT_WALL_CORNER_RADIUS_MIN, true);
});

test("createInsetPolygon shrinks a room footprint inward on every perimeter edge", () => {
  const insetPolygon = createInsetPolygon(
    [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 4, y: 3 },
      { x: 0, y: 3 },
    ],
    0.2,
  );

  assert.deepEqual(insetPolygon, [
    { x: 0.2, y: 0.2 },
    { x: 3.8, y: 0.2 },
    { x: 3.8, y: 2.8 },
    { x: 0.2, y: 2.8 },
  ]);
});

test("createInsetPolygon preserves inward shrinking for clockwise room polygons", () => {
  const insetPolygon = createInsetPolygon(
    [
      { x: 0, y: 0 },
      { x: 0, y: 3 },
      { x: 4, y: 3 },
      { x: 4, y: 0 },
    ],
    0.2,
  );

  assert.deepEqual(insetPolygon, [
    { x: 0.2, y: 0.2 },
    { x: 0.2, y: 2.8 },
    { x: 3.8, y: 2.8 },
    { x: 3.8, y: 0.2 },
  ]);
});

test("createWallContourOffsets derives paired inner and outer contours for each wall segment with floor-gap clearance", () => {
  const contourOffsets = createWallContourOffsets(
    [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 4, y: 3 },
      { x: 0, y: 3 },
    ],
    {
      wallThickness: 0.5,
      floorPerimeterInsetRatio: 0.2,
      minimumFloorPerimeterInset: 0.1,
    },
  );

  assert.equal(contourOffsets.floorGapClearance, 0.1);
  assert.equal(contourOffsets.wallThickness, 0.5);
  assert.deepEqual(contourOffsets.innerContour, [
    { x: 0.1, y: 0.1 },
    { x: 3.9, y: 0.1 },
    { x: 3.9, y: 2.9 },
    { x: 0.1, y: 2.9 },
  ]);
  assert.deepEqual(contourOffsets.outerContour, [
    { x: -0.4, y: -0.4 },
    { x: 4.4, y: -0.4 },
    { x: 4.4, y: 3.4 },
    { x: -0.4, y: 3.4 },
  ]);
  assert.equal(contourOffsets.segments.length, 4);
  assert.deepEqual(contourOffsets.segments[0], {
    index: 0,
    innerStart: { x: 0.1, y: 0.1 },
    innerEnd: { x: 3.9, y: 0.1 },
    outerStart: { x: -0.4, y: -0.4 },
    outerEnd: { x: 4.4, y: -0.4 },
  });
});

test("createWallContourOffsets preserves per-segment ordering for clockwise polygons", () => {
  const contourOffsets = createWallContourOffsets(
    [
      { x: 0, y: 0 },
      { x: 0, y: 3 },
      { x: 4, y: 3 },
      { x: 4, y: 0 },
    ],
    {
      wallThickness: 0.5,
      floorPerimeterInsetRatio: 0.2,
      minimumFloorPerimeterInset: 0.1,
    },
  );

  assert.deepEqual(contourOffsets.innerContour, [
    { x: 0.1, y: 0.1 },
    { x: 0.1, y: 2.9 },
    { x: 3.9, y: 2.9 },
    { x: 3.9, y: 0.1 },
  ]);
  assert.deepEqual(contourOffsets.outerContour, [
    { x: -0.4, y: -0.4 },
    { x: -0.4, y: 3.4 },
    { x: 4.4, y: 3.4 },
    { x: 4.4, y: -0.4 },
  ]);
  assert.deepEqual(contourOffsets.segments[0], {
    index: 0,
    innerStart: { x: 0.1, y: 0.1 },
    innerEnd: { x: 0.1, y: 2.9 },
    outerStart: { x: -0.4, y: -0.4 },
    outerEnd: { x: -0.4, y: 3.4 },
  });
});

test("createWallContourOffsets rejects floor-gap clearances that consume the full wall thickness", () => {
  assert.throws(
    () =>
      createWallContourOffsets(
        [
          { x: 0, y: 0 },
          { x: 4, y: 0 },
          { x: 4, y: 3 },
          { x: 0, y: 3 },
        ],
        {
          wallThickness: 0.1,
          floorPerimeterInsetRatio: 1,
          minimumFloorPerimeterInset: 0.1,
        },
      ),
    /Wall thickness must be greater than the floor-gap clearance/,
  );
});

test("createRoomSurfaceLayout applies a consistent horizontal gap between the floor surface and adjacent wall footprint", () => {
  const layout = createRoomSurfaceLayout(
    [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 4, y: 3 },
      { x: 0, y: 3 },
    ],
    {
      wallThickness: 0.5,
      floorPerimeterInsetRatio: 0.2,
      minimumFloorPerimeterInset: 0.1,
    },
  );

  assert.equal(layout.wallInnerFootprintInset, 0.25);
  assert.equal(layout.floorGapClearance, 0.1);
  assert.equal(
    Math.abs(
      layout.floorSurfaceInset -
        layout.wallInnerFootprintInset -
        layout.floorGapClearance,
    ) < 1e-6,
    true,
  );
  assert.deepEqual(layout.wallInnerFootprint, [
    { x: 0.25, y: 0.25 },
    { x: 3.75, y: 0.25 },
    { x: 3.75, y: 2.75 },
    { x: 0.25, y: 2.75 },
  ]);
  assert.deepEqual(layout.floorSurfaceFootprint, [
    { x: 0.35, y: 0.35 },
    { x: 3.65, y: 0.35 },
    { x: 3.65, y: 2.65 },
    { x: 0.35, y: 2.65 },
  ]);
});

test("resolveFurnitureFootprintClearance preserves a centered footprint while exposing wall-safe placement bounds", () => {
  const clearance = resolveFurnitureFootprintClearance(
    [
      { x: 0, y: 0 },
      { x: 6, y: 0 },
      { x: 6, y: 4 },
      { x: 0, y: 4 },
    ],
    [
      { x: 2, y: 1.5 },
      { x: 4, y: 1.5 },
      { x: 4, y: 2.5 },
      { x: 2, y: 2.5 },
    ],
    0.5,
  );

  assert.equal(clearance.fitsWithinClearance, true);
  assert.deepEqual(clearance.placementBounds, {
    minX: 1.5,
    maxX: 4.5,
    minY: 1,
    maxY: 3,
  });
  assert.deepEqual(clearance.adjustedFootprint, [
    { x: 2, y: 1.5 },
    { x: 4, y: 1.5 },
    { x: 4, y: 2.5 },
    { x: 2, y: 2.5 },
  ]);
});

test("resolveFurnitureFootprintClearance shifts a near-wall footprint back inside the wall-safe placement envelope", () => {
  const clearance = resolveFurnitureFootprintClearance(
    [
      { x: 0, y: 0 },
      { x: 6, y: 0 },
      { x: 6, y: 4 },
      { x: 0, y: 4 },
    ],
    [
      { x: 0.2, y: 0.3 },
      { x: 2.2, y: 0.3 },
      { x: 2.2, y: 1.3 },
      { x: 0.2, y: 1.3 },
    ],
    0.5,
  );

  assert.equal(clearance.fitsWithinClearance, true);
  assert.deepEqual(clearance.placementBounds, {
    minX: 1.5,
    maxX: 4.5,
    minY: 1,
    maxY: 3,
  });
  assert.deepEqual(clearance.adjustedFootprint, [
    { x: 0.5, y: 0.5 },
    { x: 2.5, y: 0.5 },
    { x: 2.5, y: 1.5 },
    { x: 0.5, y: 1.5 },
  ]);
});

test("resolveFurnitureFootprintClearance reports too-tight rooms when the clearance margin leaves no valid placement envelope", () => {
  const clearance = resolveFurnitureFootprintClearance(
    [
      { x: 0, y: 0 },
      { x: 2.4, y: 0 },
      { x: 2.4, y: 2 },
      { x: 0, y: 2 },
    ],
    [
      { x: 0.2, y: 0.5 },
      { x: 2.2, y: 0.5 },
      { x: 2.2, y: 1.5 },
      { x: 0.2, y: 1.5 },
    ],
    0.5,
  );

  assert.equal(clearance.fitsWithinClearance, false);
  assert.equal(clearance.placementBounds, null);
  assert.equal(clearance.adjustedFootprint, null);
  assert.deepEqual(clearance.safeInteriorFootprint, [
    { x: 0.5, y: 0.5 },
    { x: 1.9, y: 0.5 },
    { x: 1.9, y: 1.5 },
    { x: 0.5, y: 1.5 },
  ]);
});

test("inspectWallTopology flags self-intersecting wall loops after offset joins", () => {
  const topology = inspectWallTopology([
    { x: 0, y: 0 },
    { x: 3, y: 2 },
    { x: 0, y: 2 },
    { x: 3, y: 0 },
  ]);

  assert.equal(topology.isContinuous, true);
  assert.equal(topology.isSelfIntersecting, true);
});

test("validateWallTopology collapses offset-induced crossing loops into a continuous simple polygon", () => {
  const validatedPolygon = validateWallTopology([
    { x: 0, y: 0 },
    { x: 3, y: 2 },
    { x: 0, y: 2 },
    { x: 3, y: 0 },
  ]);
  const topology = inspectWallTopology(validatedPolygon);

  assert.equal(validatedPolygon.length >= 3, true);
  assert.equal(topology.isContinuous, true);
  assert.equal(topology.isSelfIntersecting, false);
  assert.deepEqual(validatedPolygon, [
    { x: 1.5, y: 1 },
    { x: 3, y: 2 },
    { x: 0, y: 2 },
  ]);
});

test("createWallContourOffsets preserves continuous non-self-intersecting contours for concave wall plans", () => {
  const contourOffsets = createWallContourOffsets(
    [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 4, y: 1.2 },
      { x: 2.2, y: 1.2 },
      { x: 2.2, y: 3.5 },
      { x: 0, y: 3.5 },
    ],
    {
      wallThickness: 0.5,
      floorPerimeterInsetRatio: 0.3,
      minimumFloorPerimeterInset: 0.12,
    },
  );

  const innerTopology = inspectWallTopology(contourOffsets.innerContour);
  const outerTopology = inspectWallTopology(contourOffsets.outerContour);

  assert.equal(innerTopology.isContinuous, true);
  assert.equal(innerTopology.isSelfIntersecting, false);
  assert.equal(outerTopology.isContinuous, true);
  assert.equal(outerTopology.isSelfIntersecting, false);
  assert.equal(contourOffsets.segments.length >= 4, true);
});

test("createSoftenedWallCornerPolygon replaces hard rectangular corners with rounded joins", () => {
  const softenedPolygon = createSoftenedWallCornerPolygon(
    [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 4, y: 3 },
      { x: 0, y: 3 },
    ],
    {
      wallCornerRadiusRatio: 5,
      minimumWallCornerRadius: 0.4,
      wallCornerSegments: 4,
      wallCornerStyle: "rounded",
    },
  );

  assert.ok(softenedPolygon.length > 8);
  assert.equal(
    softenedPolygon.some((point) => point.x === 4 && point.y === 0),
    false,
  );
  assert.equal(
    softenedPolygon.some((point) => point.x === 4 && point.y === 3),
    false,
  );
  assert.ok(
    softenedPolygon.some(
      (point) => point.x > 3.6 && point.x < 4 && point.y > 0 && point.y < 0.4,
    ),
    "Expected rounded vertices near the lower-right corner transition.",
  );
  assert.ok(
    softenedPolygon.some(
      (point) => point.x > 3.6 && point.x < 4 && point.y > 2.6 && point.y < 3,
    ),
    "Expected rounded vertices near the upper-right corner transition.",
  );
});

test("createSoftenedWallCornerPolygon supports chamfer joins that remove hard outer 90-degree silhouettes", () => {
  const softenedPolygon = createSoftenedWallCornerPolygon(
    [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 4, y: 3 },
      { x: 0, y: 3 },
    ],
    {
      wallCornerRadiusRatio: 5,
      minimumWallCornerRadius: 0.4,
      wallCornerStyle: "chamfer",
    },
  );

  assert.equal(softenedPolygon.length, 8);
  assert.ok(
    softenedPolygon.some((point) => point.x === 3.6 && point.y === 0),
    "Expected the lower-right wall edge to terminate before the original corner.",
  );
  assert.ok(
    softenedPolygon.some((point) => point.x === 4 && point.y === 0.4),
    "Expected the chamfer face to create a new diagonal entry point on the right edge.",
  );
  assert.equal(
    softenedPolygon.some((point) => point.x === 4 && point.y === 0),
    false,
  );
});
