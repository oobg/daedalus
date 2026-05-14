const PARALLEL_LINE_EPSILON = 1e-6;
const COORDINATE_PRECISION = 1e6;
const MIN_WALL_CORNER_SEGMENTS = 1;
const DEFAULT_WALL_CORNER_SEGMENTS = 4;

export interface WallCornerProfilePoint {
  x: number;
  y: number;
}

export type WallCornerProfileStyle = "chamfer" | "rounded";

export interface WallCornerProfileOptions {
  radius: number;
  style?: WallCornerProfileStyle;
  segments?: number;
  winding?: 1 | -1;
}

export interface WallCornerProfileResult {
  path: WallCornerProfilePoint[];
  radius: number;
  style: WallCornerProfileStyle;
  isSoftened: boolean;
}

export function createOuterWallCornerProfile(
  previous: WallCornerProfilePoint,
  current: WallCornerProfilePoint,
  next: WallCornerProfilePoint,
  options: WallCornerProfileOptions,
): WallCornerProfileResult {
  const radius = options.radius;
  const style = options.style ?? "rounded";
  const segments = normalizeWallCornerSegments(
    options.segments ?? DEFAULT_WALL_CORNER_SEGMENTS,
  );
  const winding = options.winding ?? inferCornerWinding(previous, current, next);
  const path = createSoftenedCornerJoin(
    previous,
    current,
    next,
    radius,
    style,
    segments,
    winding,
    "outer",
  );

  if (path == null) {
    return {
      path: [roundPoint(current)],
      radius,
      style,
      isSoftened: false,
    };
  }

  return {
    path: dedupeSequentialPathPoints(path),
    radius,
    style,
    isSoftened: true,
  };
}

export function createInnerWallCornerProfile(
  previous: WallCornerProfilePoint,
  current: WallCornerProfilePoint,
  next: WallCornerProfilePoint,
  options: WallCornerProfileOptions,
): WallCornerProfileResult {
  const radius = options.radius;
  const style = options.style ?? "rounded";
  const segments = normalizeWallCornerSegments(
    options.segments ?? DEFAULT_WALL_CORNER_SEGMENTS,
  );
  const winding = options.winding ?? inferCornerWinding(previous, current, next);
  const path = createSoftenedCornerJoin(
    previous,
    current,
    next,
    radius,
    style,
    segments,
    winding,
    "inner",
  );

  if (path == null) {
    return {
      path: [roundPoint(current)],
      radius,
      style,
      isSoftened: false,
    };
  }

  return {
    path: dedupeSequentialPathPoints(path),
    radius,
    style,
    isSoftened: true,
  };
}

function createSoftenedCornerJoin(
  previous: WallCornerProfilePoint,
  current: WallCornerProfilePoint,
  next: WallCornerProfilePoint,
  radius: number,
  style: WallCornerProfileStyle,
  segments: number,
  winding: number,
  cornerType: "outer" | "inner",
): WallCornerProfilePoint[] | null {
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

  const signedTurn = turn * winding;

  if (cornerType === "outer" && signedTurn <= PARALLEL_LINE_EPSILON) {
    return null;
  }

  if (cornerType === "inner" && signedTurn >= -PARALLEL_LINE_EPSILON) {
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

function normalizeWallCornerSegments(value: number): number {
  if (!Number.isFinite(value) || value < MIN_WALL_CORNER_SEGMENTS) {
    throw new Error(
      "Wall corner segments must be a finite integer greater than or equal to 1.",
    );
  }

  return Math.floor(value);
}

function createRoundedCornerJoin(
  start: WallCornerProfilePoint,
  control: WallCornerProfilePoint,
  end: WallCornerProfilePoint,
  segments: number,
): WallCornerProfilePoint[] {
  const points: WallCornerProfilePoint[] = [];

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

function inferCornerWinding(
  previous: WallCornerProfilePoint,
  current: WallCornerProfilePoint,
  next: WallCornerProfilePoint,
): 1 | -1 {
  const incoming = {
    x: current.x - previous.x,
    y: current.y - previous.y,
  };
  const outgoing = {
    x: next.x - current.x,
    y: next.y - current.y,
  };
  const turn = incoming.x * outgoing.y - incoming.y * outgoing.x;

  return turn >= 0 ? 1 : -1;
}

function dedupeSequentialPathPoints(
  points: readonly WallCornerProfilePoint[],
): WallCornerProfilePoint[] {
  return points.filter((point, index) => {
    if (index === 0) {
      return true;
    }

    return !arePointsEquivalent(points[index - 1], point);
  });
}

function arePointsEquivalent(
  left: WallCornerProfilePoint | undefined,
  right: WallCornerProfilePoint | undefined,
): boolean {
  if (left == null || right == null) {
    return false;
  }

  return (
    Math.abs(left.x - right.x) <= PARALLEL_LINE_EPSILON &&
    Math.abs(left.y - right.y) <= PARALLEL_LINE_EPSILON
  );
}

function roundPoint(point: WallCornerProfilePoint): WallCornerProfilePoint {
  return {
    x: roundCoordinate(point.x),
    y: roundCoordinate(point.y),
  };
}

function roundCoordinate(value: number): number {
  return Math.round(value * COORDINATE_PRECISION) / COORDINATE_PRECISION;
}
