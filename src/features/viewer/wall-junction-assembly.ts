import {
  createSoftenedWallCornerPaths,
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
    };
  }

  if (points.length === 2) {
    const straightSection = createStraightSection(points[0], points[1], null, null);
    return {
      isClosedLoop: false,
      sections: straightSection == null ? [] : [straightSection],
      straightSectionCount: straightSection == null ? 0 : 1,
      cornerSectionCount: 0,
    };
  }

  const cornerPaths = createSoftenedWallCornerPaths(points, options);
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
  };
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
