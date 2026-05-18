import {
  validateRoomPolygonVertexEditInvariant,
} from './roomPolygonInvariantValidation.ts';
import type {
  Point2D,
  RoomPolygonValidationFailure,
} from './roomPolygonValidation.ts';

const pointsEqual = (left: Point2D, right: Point2D): boolean =>
  left.x === right.x && left.y === right.y;

const isClosedPolygon = (points: readonly Point2D[]): boolean =>
  points.length > 1 && pointsEqual(points[0], points[points.length - 1]);

export type RoomPolygonVertexRemovalResult =
  | {
      readonly ok: true;
      readonly points: Point2D[];
    }
  | {
      readonly ok: false;
      readonly error: 'vertex_index_out_of_range' | 'invalid_polygon';
      readonly validation?: RoomPolygonValidationFailure;
    };

export const removeRoomPolygonVertexAt = (
  points: readonly Point2D[],
  vertexIndex: number,
): Point2D[] | null => {
  const closed = isClosedPolygon(points);
  const openPoints = closed ? points.slice(0, -1) : points.slice();

  if (vertexIndex < 0 || vertexIndex >= openPoints.length) {
    return null;
  }

  const nextOpenPoints = openPoints.filter((_, index) => index !== vertexIndex);

  if (!closed) {
    return nextOpenPoints.map((point) => ({
      x: point.x,
      y: point.y,
    }));
  }

  if (nextOpenPoints.length === 0) {
    return [];
  }

  return [
    ...nextOpenPoints.map((point) => ({
      x: point.x,
      y: point.y,
    })),
    {
      x: nextOpenPoints[0].x,
      y: nextOpenPoints[0].y,
    },
  ];
};

export const removeRoomPolygonVertexWithInvariantValidation = (
  points: readonly Point2D[],
  vertexIndex: number,
): RoomPolygonVertexRemovalResult => {
  const nextPoints = removeRoomPolygonVertexAt(points, vertexIndex);

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
