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

const closePointsForValidation = (points: readonly Point2D[]): Point2D[] => {
  if (points.length === 0 || isClosedPolygon(points)) {
    return points.map((point) => ({
      x: point.x,
      y: point.y,
    }));
  }

  return [
    ...points.map((point) => ({
      x: point.x,
      y: point.y,
    })),
    {
      x: points[0].x,
      y: points[0].y,
    },
  ];
};

export type RoomPolygonVertexMovementResult =
  | {
      readonly ok: true;
      readonly points: Point2D[];
    }
  | {
      readonly ok: false;
      readonly error: 'vertex_index_out_of_range' | 'invalid_polygon';
      readonly validation?: RoomPolygonValidationFailure;
    };

export const moveRoomPolygonVertexAt = (
  points: readonly Point2D[],
  vertexIndex: number,
  nextPoint: Point2D,
): Point2D[] | null => {
  const closed = isClosedPolygon(points);
  const lastVertexIndex = closed ? points.length - 2 : points.length - 1;

  if (vertexIndex < 0 || vertexIndex > lastVertexIndex) {
    return null;
  }

  return points.map((point, index) => {
    if (index === vertexIndex) {
      return {
        x: nextPoint.x,
        y: nextPoint.y,
      };
    }

    if (closed && vertexIndex === 0 && index === points.length - 1) {
      return {
        x: nextPoint.x,
        y: nextPoint.y,
      };
    }

    return {
      x: point.x,
      y: point.y,
    };
  });
};

export const moveRoomPolygonVertexWithInvariantValidation = (
  points: readonly Point2D[],
  vertexIndex: number,
  nextPoint: Point2D,
): RoomPolygonVertexMovementResult => {
  const nextPoints = moveRoomPolygonVertexAt(points, vertexIndex, nextPoint);

  if (nextPoints === null) {
    return {
      ok: false,
      error: 'vertex_index_out_of_range',
    };
  }

  const validation = validateRoomPolygonVertexEditInvariant(
    closePointsForValidation(nextPoints),
  );

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
