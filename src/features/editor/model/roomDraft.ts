import { normalizeRoomPolygonPoints } from './roomPolygonNormalization.ts';
import { validateRoomPolygon } from './roomPolygonValidation.ts';

export interface DraftPoint {
  readonly x: number;
  readonly y: number;
}

export interface RoomDraftPolygon {
  readonly roomId: string;
  readonly points: readonly DraftPoint[];
}

export interface RoomPolygon {
  readonly roomId: string;
  readonly points: readonly DraftPoint[];
}

export interface FinalizedEditorRoomDraft {
  readonly roomId: string;
  readonly roomName: string;
  readonly roomPolygon: readonly DraftPoint[];
  readonly sharedBoundaries: readonly [];
}

export interface MoveRoomPolygonVertexResult {
  readonly ok: boolean;
  readonly polygon?: RoomPolygon;
  readonly error?: 'vertex_index_out_of_range' | 'invalid_polygon';
}

export interface InsertRoomPolygonVertexResult {
  readonly ok: boolean;
  readonly polygon?: RoomPolygon;
  readonly error?: 'vertex_index_out_of_range' | 'invalid_polygon';
}

export interface DeleteRoomPolygonVertexResult {
  readonly ok: boolean;
  readonly polygon?: RoomPolygon;
  readonly error?: 'vertex_index_out_of_range' | 'invalid_polygon';
}

export const createRoomDraftPolygon = (roomId: string): RoomDraftPolygon => ({
  roomId,
  points: [],
});

export const appendRoomDraftPoint = (
  draft: RoomDraftPolygon,
  point: DraftPoint,
): RoomDraftPolygon => ({
  ...draft,
  points: [...draft.points, point],
});

export const collectRoomDraftPoints = (
  roomId: string,
  points: readonly DraftPoint[],
): RoomDraftPolygon =>
  points.reduce(
    (draft, point) => appendRoomDraftPoint(draft, point),
    createRoomDraftPolygon(roomId),
  );

const pointsMatch = (left: DraftPoint, right: DraftPoint): boolean =>
  left.x === right.x && left.y === right.y;

const countDistinctPoints = (points: readonly DraftPoint[]): number =>
  new Set(points.map((point) => `${point.x},${point.y}`)).size;

const isValidRoomPolygon = (points: readonly DraftPoint[]): boolean => {
  return validateRoomPolygon(points).ok;
};

export const finalizeRoomDraftPolygon = (
  draft: RoomDraftPolygon,
): RoomPolygon => {
  if (draft.points.length < 3) {
    throw new Error('A room polygon requires at least 3 points.');
  }

  const firstPoint = draft.points[0];
  const lastPoint = draft.points[draft.points.length - 1];
  const normalizedPoints = pointsMatch(firstPoint, lastPoint)
    ? [...draft.points.slice(0, -1), firstPoint]
    : [...draft.points, firstPoint];

  if (countDistinctPoints(normalizedPoints.slice(0, -1)) < 3) {
    throw new Error('A room polygon requires at least 3 distinct vertices.');
  }

  const validation = validateRoomPolygon(normalizedPoints);

  if (!validation.ok) {
    if (validation.error === 'polygon_points_must_be_finite') {
      throw new Error('A room polygon point must use finite x/y coordinates.');
    }

    if (validation.error === 'polygon_self_intersects') {
      throw new Error('A room polygon must not self-intersect.');
    }

    throw new Error('A room polygon must define a valid simple closed shape.');
  }

  return {
    roomId: draft.roomId,
    points: normalizeRoomPolygonPoints(normalizedPoints),
  };
};

export const finalizeEditorRoomDraft = (
  draft: RoomDraftPolygon,
  roomName: string,
): FinalizedEditorRoomDraft => {
  const polygon = finalizeRoomDraftPolygon(draft);
  const roomPolygon = polygon.points.slice(0, -1);

  return {
    roomId: polygon.roomId,
    roomName,
    roomPolygon,
    sharedBoundaries: [],
  };
};

export const moveRoomPolygonVertex = (
  polygon: RoomPolygon,
  vertexIndex: number,
  nextPoint: DraftPoint,
): MoveRoomPolygonVertexResult => {
  const lastVertexIndex = polygon.points.length - 2;

  if (vertexIndex < 0 || vertexIndex > lastVertexIndex) {
    return {
      ok: false,
      error: 'vertex_index_out_of_range',
    };
  }

  const nextPoints = polygon.points.map((point, index) => {
    if (index === vertexIndex) {
      return nextPoint;
    }

    if (vertexIndex === 0 && index === polygon.points.length - 1) {
      return nextPoint;
    }

    return point;
  });

  if (!isValidRoomPolygon(nextPoints)) {
    return {
      ok: false,
      error: 'invalid_polygon',
    };
  }

  return {
    ok: true,
    polygon: {
      ...polygon,
      points: normalizeRoomPolygonPoints(nextPoints),
    },
  };
};

export const insertRoomPolygonVertex = (
  polygon: RoomPolygon,
  vertexIndex: number,
  nextPoint: DraftPoint,
): InsertRoomPolygonVertexResult => {
  const lastVertexIndex = polygon.points.length - 2;

  if (vertexIndex < 0 || vertexIndex > lastVertexIndex) {
    return {
      ok: false,
      error: 'vertex_index_out_of_range',
    };
  }

  const insertionIndex = vertexIndex + 1;
  const nextPoints = [
    ...polygon.points.slice(0, insertionIndex),
    nextPoint,
    ...polygon.points.slice(insertionIndex),
  ];

  if (!isValidRoomPolygon(nextPoints)) {
    return {
      ok: false,
      error: 'invalid_polygon',
    };
  }

  return {
    ok: true,
    polygon: {
      ...polygon,
      points: normalizeRoomPolygonPoints(nextPoints),
    },
  };
};

export const deleteRoomPolygonVertex = (
  polygon: RoomPolygon,
  vertexIndex: number,
): DeleteRoomPolygonVertexResult => {
  const lastVertexIndex = polygon.points.length - 2;

  if (vertexIndex < 0 || vertexIndex > lastVertexIndex) {
    return {
      ok: false,
      error: 'vertex_index_out_of_range',
    };
  }

  const nextOpenPoints =
    vertexIndex === 0
      ? polygon.points.slice(1, -1)
      : [
          ...polygon.points.slice(0, vertexIndex),
          ...polygon.points.slice(vertexIndex + 1, -1),
        ];
  const nextPoints =
    nextOpenPoints.length === 0
      ? []
      : [...nextOpenPoints, nextOpenPoints[0]];

  if (!isValidRoomPolygon(nextPoints)) {
    return {
      ok: false,
      error: 'invalid_polygon',
    };
  }

  return {
    ok: true,
    polygon: {
      ...polygon,
      points: normalizeRoomPolygonPoints(nextPoints),
    },
  };
};
