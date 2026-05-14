export const DEFAULT_WALL_HEIGHT_SCALE = 0.3;
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
const MIN_WALL_CORNER_SEGMENTS = 1;

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

export interface Viewer25DWallTopologyValidationResult {
  isContinuous: boolean;
  isSelfIntersecting: boolean;
  points: Viewer25DPoint2D[];
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
  if (points.length < 3) {
    return [...points];
  }

  const signedArea = computeSignedArea(points);

  if (Math.abs(signedArea) <= PARALLEL_LINE_EPSILON) {
    return [...points];
  }

  const resolvedRadius = resolveWallCornerRadius(config);
  const wallCornerSegments = normalizeWallCornerSegments(
    config.wallCornerSegments ?? DEFAULT_WALL_CORNER_SEGMENTS,
  );
  const wallCornerStyle = config.wallCornerStyle ?? "rounded";
  const winding = signedArea > 0 ? 1 : -1;
  const softenedPolygon: Viewer25DPoint2D[] = [];

  for (let index = 0; index < points.length; index += 1) {
    const previous = points[(index - 1 + points.length) % points.length];
    const current = points[index];
    const next = points[(index + 1) % points.length];
    const softenedCorner = createSoftenedCornerJoin(
      previous,
      current,
      next,
      resolvedRadius,
      wallCornerStyle,
      wallCornerSegments,
      winding,
    );

    if (!softenedCorner) {
      softenedPolygon.push(current);
      continue;
    }

    for (const point of softenedCorner) {
      if (!arePointsEquivalent(softenedPolygon.at(-1), point)) {
        softenedPolygon.push(point);
      }
    }
  }

  return softenedPolygon;
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

function createSoftenedCornerJoin(
  previous: Viewer25DPoint2D,
  current: Viewer25DPoint2D,
  next: Viewer25DPoint2D,
  radius: number,
  style: Viewer25DWallCornerStyle,
  segments: number,
  winding: number,
): Viewer25DPoint2D[] | null {
  if (radius <= PARALLEL_LINE_EPSILON) {
    return null;
  }

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
    return null;
  }

  const normalizedIncoming = {
    x: incoming.x / incomingLength,
    y: incoming.y / incomingLength,
  };
  const normalizedOutgoing = {
    x: outgoing.x / outgoingLength,
    y: outgoing.y / outgoingLength,
  };
  const turn =
    normalizedIncoming.x * normalizedOutgoing.y -
    normalizedIncoming.y * normalizedOutgoing.x;

  if (turn * winding <= PARALLEL_LINE_EPSILON) {
    return null;
  }

  const offsetDistance = Math.min(
    radius,
    incomingLength / 2 - PARALLEL_LINE_EPSILON,
    outgoingLength / 2 - PARALLEL_LINE_EPSILON,
  );

  if (offsetDistance <= PARALLEL_LINE_EPSILON) {
    return null;
  }

  const start = {
    x: current.x - normalizedIncoming.x * offsetDistance,
    y: current.y - normalizedIncoming.y * offsetDistance,
  };
  const end = {
    x: current.x + normalizedOutgoing.x * offsetDistance,
    y: current.y + normalizedOutgoing.y * offsetDistance,
  };

  if (style === "chamfer") {
    return [roundPoint(start), roundPoint(end)];
  }

  return createRoundedCornerJoin(start, current, end, segments);
}

function createRoundedCornerJoin(
  start: Viewer25DPoint2D,
  control: Viewer25DPoint2D,
  end: Viewer25DPoint2D,
  segments: number,
): Viewer25DPoint2D[] {
  const points: Viewer25DPoint2D[] = [];

  for (let step = 0; step <= segments; step += 1) {
    const t = step / segments;
    const inverseT = 1 - t;
    points.push(
      roundPoint({
        x:
          inverseT * inverseT * start.x +
          2 * inverseT * t * control.x +
          t * t * end.x,
        y:
          inverseT * inverseT * start.y +
          2 * inverseT * t * control.y +
          t * t * end.y,
      }),
    );
  }

  return points;
}

export function createInsetPolygon(
  points: readonly Viewer25DPoint2D[],
  inset: number,
): Viewer25DPoint2D[] {
  if (inset <= 0) {
    return [...points];
  }

  return createParallelPolygon(points, inset);
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

function normalizeWallCornerSegments(value: number): number {
  if (!Number.isFinite(value) || value < MIN_WALL_CORNER_SEGMENTS) {
    throw new Error("Wall corner segments must be a finite integer greater than or equal to 1.");
  }

  return Math.floor(value);
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
