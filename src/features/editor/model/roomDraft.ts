import {
  normalizeRoomPolygonInput,
  normalizeRoomPolygonPoints,
} from './roomPolygonNormalization.ts';
import { type RoomPolygonValidationFailure } from './roomPolygonValidation.ts';
import { createRoomObjectFromClosedPolygon } from './roomObjectInstantiation.ts';
import {
  insertRoomPolygonVertexWithInvariantValidation,
} from './roomPolygonVertexInsertion.ts';
import {
  moveRoomPolygonEdgeWithInvariantValidation,
  moveRoomPolygonVertexWithInvariantValidation,
} from './roomPolygonVertexMovement.ts';
import {
  collapseRoomPolygonEdgeWithInvariantValidation,
  removeRoomPolygonVertexWithInvariantValidation,
} from './roomPolygonVertexRemoval.ts';

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
  readonly validation?: RoomPolygonValidationFailure;
}

export interface MoveRoomPolygonEdgeResult {
  readonly ok: boolean;
  readonly polygon?: RoomPolygon;
  readonly error?: 'edge_index_out_of_range' | 'invalid_polygon';
  readonly validation?: RoomPolygonValidationFailure;
}

export interface InsertRoomPolygonVertexResult {
  readonly ok: boolean;
  readonly polygon?: RoomPolygon;
  readonly error?: 'vertex_index_out_of_range' | 'invalid_polygon';
  readonly validation?: RoomPolygonValidationFailure;
}

export interface InsertRoomPolygonEdgeVertexResult {
  readonly ok: boolean;
  readonly polygon?: RoomPolygon;
  readonly error?: 'edge_index_out_of_range' | 'invalid_polygon';
  readonly validation?: RoomPolygonValidationFailure;
}

export interface DeleteRoomPolygonVertexResult {
  readonly ok: boolean;
  readonly polygon?: RoomPolygon;
  readonly error?: 'vertex_index_out_of_range' | 'invalid_polygon';
  readonly validation?: RoomPolygonValidationFailure;
}

export interface DeleteRoomPolygonEdgeResult {
  readonly ok: boolean;
  readonly polygon?: RoomPolygon;
  readonly error?: 'edge_index_out_of_range' | 'invalid_polygon';
  readonly validation?: RoomPolygonValidationFailure;
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

export const createRoomPolygonFromOrderedPoints = (
  roomId: string,
  points: readonly DraftPoint[],
): RoomPolygon =>
  finalizeRoomDraftPolygon(collectRoomDraftPoints(roomId, points));

export const finalizeRoomDraftPolygon = (
  draft: RoomDraftPolygon,
): RoomPolygon => {
  const normalized = normalizeRoomPolygonInput(draft.points);

  if (!normalized.ok) {
    if (normalized.error === 'polygon_requires_three_points') {
      throw new Error('A room polygon requires at least 3 points.');
    }

    if (normalized.error === 'polygon_requires_three_distinct_vertices') {
      throw new Error('A room polygon requires at least 3 distinct vertices.');
    }

    if (normalized.error === 'polygon_points_must_be_finite') {
      throw new Error('A room polygon point must use finite x/y coordinates.');
    }

    if (normalized.error === 'polygon_self_intersects') {
      throw new Error('A room polygon must not self-intersect.');
    }

    throw new Error('A room polygon must define a valid simple closed shape.');
  }

  return {
    roomId: draft.roomId,
    points: normalized.points,
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

export const instantiateEditorRoomFromDraft = (
  draft: RoomDraftPolygon,
  roomName: string,
) => {
  const polygon = finalizeRoomDraftPolygon(draft);

  return createRoomObjectFromClosedPolygon({
    roomId: polygon.roomId,
    roomName,
    closedPolygon: polygon.points,
    sharedBoundaries: [],
  });
};

export const moveRoomPolygonVertex = (
  polygon: RoomPolygon,
  vertexIndex: number,
  nextPoint: DraftPoint,
): MoveRoomPolygonVertexResult => {
  const movement = moveRoomPolygonVertexWithInvariantValidation(
    polygon.points,
    vertexIndex,
    nextPoint,
  );

  if (!movement.ok) {
    return {
      ...movement,
    };
  }

  return {
    ok: true,
    polygon: {
      ...polygon,
      points: normalizeRoomPolygonPoints(movement.points),
    },
  };
};

export const moveRoomPolygonEdge = (
  polygon: RoomPolygon,
  edgeIndex: number,
  delta: DraftPoint,
): MoveRoomPolygonEdgeResult => {
  const movement = moveRoomPolygonEdgeWithInvariantValidation(
    polygon.points,
    edgeIndex,
    delta,
  );

  if (!movement.ok) {
    return {
      ...movement,
    };
  }

  return {
    ok: true,
    polygon: {
      ...polygon,
      points: normalizeRoomPolygonPoints(movement.points),
    },
  };
};

export const insertRoomPolygonVertex = (
  polygon: RoomPolygon,
  vertexIndex: number,
  nextPoint: DraftPoint,
): InsertRoomPolygonVertexResult => {
  const insertion = insertRoomPolygonVertexWithInvariantValidation(
    polygon.points,
    { vertexIndex },
    nextPoint,
  );

  if (!insertion.ok) {
    return {
      ...insertion,
    };
  }

  return {
    ok: true,
    polygon: {
      ...polygon,
      points: normalizeRoomPolygonPoints(insertion.points),
    },
  };
};

export const insertRoomPolygonEdgeVertex = (
  polygon: RoomPolygon,
  edgeIndex: number,
  nextPoint: DraftPoint,
): InsertRoomPolygonEdgeVertexResult => {
  const insertion = insertRoomPolygonVertexWithInvariantValidation(
    polygon.points,
    { edgeIndex },
    nextPoint,
  );

  if (!insertion.ok) {
    return {
      ...insertion,
      error:
        insertion.error === 'vertex_index_out_of_range'
          ? 'edge_index_out_of_range'
          : insertion.error,
    };
  }

  return {
    ok: true,
    polygon: {
      ...polygon,
      points: normalizeRoomPolygonPoints(insertion.points),
    },
  };
};

export const deleteRoomPolygonVertex = (
  polygon: RoomPolygon,
  vertexIndex: number,
): DeleteRoomPolygonVertexResult => {
  const removal = removeRoomPolygonVertexWithInvariantValidation(
    polygon.points,
    vertexIndex,
  );

  if (!removal.ok) {
    return {
      ...removal,
    };
  }

  return {
    ok: true,
    polygon: {
      ...polygon,
      points: normalizeRoomPolygonPoints(removal.points),
    },
  };
};

export const deleteRoomPolygonEdge = (
  polygon: RoomPolygon,
  edgeIndex: number,
): DeleteRoomPolygonEdgeResult => {
  const removal = collapseRoomPolygonEdgeWithInvariantValidation(
    polygon.points,
    edgeIndex,
  );

  if (!removal.ok) {
    return {
      ...removal,
    };
  }

  return {
    ok: true,
    polygon: {
      ...polygon,
      points: normalizeRoomPolygonPoints(removal.points),
    },
  };
};
