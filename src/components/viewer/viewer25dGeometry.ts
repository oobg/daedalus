import { createOuterWallCornerProfile } from "../../features/viewer/wall-corner-profile.ts";
import { resolveFloorVerticalPlacements } from "../../domain/floor.ts";

export const DEFAULT_WALL_HEIGHT_SCALE = 0.3;
export const DEFAULT_FLOOR_LAYER_THICKNESS_SCALE = 0.003;
export const DEFAULT_FLOOR_LAYER_THICKNESS_MIN = 0.004;
export const DEFAULT_FLOOR_LAYER_THICKNESS_MAX = 0.018;
export const DEFAULT_WALL_THICKNESS = 0.045;
export const DEFAULT_WALL_BASE_OFFSET = 0.014;
export const DEFAULT_FLOOR_BASE_OFFSET_RATIO = 0.35;
export const DEFAULT_FLOOR_BASE_OFFSET_MIN = 0.012;
export const DEFAULT_FLOOR_PERIMETER_INSET_RATIO = 0.22;
export const DEFAULT_FLOOR_PERIMETER_INSET_MIN = 0.008;
export const DEFAULT_WALL_CORNER_RADIUS_RATIO = 0.7;
export const DEFAULT_WALL_CORNER_RADIUS_MIN = 0.018;
export const DEFAULT_WALL_CORNER_SEGMENTS = 4;

const PARALLEL_LINE_EPSILON = 1e-6;
const COORDINATE_PRECISION = 1e6;

export interface Viewer25DPoint2D {
  x: number;
  y: number;
}

export type Viewer25DWallCornerStyle = "chamfer" | "rounded";

export interface Viewer25DGeometryConfig {
  wallThickness?: number;
  wallBaseOffset?: number;
  floorBaseOffsetRatio?: number;
  minimumFloorBaseOffset?: number;
  floorPerimeterInsetRatio?: number;
  minimumFloorPerimeterInset?: number;
  wallCornerRadiusRatio?: number;
  minimumWallCornerRadius?: number;
  wallCornerSegments?: number;
  wallCornerStyle?: Viewer25DWallCornerStyle;
}

export interface Viewer25DWallContourSegment {
  index: number;
  innerStart: Viewer25DPoint2D;
  innerEnd: Viewer25DPoint2D;
  outerStart: Viewer25DPoint2D;
  outerEnd: Viewer25DPoint2D;
}

export interface Viewer25DWallContourOffsets {
  innerContour: Viewer25DPoint2D[];
  outerContour: Viewer25DPoint2D[];
  floorGapClearance: number;
  wallThickness: number;
  segments: Viewer25DWallContourSegment[];
}

export interface Viewer25DRoomSurfaceLayout {
  floorGapClearance: number;
  floorSurfaceFootprint: Viewer25DPoint2D[];
  floorSurfaceInset: number;
  wallInnerFootprint: Viewer25DPoint2D[];
  wallOuterFootprint: Viewer25DPoint2D[];
  wallThickness: number;
  wallInnerFootprintInset: number;
}

export interface Viewer25DRoomLayerElevations {
  floorBaseOffset: number;
  wallBaseOffset: number;
  wallLayerHeightDelta: number;
}

export interface Viewer25DWallTopologyValidationResult {
  isContinuous: boolean;
  isSelfIntersecting: boolean;
  points: Viewer25DPoint2D[];
}

export interface Viewer25DPlacementBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface Viewer25DFloorPlacementInput {
  floorId: string;
  floorHeight: number;
}

export interface Viewer25DFloorPlacement {
  floorId: string;
  verticalOffset: number;
}

export interface Viewer25DFloorRenderPlacement extends Viewer25DFloorPlacement {
  renderVerticalOffset: number;
}

export interface Viewer25DFurnitureFootprintClearanceResult {
  placementBounds: Viewer25DPlacementBounds | null;
  adjustedFootprint: Viewer25DPoint2D[] | null;
  clearanceMargin: number;
  safeInteriorFootprint: Viewer25DPoint2D[];
  fitsWithinClearance: boolean;
}

export interface Viewer25DSoftenedCornerPath {
  index: number;
  originalCorner: Viewer25DPoint2D;
  path: Viewer25DPoint2D[];
  style: Viewer25DWallCornerStyle;
  radius: number;
  isSoftened: boolean;
}

export function resolveWallBaseElevationOffset(
  config: Viewer25DGeometryConfig = {},
): number {
  return config.wallBaseOffset ?? DEFAULT_WALL_BASE_OFFSET;
}

export function resolveFloorBaseElevationOffset(
  config: Viewer25DGeometryConfig = {},
): number {
  const wallThickness = config.wallThickness ?? DEFAULT_WALL_THICKNESS;
  const floorBaseOffsetRatio =
    config.floorBaseOffsetRatio ?? DEFAULT_FLOOR_BASE_OFFSET_RATIO;
  const minimumFloorBaseOffset =
    config.minimumFloorBaseOffset ?? DEFAULT_FLOOR_BASE_OFFSET_MIN;

  return -Math.max(wallThickness * floorBaseOffsetRatio, minimumFloorBaseOffset);
}

export function resolveFloorPerimeterInset(
  config: Viewer25DGeometryConfig = {},
): number {
  const wallThickness = config.wallThickness ?? DEFAULT_WALL_THICKNESS;
  const floorPerimeterInsetRatio =
    config.floorPerimeterInsetRatio ?? DEFAULT_FLOOR_PERIMETER_INSET_RATIO;
  const minimumFloorPerimeterInset =
    config.minimumFloorPerimeterInset ?? DEFAULT_FLOOR_PERIMETER_INSET_MIN;

  return Math.max(
    wallThickness * floorPerimeterInsetRatio,
    minimumFloorPerimeterInset,
  );
}

export function resolveRoomLayerElevations(
  config: Viewer25DGeometryConfig = {},
): Viewer25DRoomLayerElevations {
  const floorBaseOffset = resolveFloorBaseElevationOffset(config);
  const wallBaseOffset = resolveWallBaseElevationOffset(config);

  return {
    floorBaseOffset,
    wallBaseOffset,
    wallLayerHeightDelta: roundCoordinate(wallBaseOffset - floorBaseOffset),
  };
}

export function resolveViewer25DFloorPlacements(
  floors: readonly Viewer25DFloorPlacementInput[],
): Viewer25DFloorPlacement[] {
  return resolveFloorVerticalPlacements(
    floors.map((floor) => ({
      id: floor.floorId,
      name: floor.floorId,
      height: floor.floorHeight,
      referenceImage: null,
    })),
  ).map((placement) => ({
    floorId: placement.floorId,
    verticalOffset: placement.offset,
  }));
}

export function resolveViewer25DFloorRenderPlacements(
  floors: readonly Viewer25DFloorPlacementInput[],
  heightScale: number,
): Viewer25DFloorRenderPlacement[] {
  return resolveViewer25DFloorPlacements(floors).map((placement) => ({
    ...placement,
    renderVerticalOffset: roundCoordinate(placement.verticalOffset * heightScale),
  }));
}

export function resolveViewer25DFloorExtrusionDepth(
  floorHeight: number,
  heightScale: number = DEFAULT_WALL_HEIGHT_SCALE,
): number {
  if (!Number.isFinite(floorHeight) || floorHeight <= 0) {
    throw new Error("Floor extrusion depth must be derived from a positive finite floor height.");
  }

  if (!Number.isFinite(heightScale) || heightScale <= 0) {
    throw new Error("Floor extrusion depth scale must be a positive finite number.");
  }

  return roundCoordinate(floorHeight * heightScale);
}

export function resolveViewer25DFloorLayerThickness(
  floorHeight: number,
  thicknessScale: number = DEFAULT_FLOOR_LAYER_THICKNESS_SCALE,
): number {
  if (!Number.isFinite(floorHeight) || floorHeight <= 0) {
    throw new Error("Floor layer thickness must be derived from a positive finite floor height.");
  }

  if (!Number.isFinite(thicknessScale) || thicknessScale <= 0) {
    throw new Error("Floor layer thickness scale must be a positive finite number.");
  }

  return roundCoordinate(
    Math.min(
      Math.max(
        floorHeight * thicknessScale,
        DEFAULT_FLOOR_LAYER_THICKNESS_MIN,
      ),
      DEFAULT_FLOOR_LAYER_THICKNESS_MAX,
    ),
  );
}

export function resolveViewer25DStackExtrusionDepth(
  floors: readonly Viewer25DFloorPlacementInput[],
  heightScale: number = DEFAULT_WALL_HEIGHT_SCALE,
): number {
  return roundCoordinate(
    floors.reduce(
      (totalDepth, floor) =>
        totalDepth + resolveViewer25DFloorExtrusionDepth(floor.floorHeight, heightScale),
      0,
    ),
  );
}

export function resolveWallCornerRadius(
  config: Viewer25DGeometryConfig = {},
): number {
  const wallThickness = config.wallThickness ?? DEFAULT_WALL_THICKNESS;
  const wallCornerRadiusRatio =
    config.wallCornerRadiusRatio ?? DEFAULT_WALL_CORNER_RADIUS_RATIO;
  const minimumWallCornerRadius =
    config.minimumWallCornerRadius ?? DEFAULT_WALL_CORNER_RADIUS_MIN;

  return Math.max(
    wallThickness * wallCornerRadiusRatio,
    minimumWallCornerRadius,
  );
}

export function createSoftenedWallCornerPolygon(
  points: readonly Viewer25DPoint2D[],
  config: Viewer25DGeometryConfig = {},
): Viewer25DPoint2D[] {
  const cornerPaths = createSoftenedWallCornerPaths(points, config);
  const softenedPolygon: Viewer25DPoint2D[] = [];

  for (const cornerPath of cornerPaths) {
    for (const point of cornerPath.path) {
      if (!arePointsEquivalent(softenedPolygon.at(-1), point)) {
        softenedPolygon.push(point);
      }
    }
  }

  return softenedPolygon;
}

export function createSoftenedWallCornerPaths(
  points: readonly Viewer25DPoint2D[],
  config: Viewer25DGeometryConfig = {},
): Viewer25DSoftenedCornerPath[] {
  const normalizedPoints = normalizeClosedCornerPathInput(points);

  if (normalizedPoints.length < 3) {
    return normalizedPoints.map((point, index) => ({
      index,
      originalCorner: point,
      path: [point],
      style: config.wallCornerStyle ?? "rounded",
      radius: resolveWallCornerRadius(config),
      isSoftened: false,
    }));
  }

  const signedArea = computeSignedArea(normalizedPoints);

  if (Math.abs(signedArea) <= PARALLEL_LINE_EPSILON) {
    return normalizedPoints.map((point, index) => ({
      index,
      originalCorner: point,
      path: [point],
      style: config.wallCornerStyle ?? "rounded",
      radius: resolveWallCornerRadius(config),
      isSoftened: false,
    }));
  }

  const resolvedRadius = resolveWallCornerRadius(config);
  const wallCornerSegments = config.wallCornerSegments ?? DEFAULT_WALL_CORNER_SEGMENTS;
  const wallCornerStyle = config.wallCornerStyle ?? "rounded";
  const winding = signedArea > 0 ? 1 : -1;
  const cornerPaths: Viewer25DSoftenedCornerPath[] = [];

  for (let index = 0; index < normalizedPoints.length; index += 1) {
    const previous =
      normalizedPoints[
        (index - 1 + normalizedPoints.length) % normalizedPoints.length
      ];
    const current = normalizedPoints[index];
    const next = normalizedPoints[(index + 1) % normalizedPoints.length];
    const softenedCorner = createOuterWallCornerProfile(
      previous,
      current,
      next,
      {
        radius: resolvedRadius,
        style: wallCornerStyle,
        segments: wallCornerSegments,
        winding,
      },
    );

    if (!softenedCorner.isSoftened) {
      cornerPaths.push({
        index,
        originalCorner: current,
        path: [current],
        style: wallCornerStyle,
        radius: resolvedRadius,
        isSoftened: false,
      });
      continue;
    }

    cornerPaths.push({
      index,
      originalCorner: current,
      path: softenedCorner.path,
      style: wallCornerStyle,
      radius: resolvedRadius,
      isSoftened: true,
    });
  }

  return cornerPaths;
}

function normalizeClosedCornerPathInput(
  points: readonly Viewer25DPoint2D[],
): Viewer25DPoint2D[] {
  const dedupedPoints: Viewer25DPoint2D[] = [];

  for (const point of points) {
    const roundedPoint = roundPoint(point);

    if (!arePointsEquivalent(dedupedPoints.at(-1), roundedPoint)) {
      dedupedPoints.push(roundedPoint);
    }
  }

  if (
    dedupedPoints.length >= 2 &&
    arePointsEquivalent(dedupedPoints[0], dedupedPoints.at(-1)!)
  ) {
    dedupedPoints.pop();
  }

  return dedupedPoints;
}

function computeSignedArea(points: readonly Viewer25DPoint2D[]): number {
  let area = 0;

  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    area += current.x * next.y - next.x * current.y;
  }

  return area / 2;
}

function intersectOffsetLines(
  pointA: Viewer25DPoint2D,
  directionA: Viewer25DPoint2D,
  pointB: Viewer25DPoint2D,
  directionB: Viewer25DPoint2D,
): Viewer25DPoint2D | null {
  const denominator =
    directionA.x * directionB.y - directionA.y * directionB.x;

  if (Math.abs(denominator) <= PARALLEL_LINE_EPSILON) {
    return null;
  }

  const pointDelta = {
    x: pointB.x - pointA.x,
    y: pointB.y - pointA.y,
  };
  const t =
    (pointDelta.x * directionB.y - pointDelta.y * directionB.x) / denominator;

  return {
    x: pointA.x + directionA.x * t,
    y: pointA.y + directionA.y * t,
  };
}

export function createInsetPolygon(
  points: readonly Viewer25DPoint2D[],
  inset: number,
): Viewer25DPoint2D[] {
  const normalizedPoints = normalizePolygonTopology(points);

  if (inset <= 0) {
    return normalizedPoints;
  }

  return createInteriorInsetPolygon(normalizedPoints, inset);
}

export function createWallContourOffsets(
  points: readonly Viewer25DPoint2D[],
  config: Viewer25DGeometryConfig = {},
): Viewer25DWallContourOffsets {
  const wallThickness = config.wallThickness ?? DEFAULT_WALL_THICKNESS;
  const floorGapClearance = resolveFloorPerimeterInset(config);

  if (wallThickness <= floorGapClearance + PARALLEL_LINE_EPSILON) {
    throw new Error(
      "Wall thickness must be greater than the floor-gap clearance to derive parallel contours.",
    );
  }

  const innerContour = createParallelPolygon(points, floorGapClearance);
  const outerContour = createParallelPolygon(
    points,
    -(wallThickness - floorGapClearance),
  );

  if (innerContour.length !== outerContour.length) {
    throw new Error("Wall contour offsets must preserve polygon vertex pairing.");
  }

  const segments = innerContour
    .map((innerStart, index) => {
      const innerEnd = innerContour[(index + 1) % innerContour.length];
      const outerStart = outerContour[index];
      const outerEnd = outerContour[(index + 1) % outerContour.length];

      if (
        Math.hypot(innerEnd.x - innerStart.x, innerEnd.y - innerStart.y) <=
          PARALLEL_LINE_EPSILON ||
        Math.hypot(outerEnd.x - outerStart.x, outerEnd.y - outerStart.y) <=
          PARALLEL_LINE_EPSILON
      ) {
        return null;
      }

      return {
        index,
        innerStart,
        innerEnd,
        outerStart,
        outerEnd,
      };
    })
    .filter(
      (segment): segment is Viewer25DWallContourSegment => segment !== null,
    );

  return {
    innerContour,
    outerContour,
    floorGapClearance,
    wallThickness,
    segments,
  };
}

export function createRoomSurfaceLayout(
  points: readonly Viewer25DPoint2D[],
  config: Viewer25DGeometryConfig = {},
): Viewer25DRoomSurfaceLayout {
  const wallThickness = config.wallThickness ?? DEFAULT_WALL_THICKNESS;
  const wallInnerFootprintInset = roundCoordinate(wallThickness / 2);
  const floorGapClearance = resolveFloorPerimeterInset(config);
  const floorSurfaceInset = roundCoordinate(
    wallInnerFootprintInset + floorGapClearance,
  );

  return {
    floorGapClearance,
    floorSurfaceFootprint: createParallelPolygon(points, floorSurfaceInset),
    floorSurfaceInset,
    wallInnerFootprint: createParallelPolygon(points, wallInnerFootprintInset),
    wallOuterFootprint: createParallelPolygon(points, -wallInnerFootprintInset),
    wallThickness,
    wallInnerFootprintInset,
  };
}

export function resolveFurnitureFootprintClearance(
  roomPolygon: readonly Viewer25DPoint2D[],
  footprint: readonly Viewer25DPoint2D[],
  clearanceMargin: number,
): Viewer25DFurnitureFootprintClearanceResult {
  const normalizedRoomPolygon = normalizePolygonTopology(roomPolygon);
  const normalizedFootprint = normalizePolygonTopology(footprint);

  if (
    normalizedRoomPolygon.length < 3 ||
    normalizedFootprint.length < 3 ||
    clearanceMargin < 0
  ) {
    return {
      placementBounds: null,
      adjustedFootprint: null,
      clearanceMargin,
      safeInteriorFootprint: [],
      fitsWithinClearance: false,
    };
  }

  const safeInteriorFootprint = createInsetPolygon(
    normalizedRoomPolygon,
    clearanceMargin,
  );

  if (safeInteriorFootprint.length < 3) {
    return {
      placementBounds: null,
      adjustedFootprint: null,
      clearanceMargin,
      safeInteriorFootprint,
      fitsWithinClearance: false,
    };
  }

  const safeBounds = calculateBounds(safeInteriorFootprint);
  const footprintBounds = calculateBounds(normalizedFootprint);
  const footprintCenter = {
    x: (footprintBounds.minX + footprintBounds.maxX) / 2,
    y: (footprintBounds.minY + footprintBounds.maxY) / 2,
  };
  const centerOffset = {
    minX: footprintCenter.x - footprintBounds.minX,
    maxX: footprintBounds.maxX - footprintCenter.x,
    minY: footprintCenter.y - footprintBounds.minY,
    maxY: footprintBounds.maxY - footprintCenter.y,
  };
  const placementBounds = {
    minX: roundCoordinate(safeBounds.minX + centerOffset.minX),
    maxX: roundCoordinate(safeBounds.maxX - centerOffset.maxX),
    minY: roundCoordinate(safeBounds.minY + centerOffset.minY),
    maxY: roundCoordinate(safeBounds.maxY - centerOffset.maxY),
  };

  if (
    placementBounds.minX > placementBounds.maxX + PARALLEL_LINE_EPSILON ||
    placementBounds.minY > placementBounds.maxY + PARALLEL_LINE_EPSILON
  ) {
    return {
      placementBounds: null,
      adjustedFootprint: null,
      clearanceMargin,
      safeInteriorFootprint,
      fitsWithinClearance: false,
    };
  }

  const clampedCenter = {
    x: clamp(footprintCenter.x, placementBounds.minX, placementBounds.maxX),
    y: clamp(footprintCenter.y, placementBounds.minY, placementBounds.maxY),
  };
  const translation = {
    x: clampedCenter.x - footprintCenter.x,
    y: clampedCenter.y - footprintCenter.y,
  };
  const adjustedFootprint = normalizedFootprint.map((point) =>
    roundPoint({
      x: point.x + translation.x,
      y: point.y + translation.y,
    }),
  );

  return {
    placementBounds,
    adjustedFootprint,
    clearanceMargin,
    safeInteriorFootprint,
    fitsWithinClearance: true,
  };
}

function createParallelPolygon(
  points: readonly Viewer25DPoint2D[],
  offset: number,
): Viewer25DPoint2D[] {
  if (points.length < 3 || Math.abs(offset) <= PARALLEL_LINE_EPSILON) {
    return [...points];
  }

  const signedArea = computeSignedArea(points);

  if (Math.abs(signedArea) <= PARALLEL_LINE_EPSILON) {
    return [...points];
  }

  const winding = signedArea > 0 ? 1 : -1;
  const offsetPolygon = points.map((current, index) => {
    const previous = points[(index - 1 + points.length) % points.length];
    const next = points[(index + 1) % points.length];
    const previousDirection = {
      x: current.x - previous.x,
      y: current.y - previous.y,
    };
    const nextDirection = {
      x: next.x - current.x,
      y: next.y - current.y,
    };
    const previousLength = Math.hypot(
      previousDirection.x,
      previousDirection.y,
    );
    const nextLength = Math.hypot(nextDirection.x, nextDirection.y);

    if (
      previousLength <= PARALLEL_LINE_EPSILON ||
      nextLength <= PARALLEL_LINE_EPSILON
    ) {
      return current;
    }

    const previousOffsetPoint = {
      x:
        current.x +
        ((-previousDirection.y / previousLength) * offset * winding),
      y:
        current.y +
        ((previousDirection.x / previousLength) * offset * winding),
    };
    const nextOffsetPoint = {
      x: current.x + ((-nextDirection.y / nextLength) * offset * winding),
      y: current.y + ((nextDirection.x / nextLength) * offset * winding),
    };

    const intersection =
      intersectOffsetLines(
        previousOffsetPoint,
        previousDirection,
        nextOffsetPoint,
        nextDirection,
      ) ?? nextOffsetPoint;

    return {
      x: roundCoordinate(intersection.x),
      y: roundCoordinate(intersection.y),
    };
  });

  const validatedPolygon = validateWallTopology(offsetPolygon, signedArea);
  const offsetArea = computeSignedArea(validatedPolygon);

  if (
    Math.abs(offsetArea) <= PARALLEL_LINE_EPSILON ||
    offsetArea * signedArea <= 0
  ) {
    return [...points];
  }

  return validatedPolygon;
}

function createInteriorInsetPolygon(
  points: readonly Viewer25DPoint2D[],
  inset: number,
): Viewer25DPoint2D[] {
  if (points.length < 3) {
    return [...points];
  }

  const signedArea = computeSignedArea(points);

  if (Math.abs(signedArea) <= PARALLEL_LINE_EPSILON) {
    return [...points];
  }

  const winding = signedArea > 0 ? 1 : -1;
  const insetPolygon: Viewer25DPoint2D[] = [];

  for (let index = 0; index < points.length; index += 1) {
    const previous = points[(index - 1 + points.length) % points.length];
    const current = points[index];
    const next = points[(index + 1) % points.length];
    const previousDirection = {
      x: current.x - previous.x,
      y: current.y - previous.y,
    };
    const nextDirection = {
      x: next.x - current.x,
      y: next.y - current.y,
    };
    const previousLength = Math.hypot(
      previousDirection.x,
      previousDirection.y,
    );
    const nextLength = Math.hypot(nextDirection.x, nextDirection.y);

    if (
      previousLength <= PARALLEL_LINE_EPSILON ||
      nextLength <= PARALLEL_LINE_EPSILON
    ) {
      appendUniqueRoundedPoint(insetPolygon, current);
      continue;
    }

    const previousOffsetPoint = {
      x:
        current.x +
        ((-previousDirection.y / previousLength) * inset * winding),
      y:
        current.y +
        ((previousDirection.x / previousLength) * inset * winding),
    };
    const nextOffsetPoint = {
      x: current.x + ((-nextDirection.y / nextLength) * inset * winding),
      y: current.y + ((nextDirection.x / nextLength) * inset * winding),
    };
    const intersection = intersectOffsetLines(
      previousOffsetPoint,
      previousDirection,
      nextOffsetPoint,
      nextDirection,
    );

    if (
      intersection &&
      isPointInsideOrOnPolygon(intersection, points)
    ) {
      appendUniqueRoundedPoint(insetPolygon, intersection);
      continue;
    }

    if (isPointInsideOrOnPolygon(previousOffsetPoint, points)) {
      appendUniqueRoundedPoint(insetPolygon, previousOffsetPoint);
    }

    if (isPointInsideOrOnPolygon(nextOffsetPoint, points)) {
      appendUniqueRoundedPoint(insetPolygon, nextOffsetPoint);
    }
  }

  const normalizedInsetPolygon = normalizePolygonTopology(insetPolygon);
  const validatedInsetPolygon = validateWallTopology(
    normalizedInsetPolygon,
    signedArea,
  );
  const insetArea = computeSignedArea(validatedInsetPolygon);

  if (
    validatedInsetPolygon.length < 3 ||
    Math.abs(insetArea) <= PARALLEL_LINE_EPSILON ||
    insetArea * signedArea <= 0
  ) {
    return createParallelPolygon(points, inset);
  }

  return validatedInsetPolygon;
}

function appendUniqueRoundedPoint(
  points: Viewer25DPoint2D[],
  point: Viewer25DPoint2D,
): void {
  const roundedPoint = roundPoint(point);

  if (!arePointsEquivalent(points.at(-1), roundedPoint)) {
    points.push(roundedPoint);
  }
}

function isPointInsideOrOnPolygon(
  point: Viewer25DPoint2D,
  polygon: readonly Viewer25DPoint2D[],
): boolean {
  if (polygon.length < 3) {
    return false;
  }

  let isInside = false;

  for (
    let index = 0, previousIndex = polygon.length - 1;
    index < polygon.length;
    previousIndex = index, index += 1
  ) {
    const start = polygon[previousIndex];
    const end = polygon[index];

    if (isPointOnSegment(point, start, end)) {
      return true;
    }

    const crossesScanline =
      (start.y > point.y) !== (end.y > point.y);

    if (!crossesScanline) {
      continue;
    }

    const intersectionX =
      ((end.x - start.x) * (point.y - start.y)) / (end.y - start.y) +
      start.x;

    if (intersectionX >= point.x - PARALLEL_LINE_EPSILON) {
      isInside = !isInside;
    }
  }

  return isInside;
}

function isPointOnSegment(
  point: Viewer25DPoint2D,
  start: Viewer25DPoint2D,
  end: Viewer25DPoint2D,
): boolean {
  const cross =
    (point.y - start.y) * (end.x - start.x) -
    (point.x - start.x) * (end.y - start.y);

  if (Math.abs(cross) > PARALLEL_LINE_EPSILON) {
    return false;
  }

  const dot =
    (point.x - start.x) * (end.x - start.x) +
    (point.y - start.y) * (end.y - start.y);

  if (dot < -PARALLEL_LINE_EPSILON) {
    return false;
  }

  const squaredLength =
    (end.x - start.x) * (end.x - start.x) +
    (end.y - start.y) * (end.y - start.y);

  return dot <= squaredLength + PARALLEL_LINE_EPSILON;
}

export function validateWallTopology(
  points: readonly Viewer25DPoint2D[],
  expectedSignedArea: number = computeSignedArea(points),
): Viewer25DPoint2D[] {
  const normalizedPoints = normalizePolygonTopology(points);

  if (normalizedPoints.length < 3) {
    return [...points];
  }

  const expectedWinding = expectedSignedArea >= 0 ? 1 : -1;
  const repairedPoints = repairSelfIntersections(normalizedPoints);
  const repairedArea = computeSignedArea(repairedPoints);

  if (
    repairedPoints.length < 3 ||
    Math.abs(repairedArea) <= PARALLEL_LINE_EPSILON ||
    repairedArea * expectedWinding <= 0
  ) {
    return [...points];
  }

  const validation = inspectWallTopology(repairedPoints);

  if (!validation.isContinuous || validation.isSelfIntersecting) {
    return [...points];
  }

  return repairedPoints;
}

export function inspectWallTopology(
  points: readonly Viewer25DPoint2D[],
): Viewer25DWallTopologyValidationResult {
  const normalizedPoints = normalizePolygonTopology(points);

  if (normalizedPoints.length < 3) {
    return {
      isContinuous: false,
      isSelfIntersecting: false,
      points: normalizedPoints,
    };
  }

  return {
    isContinuous: arePolygonEdgesContinuous(normalizedPoints),
    isSelfIntersecting: findSelfIntersection(normalizedPoints) !== null,
    points: normalizedPoints,
  };
}

function roundCoordinate(value: number): number {
  return Math.round(value * COORDINATE_PRECISION) / COORDINATE_PRECISION;
}

function roundPoint(point: Viewer25DPoint2D): Viewer25DPoint2D {
  return {
    x: roundCoordinate(point.x),
    y: roundCoordinate(point.y),
  };
}

function arePointsEquivalent(
  left: Viewer25DPoint2D | undefined,
  right: Viewer25DPoint2D,
): boolean {
  if (!left) {
    return false;
  }

  return (
    Math.abs(left.x - right.x) <= PARALLEL_LINE_EPSILON &&
    Math.abs(left.y - right.y) <= PARALLEL_LINE_EPSILON
  );
}

function calculateBounds(
  points: readonly Viewer25DPoint2D[],
): Viewer25DPlacementBounds {
  return points.reduce<Viewer25DPlacementBounds>(
    (bounds, point) => ({
      minX: Math.min(bounds.minX, point.x),
      minY: Math.min(bounds.minY, point.y),
      maxX: Math.max(bounds.maxX, point.x),
      maxY: Math.max(bounds.maxY, point.y),
    }),
    {
      minX: Number.POSITIVE_INFINITY,
      minY: Number.POSITIVE_INFINITY,
      maxX: Number.NEGATIVE_INFINITY,
      maxY: Number.NEGATIVE_INFINITY,
    },
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function normalizePolygonTopology(
  points: readonly Viewer25DPoint2D[],
): Viewer25DPoint2D[] {
  const dedupedPoints = points.reduce<Viewer25DPoint2D[]>((result, point) => {
    const roundedPoint = roundPoint(point);

    if (!arePointsEquivalent(result.at(-1), roundedPoint)) {
      result.push(roundedPoint);
    }

    return result;
  }, []);

  if (
    dedupedPoints.length >= 2 &&
    arePointsEquivalent(dedupedPoints[0], dedupedPoints.at(-1)!)
  ) {
    dedupedPoints.pop();
  }

  if (dedupedPoints.length < 3) {
    return dedupedPoints;
  }

  let didRemovePoint = true;
  let normalizedPoints = dedupedPoints;

  while (didRemovePoint && normalizedPoints.length >= 3) {
    didRemovePoint = false;
    const nextPoints: Viewer25DPoint2D[] = [];

    for (let index = 0; index < normalizedPoints.length; index += 1) {
      const previous =
        normalizedPoints[
          (index - 1 + normalizedPoints.length) % normalizedPoints.length
        ];
      const current = normalizedPoints[index];
      const next =
        normalizedPoints[(index + 1) % normalizedPoints.length];

      if (isDegenerateCorner(previous, current, next)) {
        didRemovePoint = true;
        continue;
      }

      nextPoints.push(current);
    }

    normalizedPoints = nextPoints;
  }

  return normalizedPoints;
}

function isDegenerateCorner(
  previous: Viewer25DPoint2D,
  current: Viewer25DPoint2D,
  next: Viewer25DPoint2D,
): boolean {
  const incoming = {
    x: current.x - previous.x,
    y: current.y - previous.y,
  };
  const outgoing = {
    x: next.x - current.x,
    y: next.y - current.y,
  };
  const incomingLength = Math.hypot(incoming.x, incoming.y);
  const outgoingLength = Math.hypot(outgoing.x, outgoing.y);

  if (
    incomingLength <= PARALLEL_LINE_EPSILON ||
    outgoingLength <= PARALLEL_LINE_EPSILON
  ) {
    return true;
  }

  const cross = incoming.x * outgoing.y - incoming.y * outgoing.x;
  const dot = incoming.x * outgoing.x + incoming.y * outgoing.y;

  return Math.abs(cross) <= PARALLEL_LINE_EPSILON && dot >= 0;
}

function repairSelfIntersections(
  points: readonly Viewer25DPoint2D[],
): Viewer25DPoint2D[] {
  let repairedPoints = [...points];
  const expectedWinding = computeSignedArea(points) >= 0 ? 1 : -1;
  let remainingIterations = repairedPoints.length * repairedPoints.length;

  while (remainingIterations > 0) {
    const intersection = findSelfIntersection(repairedPoints);

    if (!intersection) {
      return repairedPoints;
    }

    repairedPoints = collapseIntersectionLoop(
      repairedPoints,
      intersection,
      expectedWinding,
    );
    repairedPoints = normalizePolygonTopology(repairedPoints);

    if (repairedPoints.length < 3) {
      return repairedPoints;
    }

    remainingIterations -= 1;
  }

  return repairedPoints;
}

function collapseIntersectionLoop(
  points: readonly Viewer25DPoint2D[],
  intersection: {
    edgeAIndex: number;
    edgeBIndex: number;
    point: Viewer25DPoint2D;
  },
  expectedWinding: number,
): Viewer25DPoint2D[] {
  const { edgeAIndex, edgeBIndex, point } = intersection;
  const candidates = [
    [point, ...points.slice(edgeAIndex + 1, edgeBIndex + 1)],
    [
      point,
      ...points.slice(edgeBIndex + 1),
      ...points.slice(0, edgeAIndex + 1),
    ],
  ]
    .map((candidate) => normalizePolygonTopology(candidate))
    .filter((candidate) => candidate.length >= 3)
    .filter((candidate) => {
      const area = computeSignedArea(candidate);

      return (
        Math.abs(area) > PARALLEL_LINE_EPSILON && area * expectedWinding > 0
      );
    })
    .sort(
      (left, right) =>
        Math.abs(computeSignedArea(right)) - Math.abs(computeSignedArea(left)),
    );

  return candidates[0] ?? [];
}

function arePolygonEdgesContinuous(
  points: readonly Viewer25DPoint2D[],
): boolean {
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];

    if (
      Math.hypot(next.x - current.x, next.y - current.y) <=
      PARALLEL_LINE_EPSILON
    ) {
      return false;
    }
  }

  return true;
}

function findSelfIntersection(
  points: readonly Viewer25DPoint2D[],
): {
  edgeAIndex: number;
  edgeBIndex: number;
  point: Viewer25DPoint2D;
} | null {
  for (let edgeAIndex = 0; edgeAIndex < points.length; edgeAIndex += 1) {
    const edgeAStart = points[edgeAIndex];
    const edgeAEnd = points[(edgeAIndex + 1) % points.length];

    for (
      let edgeBIndex = edgeAIndex + 1;
      edgeBIndex < points.length;
      edgeBIndex += 1
    ) {
      if (areAdjacentEdges(points.length, edgeAIndex, edgeBIndex)) {
        continue;
      }

      const edgeBStart = points[edgeBIndex];
      const edgeBEnd = points[(edgeBIndex + 1) % points.length];
      const intersectionPoint = findSegmentIntersection(
        edgeAStart,
        edgeAEnd,
        edgeBStart,
        edgeBEnd,
      );

      if (intersectionPoint) {
        return {
          edgeAIndex,
          edgeBIndex,
          point: intersectionPoint,
        };
      }
    }
  }

  return null;
}

function areAdjacentEdges(
  pointCount: number,
  leftEdgeIndex: number,
  rightEdgeIndex: number,
): boolean {
  if (leftEdgeIndex === rightEdgeIndex) {
    return true;
  }

  const nextLeftEdgeIndex = (leftEdgeIndex + 1) % pointCount;
  const nextRightEdgeIndex = (rightEdgeIndex + 1) % pointCount;

  return (
    nextLeftEdgeIndex === rightEdgeIndex || nextRightEdgeIndex === leftEdgeIndex
  );
}

function findSegmentIntersection(
  startA: Viewer25DPoint2D,
  endA: Viewer25DPoint2D,
  startB: Viewer25DPoint2D,
  endB: Viewer25DPoint2D,
): Viewer25DPoint2D | null {
  const directionA = {
    x: endA.x - startA.x,
    y: endA.y - startA.y,
  };
  const directionB = {
    x: endB.x - startB.x,
    y: endB.y - startB.y,
  };
  const denominator =
    directionA.x * directionB.y - directionA.y * directionB.x;

  if (Math.abs(denominator) <= PARALLEL_LINE_EPSILON) {
    return null;
  }

  const delta = {
    x: startB.x - startA.x,
    y: startB.y - startA.y,
  };
  const t =
    (delta.x * directionB.y - delta.y * directionB.x) / denominator;
  const u =
    (delta.x * directionA.y - delta.y * directionA.x) / denominator;

  if (
    t <= PARALLEL_LINE_EPSILON ||
    t >= 1 - PARALLEL_LINE_EPSILON ||
    u <= PARALLEL_LINE_EPSILON ||
    u >= 1 - PARALLEL_LINE_EPSILON
  ) {
    return null;
  }

  return roundPoint({
    x: startA.x + directionA.x * t,
    y: startA.y + directionA.y * t,
  });
}
