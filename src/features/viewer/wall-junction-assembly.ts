import {
  createInsetPolygon,
  createSoftenedWallCornerPaths,
  inspectWallTopology,
  type Viewer25DGeometryConfig,
  type Viewer25DPoint2D,
} from "../../components/viewer/viewer25dGeometry.ts";
import type { WallProfileOptions } from "./wall-profile.ts";

const MIN_SEGMENT_LENGTH = 0.001;

export interface WallJunctionAssemblyOptions
  extends WallProfileOptions,
    Viewer25DGeometryConfig {
  baseOffset?: number;
}

interface WallJunctionSectionBase {
  angle: number;
  end: Viewer25DPoint2D;
  length: number;
  start: Viewer25DPoint2D;
}

export interface WallCornerJunctionSection extends WallJunctionSectionBase {
  cornerIndex: number;
  cornerPathPointCount: number;
  kind: "corner";
  originalCorner: Viewer25DPoint2D;
  path: Viewer25DPoint2D[];
}

export interface StraightWallJunctionSection extends WallJunctionSectionBase {
  fromCornerIndex: number | null;
  kind: "straight";
  toCornerIndex: number | null;
}

export type WallJunctionSection =
  | WallCornerJunctionSection
  | StraightWallJunctionSection;

export interface WallJunctionAssembly {
  isClosedLoop: boolean;
  sections: WallJunctionSection[];
  straightSectionCount: number;
  cornerSectionCount: number;
  wallBand: WallBandRing | null;
}

export interface WallBandRing {
  outerOutline: Viewer25DPoint2D[];
  innerContour: Viewer25DPoint2D[];
  stitchedLoop: Viewer25DPoint2D[];
}

export interface WallBandTopologyValidationResult {
  isConvex: boolean;
  isRejected: boolean;
  isContinuous: boolean;
  isSelfIntersecting: boolean;
}

export function createWallJunctionAssembly(
  points: readonly Viewer25DPoint2D[],
  options: WallJunctionAssemblyOptions,
): WallJunctionAssembly {
  if (points.length < 2) {
    return {
      isClosedLoop: false,
      sections: [],
      straightSectionCount: 0,
      cornerSectionCount: 0,
      wallBand: null,
    };
  }

  if (points.length === 2) {
    const straightSection = createStraightSection(points[0], points[1], null, null);
    return {
      isClosedLoop: false,
      sections: straightSection == null ? [] : [straightSection],
      straightSectionCount: straightSection == null ? 0 : 1,
      cornerSectionCount: 0,
      wallBand: null,
    };
  }

  const outerOutline = normalizeClosedOutline(points);
  const innerContour = createInsetPolygon(outerOutline, options.thickness);
  const cornerPaths = createSoftenedWallCornerPaths(outerOutline, options);
  const sections: WallJunctionSection[] = [];
  let cornerSectionCount = 0;
  let straightSectionCount = 0;

  for (let index = 0; index < cornerPaths.length; index += 1) {
    const currentPath = cornerPaths[index];
    const nextPath = cornerPaths[(index + 1) % cornerPaths.length];

    for (let pathIndex = 0; pathIndex < currentPath.path.length - 1; pathIndex += 1) {
      const start = currentPath.path[pathIndex];
      const end = currentPath.path[pathIndex + 1];
      const cornerSection = createCornerSection(currentPath, start, end);

      if (cornerSection == null) {
        continue;
      }

      sections.push(cornerSection);
      cornerSectionCount += 1;
    }

    const straightSection = createStraightSection(
      readTerminalPoint(currentPath.path, currentPath.originalCorner),
      readInitialPoint(nextPath.path, nextPath.originalCorner),
      currentPath.index,
      nextPath.index,
    );

    if (straightSection == null) {
      continue;
    }

    sections.push(straightSection);
    straightSectionCount += 1;
  }

  return {
    isClosedLoop: true,
    sections,
    straightSectionCount,
    cornerSectionCount,
    wallBand: createWallBandRing(outerOutline, innerContour),
  };
}

export function createWallBandRing(
  outerOutline: readonly Viewer25DPoint2D[],
  innerContour: readonly Viewer25DPoint2D[],
): WallBandRing | null {
  if (outerOutline.length < 3 || innerContour.length < 3) {
    return null;
  }

  const alignedWallBand = alignWallBandContours(outerOutline, innerContour);

  if (alignedWallBand == null) {
    return null;
  }

  return alignedWallBand;
}

export function validateWallBandTopology(
  wallBand: Pick<WallBandRing, "stitchedLoop">
    & Partial<Pick<WallBandRing, "outerOutline" | "innerContour">>,
): WallBandTopologyValidationResult {
  const topology = inspectWallTopology(wallBand.stitchedLoop);
  const hasRenderableContourPair =
    wallBand.outerOutline == null ||
    wallBand.innerContour == null ||
    isRenderableWallBandContourPair(
      wallBand.outerOutline,
      wallBand.innerContour,
    );
  const preservesConvexWallBand =
    wallBand.outerOutline == null ||
    wallBand.innerContour == null ||
    !isConvexPolygon(wallBand.outerOutline) ||
    isConvexPolygon(wallBand.innerContour);

  return {
    isConvex: preservesConvexWallBand,
    isRejected:
      !topology.isContinuous ||
      topology.isSelfIntersecting ||
      !hasRenderableContourPair ||
      !preservesConvexWallBand,
    isContinuous: topology.isContinuous,
    isSelfIntersecting: topology.isSelfIntersecting,
  };
}

function alignWallBandContours(
  outerOutline: readonly Viewer25DPoint2D[],
  innerContour: readonly Viewer25DPoint2D[],
): WallBandRing | null {
  let bestWallBand: WallBandRing | null = null;
  let bestBridgeScore = Number.POSITIVE_INFINITY;

  for (let startIndex = 0; startIndex < innerContour.length; startIndex += 1) {
    const rotatedInnerContour = rotateClosedRing(innerContour, startIndex);
    const candidateWallBand = {
      outerOutline: [...outerOutline],
      innerContour: rotatedInnerContour,
      stitchedLoop: [...outerOutline, ...[...rotatedInnerContour].reverse()],
    };

    if (validateWallBandTopology(candidateWallBand).isRejected) {
      continue;
    }

    const bridgeScore = measureBridgeScore(
      outerOutline,
      rotatedInnerContour,
    );

    if (bridgeScore >= bestBridgeScore) {
      continue;
    }

    bestWallBand = candidateWallBand;
    bestBridgeScore = bridgeScore;
  }

  return bestWallBand;
}

function createCornerSection(
  cornerPath: ReturnType<typeof createSoftenedWallCornerPaths>[number],
  start: Viewer25DPoint2D,
  end: Viewer25DPoint2D,
): WallCornerJunctionSection | null {
  const length = measureLength(start, end);

  if (length <= MIN_SEGMENT_LENGTH) {
    return null;
  }

  return {
    angle: readAngle(start, end),
    cornerIndex: cornerPath.index,
    cornerPathPointCount: cornerPath.path.length,
    end,
    kind: "corner",
    length,
    originalCorner: cornerPath.originalCorner,
    path: [...cornerPath.path],
    start,
  };
}

function createStraightSection(
  start: Viewer25DPoint2D,
  end: Viewer25DPoint2D,
  fromCornerIndex: number | null,
  toCornerIndex: number | null,
): StraightWallJunctionSection | null {
  const length = measureLength(start, end);

  if (length <= MIN_SEGMENT_LENGTH) {
    return null;
  }

  return {
    angle: readAngle(start, end),
    end,
    fromCornerIndex,
    kind: "straight",
    length,
    start,
    toCornerIndex,
  };
}

function measureLength(
  start: Viewer25DPoint2D,
  end: Viewer25DPoint2D,
): number {
  return Math.hypot(end.x - start.x, end.y - start.y);
}

function readAngle(
  start: Viewer25DPoint2D,
  end: Viewer25DPoint2D,
): number {
  return -Math.atan2(end.y - start.y, end.x - start.x);
}

function readInitialPoint(
  path: readonly Viewer25DPoint2D[],
  fallback: Viewer25DPoint2D,
): Viewer25DPoint2D {
  return path[0] ?? fallback;
}

function readTerminalPoint(
  path: readonly Viewer25DPoint2D[],
  fallback: Viewer25DPoint2D,
): Viewer25DPoint2D {
  return path[path.length - 1] ?? fallback;
}

function normalizeClosedOutline(
  points: readonly Viewer25DPoint2D[],
): Viewer25DPoint2D[] {
  const outline: Viewer25DPoint2D[] = [];

  for (const point of points) {
    if (!arePointsExactlyEqual(outline.at(-1), point)) {
      outline.push({ x: point.x, y: point.y });
    }
  }

  if (
    outline.length >= 2
    && arePointsExactlyEqual(outline[0], outline.at(-1)!)
  ) {
    outline.pop();
  }

  return outline;
}

function rotateClosedRing(
  points: readonly Viewer25DPoint2D[],
  startIndex: number,
): Viewer25DPoint2D[] {
  return [
    ...points.slice(startIndex),
    ...points.slice(0, startIndex),
  ];
}

function measureBridgeScore(
  outerOutline: readonly Viewer25DPoint2D[],
  innerContour: readonly Viewer25DPoint2D[],
): number {
  const outerStart = outerOutline[0];
  const outerEnd = outerOutline[outerOutline.length - 1];
  const innerStart = innerContour[0];
  const innerEnd = innerContour[innerContour.length - 1];

  return (
    measureLength(outerEnd, innerEnd) +
    measureLength(innerStart, outerStart)
  );
}

function isRenderableWallBandContourPair(
  outerOutline: readonly Viewer25DPoint2D[],
  innerContour: readonly Viewer25DPoint2D[],
): boolean {
  const outerTopology = inspectWallTopology(outerOutline);
  const innerTopology = inspectWallTopology(innerContour);

  if (
    !outerTopology.isContinuous ||
    outerTopology.isSelfIntersecting ||
    !innerTopology.isContinuous ||
    innerTopology.isSelfIntersecting
  ) {
    return false;
  }

  if (!innerContour.every((point) => isPointInsideOrOnPolygon(point, outerOutline))) {
    return false;
  }

  return !doPolygonEdgesIntersect(outerOutline, innerContour);
}

function isPointInsideOrOnPolygon(
  point: Viewer25DPoint2D,
  polygon: readonly Viewer25DPoint2D[],
): boolean {
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

    const crossesScanline = (start.y > point.y) !== (end.y > point.y);

    if (!crossesScanline) {
      continue;
    }

    const intersectionX =
      ((end.x - start.x) * (point.y - start.y)) / (end.y - start.y) +
      start.x;

    if (intersectionX >= point.x - 1e-6) {
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

  if (Math.abs(cross) > 1e-6) {
    return false;
  }

  const dot =
    (point.x - start.x) * (end.x - start.x) +
    (point.y - start.y) * (end.y - start.y);

  if (dot < -1e-6) {
    return false;
  }

  const squaredLength =
    (end.x - start.x) * (end.x - start.x) +
    (end.y - start.y) * (end.y - start.y);

  return dot <= squaredLength + 1e-6;
}

function doPolygonEdgesIntersect(
  outerOutline: readonly Viewer25DPoint2D[],
  innerContour: readonly Viewer25DPoint2D[],
): boolean {
  for (let outerIndex = 0; outerIndex < outerOutline.length; outerIndex += 1) {
    const outerStart = outerOutline[outerIndex];
    const outerEnd = outerOutline[(outerIndex + 1) % outerOutline.length];

    for (let innerIndex = 0; innerIndex < innerContour.length; innerIndex += 1) {
      const innerStart = innerContour[innerIndex];
      const innerEnd = innerContour[(innerIndex + 1) % innerContour.length];

      if (findEdgeIntersection(outerStart, outerEnd, innerStart, innerEnd) != null) {
        return true;
      }
    }
  }

  return false;
}

function isConvexPolygon(points: readonly Viewer25DPoint2D[]): boolean {
  if (points.length < 3) {
    return false;
  }

  let windingSign = 0;

  for (let index = 0; index < points.length; index += 1) {
    const previous = points[(index + points.length - 1) % points.length];
    const current = points[index];
    const next = points[(index + 1) % points.length];
    const crossProduct =
      (current.x - previous.x) * (next.y - current.y) -
      (current.y - previous.y) * (next.x - current.x);

    if (Math.abs(crossProduct) <= 1e-6) {
      continue;
    }

    const currentSign = Math.sign(crossProduct);

    if (windingSign === 0) {
      windingSign = currentSign;
      continue;
    }

    if (currentSign !== windingSign) {
      return false;
    }
  }

  return windingSign !== 0;
}

function findEdgeIntersection(
  startA: Viewer25DPoint2D,
  endA: Viewer25DPoint2D,
  startB: Viewer25DPoint2D,
  endB: Viewer25DPoint2D,
): Viewer25DPoint2D | null {
  const deltaA = {
    x: endA.x - startA.x,
    y: endA.y - startA.y,
  };
  const deltaB = {
    x: endB.x - startB.x,
    y: endB.y - startB.y,
  };
  const determinant = deltaA.x * deltaB.y - deltaA.y * deltaB.x;

  if (Math.abs(determinant) <= 1e-6) {
    return null;
  }

  const deltaStart = {
    x: startB.x - startA.x,
    y: startB.y - startA.y,
  };
  const ratioA =
    (deltaStart.x * deltaB.y - deltaStart.y * deltaB.x) / determinant;
  const ratioB =
    (deltaStart.x * deltaA.y - deltaStart.y * deltaA.x) / determinant;

  if (ratioA <= 1e-6 || ratioA >= 1 - 1e-6 || ratioB <= 1e-6 || ratioB >= 1 - 1e-6) {
    return null;
  }

  return {
    x: startA.x + deltaA.x * ratioA,
    y: startA.y + deltaA.y * ratioA,
  };
}

function arePointsExactlyEqual(
  left: Viewer25DPoint2D | undefined,
  right: Viewer25DPoint2D,
): boolean {
  if (left == null) {
    return false;
  }

  return left.x === right.x && left.y === right.y;
}
