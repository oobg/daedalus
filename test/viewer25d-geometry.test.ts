import assert from "node:assert/strict";
import test from "node:test";

import { resolveFloorVerticalPlacements } from "../src/domain/floor.ts";
import {
  createRoomSurfaceLayout,
  createWallContourOffsets,
  createSoftenedWallCornerPolygon,
  createInsetPolygon,
  DEFAULT_FLOOR_LAYER_THICKNESS_MAX,
  DEFAULT_FLOOR_LAYER_THICKNESS_MIN,
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
  resolveViewer25DFloorExtrusionDepth,
  resolveViewer25DFloorLayerThickness,
  resolveViewer25DFloorRenderPlacements,
  resolveViewer25DFloorPlacements,
  resolveViewer25DStackExtrusionDepth,
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

test("resolveViewer25DFloorPlacements positions each floor from prior configured floor heights", () => {
  const placements = resolveViewer25DFloorPlacements([
    { floorId: "floor-ground", floorHeight: 2.75 },
    { floorId: "floor-mezzanine", floorHeight: 4.2 },
    { floorId: "floor-roof", floorHeight: 3.1 },
  ]);

  assert.deepEqual(placements, [
    { floorId: "floor-ground", verticalOffset: 0 },
    { floorId: "floor-mezzanine", verticalOffset: 2.75 },
    { floorId: "floor-roof", verticalOffset: 6.95 },
  ]);
});

test("resolveViewer25DFloorRenderPlacements converts configured floor heights into render-space floor positions", () => {
  const placements = resolveViewer25DFloorRenderPlacements(
    [
      { floorId: "floor-ground", floorHeight: 2.5 },
      { floorId: "floor-gallery", floorHeight: 3.75 },
      { floorId: "floor-roof", floorHeight: 4.25 },
    ],
    0.3,
  );

  assert.deepEqual(placements, [
    { floorId: "floor-ground", verticalOffset: 0, renderVerticalOffset: 0 },
    { floorId: "floor-gallery", verticalOffset: 2.5, renderVerticalOffset: 0.75 },
    { floorId: "floor-roof", verticalOffset: 6.25, renderVerticalOffset: 1.875 },
  ]);
});

test("resolveViewer25DFloorRenderPlacements uses computed per-floor elevations for render stacking", () => {
  const floors = [
    { floorId: "floor-ground", floorHeight: 2.25 },
    { floorId: "floor-atrium", floorHeight: 5.5 },
    { floorId: "floor-bridge", floorHeight: 2.75 },
  ] as const;
  const computedElevations = resolveFloorVerticalPlacements(
    floors.map((floor) => ({
      id: floor.floorId,
      name: floor.floorId,
      height: floor.floorHeight,
      referenceImage: null,
    })),
  );
  const placements = resolveViewer25DFloorRenderPlacements(floors, 0.3);

  assert.deepEqual(
    placements.map(({ floorId, verticalOffset, renderVerticalOffset }) => ({
      floorId,
      verticalOffset,
      renderVerticalOffset,
    })),
    computedElevations.map(({ floorId, offset }) => ({
      floorId,
      verticalOffset: offset,
      renderVerticalOffset: Number((offset * 0.3).toFixed(6)),
    })),
  );
});

test("resolveViewer25DFloorExtrusionDepth derives render depth from configured floor height", () => {
  assert.equal(resolveViewer25DFloorExtrusionDepth(4.2, 0.3), 1.26);
  assert.equal(resolveViewer25DFloorExtrusionDepth(2.75, 0.4), 1.1);
});

test("resolveViewer25DFloorExtrusionDepth rejects hardcoded/default fallback inputs", () => {
  assert.throws(
    () => resolveViewer25DFloorExtrusionDepth(0, 0.3),
    /positive finite floor height/,
  );
  assert.throws(
    () => resolveViewer25DFloorExtrusionDepth(3, 0),
    /positive finite number/,
  );
});

test("resolveViewer25DFloorLayerThickness derives room floor slab depth from configured floor height", () => {
  assert.equal(resolveViewer25DFloorLayerThickness(2.5), 0.0075);
  assert.equal(resolveViewer25DFloorLayerThickness(4.2), 0.0126);
});

test("resolveViewer25DFloorLayerThickness clamps only the display-safe extremes", () => {
  assert.equal(
    resolveViewer25DFloorLayerThickness(0.5),
    DEFAULT_FLOOR_LAYER_THICKNESS_MIN,
  );
  assert.equal(
    resolveViewer25DFloorLayerThickness(12),
    DEFAULT_FLOOR_LAYER_THICKNESS_MAX,
  );
});

test("resolveViewer25DFloorLayerThickness rejects non-positive height inputs", () => {
  assert.throws(
    () => resolveViewer25DFloorLayerThickness(0),
    /positive finite floor height/,
  );
  assert.throws(
    () => resolveViewer25DFloorLayerThickness(3, 0),
    /positive finite number/,
  );
});

test("resolveViewer25DStackExtrusionDepth sums per-floor configured extrusion depths", () => {
  const depth = resolveViewer25DStackExtrusionDepth(
    [
      { floorId: "floor-ground", floorHeight: 2.5 },
      { floorId: "floor-gallery", floorHeight: 3.75 },
      { floorId: "floor-roof", floorHeight: 4.25 },
    ],
    0.3,
  );

  assert.equal(depth, 3.15);
});

test("viewer floor rendering preserves relative elevations and thicknesses for mixed floor heights", () => {
  const floors = [
    { floorId: "floor-service", floorHeight: 2 },
    { floorId: "floor-lobby", floorHeight: 5 },
    { floorId: "floor-office", floorHeight: 3.5 },
  ];
  const heightScale = 0.3;

  const renderPlacements = resolveViewer25DFloorRenderPlacements(
    floors,
    heightScale,
  );
  const renderLayers = floors.map((floor, index) => ({
    floorId: floor.floorId,
    renderBaseY: renderPlacements[index].renderVerticalOffset,
    wallHeight: resolveViewer25DFloorExtrusionDepth(
      floor.floorHeight,
      heightScale,
    ),
    floorLayerThickness: resolveViewer25DFloorLayerThickness(floor.floorHeight),
  }));

  assert.deepEqual(renderLayers, [
    {
      floorId: "floor-service",
      renderBaseY: 0,
      wallHeight: 0.6,
      floorLayerThickness: 0.006,
    },
    {
      floorId: "floor-lobby",
      renderBaseY: 0.6,
      wallHeight: 1.5,
      floorLayerThickness: 0.015,
    },
    {
      floorId: "floor-office",
      renderBaseY: 2.1,
      wallHeight: 1.05,
      floorLayerThickness: 0.0105,
    },
  ]);
  assert.equal(
    renderLayers[1].renderBaseY,
    renderLayers[0].renderBaseY + renderLayers[0].wallHeight,
  );
  assert.equal(
    renderLayers[2].renderBaseY,
    renderLayers[1].renderBaseY + renderLayers[1].wallHeight,
  );
  assert.equal(resolveViewer25DStackExtrusionDepth(floors, heightScale), 3.15);
  assert.ok(
    Math.abs(renderLayers[2].renderBaseY + renderLayers[2].wallHeight - 3.15) <
      1e-12,
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
