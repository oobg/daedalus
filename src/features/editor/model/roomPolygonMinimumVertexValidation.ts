export interface RoomPolygonVertexPoint {
  readonly x: number;
  readonly y: number;
}

export const MINIMUM_ROOM_POLYGON_DISTINCT_VERTICES = 3;

export interface MinimumRoomPolygonVertexValidationOptions {
  readonly minimumDistinctVertices?: number;
}

export type MinimumRoomPolygonVertexValidationResult =
  | {
      readonly ok: true;
      readonly distinctVertexCount: number;
    }
  | {
      readonly ok: false;
      readonly distinctVertexCount: number;
      readonly requiredDistinctVertices: number;
      readonly error: 'polygon_requires_three_distinct_vertices';
    };

const pointsMatch = (
  left: RoomPolygonVertexPoint,
  right: RoomPolygonVertexPoint,
): boolean => left.x === right.x && left.y === right.y;

const collectOpenPolygonVertices = <Point extends RoomPolygonVertexPoint>(
  points: readonly Point[],
): readonly Point[] => {
  if (points.length > 1 && pointsMatch(points[0], points[points.length - 1])) {
    return points.slice(0, -1);
  }

  return points;
};

export const countDistinctRoomPolygonVertices = (
  points: readonly RoomPolygonVertexPoint[],
): number =>
  new Set(
    collectOpenPolygonVertices(points).map((point) => `${point.x},${point.y}`),
  ).size;

export const validateMinimumRoomPolygonVertices = (
  points: readonly RoomPolygonVertexPoint[],
  options: MinimumRoomPolygonVertexValidationOptions = {},
): MinimumRoomPolygonVertexValidationResult => {
  const requiredDistinctVertices =
    options.minimumDistinctVertices ?? MINIMUM_ROOM_POLYGON_DISTINCT_VERTICES;
  const distinctVertexCount = countDistinctRoomPolygonVertices(points);

  if (distinctVertexCount < requiredDistinctVertices) {
    return {
      ok: false,
      distinctVertexCount,
      requiredDistinctVertices,
      error: 'polygon_requires_three_distinct_vertices',
    };
  }

  return {
    ok: true,
    distinctVertexCount,
  };
};
