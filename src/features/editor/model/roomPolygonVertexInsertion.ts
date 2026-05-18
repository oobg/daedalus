import {
  validateRoomPolygonVertexEditInvariant,
} from './roomPolygonInvariantValidation.ts';
import type {
  Point2D,
  RoomPolygonValidationFailure,
} from './roomPolygonValidation.ts';

export interface InsertRoomPolygonVertexAtEdge {
  readonly edgeIndex: number;
}

export interface InsertRoomPolygonVertexAtVertex {
  readonly vertexIndex: number;
}

export type InsertRoomPolygonVertexTarget =
  | InsertRoomPolygonVertexAtEdge
  | InsertRoomPolygonVertexAtVertex;

const pointsEqual = (left: Point2D, right: Point2D): boolean =>
  left.x === right.x && left.y === right.y;

const isClosedPolygon = (points: readonly Point2D[]): boolean =>
  points.length > 1 && pointsEqual(points[0], points[points.length - 1]);

export type RoomPolygonVertexInsertionResult =
  | {
      readonly ok: true;
      readonly points: Point2D[];
    }
  | {
      readonly ok: false;
      readonly error: 'vertex_index_out_of_range' | 'invalid_polygon';
      readonly validation?: RoomPolygonValidationFailure;
    };

export const insertRoomPolygonVertexAt = (
  points: readonly Point2D[],
  target: InsertRoomPolygonVertexTarget,
  nextPoint: Point2D,
): Point2D[] | null => {
  const closed = isClosedPolygon(points);
  const openPoints = closed ? points.slice(0, -1) : points.slice();
  const insertionAfterIndex =
    'edgeIndex' in target ? target.edgeIndex : target.vertexIndex;

  if (
    insertionAfterIndex < 0 ||
    insertionAfterIndex >= openPoints.length
  ) {
    return null;
  }

  const insertionIndex = insertionAfterIndex + 1;
  const nextOpenPoints = [
    ...openPoints.slice(0, insertionIndex),
    {
      x: nextPoint.x,
      y: nextPoint.y,
    },
    ...openPoints.slice(insertionIndex),
  ];

  if (!closed) {
    return nextOpenPoints;
  }

  return [...nextOpenPoints, nextOpenPoints[0]];
};

export const insertRoomPolygonVertexWithInvariantValidation = (
  points: readonly Point2D[],
  target: InsertRoomPolygonVertexTarget,
  nextPoint: Point2D,
): RoomPolygonVertexInsertionResult => {
  const nextPoints = insertRoomPolygonVertexAt(points, target, nextPoint);

  if (nextPoints === null) {
    return {
      ok: false,
      error: 'vertex_index_out_of_range',
    };
  }

  const validation = validateRoomPolygonVertexEditInvariant(nextPoints);

  if (!validation.ok) {
    return {
      ok: false,
      error: 'invalid_polygon',
      validation: validation.validation,
    };
  }

  return {
    ok: true,
    points: nextPoints,
  };
};
