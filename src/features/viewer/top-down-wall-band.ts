import * as THREE from "three";

import {
  inspectWallTopology,
  type Viewer25DPoint2D,
} from "../../components/viewer/viewer25dGeometry.ts";
import {
  createWallJunctionAssembly,
  validateWallBandTopology,
  type WallBandRing,
} from "./wall-junction-assembly.ts";

export interface TopDownWallBandPath {
  outerOutline: Viewer25DPoint2D[];
  innerContour: Viewer25DPoint2D[];
  drawPath: Viewer25DPoint2D[];
}

export function createTopDownWallBandPath(
  wallBand: WallBandRing,
): TopDownWallBandPath | null;
export function createTopDownWallBandPath(
  points: readonly Viewer25DPoint2D[],
  thickness: number,
): TopDownWallBandPath | null;
export function createTopDownWallBandPath(
  pointsOrWallBand: readonly Viewer25DPoint2D[] | WallBandRing,
  thickness?: number,
): TopDownWallBandPath | null {
  if (!Array.isArray(pointsOrWallBand)) {
    return createTopDownWallBandPathFromWallBand(pointsOrWallBand as WallBandRing);
  }

  if (typeof thickness !== "number" || !Number.isFinite(thickness) || thickness <= 0) {
    return null;
  }

  const assembly = createWallJunctionAssembly(pointsOrWallBand, {
    curveSegments: 2,
    height: 1,
    thickness,
    topEdgeRadius: 0,
  });

  if (assembly.wallBand == null) {
    return null;
  }

  return createTopDownWallBandPathFromWallBand(assembly.wallBand);
}

function createTopDownWallBandPathFromWallBand(
  wallBand: WallBandRing,
): TopDownWallBandPath | null {
  if (
    wallBand.outerOutline.length < 3 ||
    wallBand.innerContour.length < 3 ||
    !isRenderableWallBandContourPair(wallBand.outerOutline, wallBand.innerContour) ||
    validateWallBandTopology(wallBand).isRejected
  ) {
    return null;
  }

  return {
    outerOutline: [...wallBand.outerOutline],
    innerContour: [...wallBand.innerContour],
    drawPath: [...wallBand.stitchedLoop],
  };
}

export function createTopDownWallBandShape(
  wallBand: TopDownWallBandPath,
): THREE.Shape | null {
  if (!isRenderableWallBandContourPair(wallBand.outerOutline, wallBand.innerContour)) {
    return null;
  }

  const shape = new THREE.Shape();
  appendClosedPath(shape, projectTopDownPath(wallBand.outerOutline, "outer"));

  const hole = new THREE.Path();
  appendClosedPath(hole, projectTopDownPath(wallBand.innerContour, "hole"));
  shape.holes.push(hole);

  return shape;
}

function projectTopDownPath(
  points: readonly Viewer25DPoint2D[],
  ring: "outer" | "hole",
): Viewer25DPoint2D[] {
  const projected = points.map((point) => ({
    x: point.x,
    y: -point.y,
  }));

  const isClockwise = THREE.ShapeUtils.isClockWise(projected);

  if (ring === "outer") {
    return isClockwise ? projected : [...projected].reverse();
  }

  return isClockwise ? [...projected].reverse() : projected;
}

function appendClosedPath(
  path: THREE.Shape | THREE.Path,
  points: readonly Viewer25DPoint2D[],
): void {
  if (points.length === 0) {
    return;
  }

  path.moveTo(points[0].x, points[0].y);

  for (let index = 1; index < points.length; index += 1) {
    path.lineTo(points[index].x, points[index].y);
  }

  path.closePath();
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

      if (findSegmentIntersection(outerStart, outerEnd, innerStart, innerEnd) != null) {
        return true;
      }
    }
  }

  return false;
}

function findSegmentIntersection(
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
