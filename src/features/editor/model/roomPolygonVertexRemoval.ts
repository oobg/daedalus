import type { DraftPoint } from './roomDraft.ts';

const pointsEqual = (left: DraftPoint, right: DraftPoint): boolean =>
  left.x === right.x && left.y === right.y;

const isClosedPolygon = (points: readonly DraftPoint[]): boolean =>
  points.length > 1 && pointsEqual(points[0], points[points.length - 1]);

export const removeRoomPolygonVertexAt = (
  points: readonly DraftPoint[],
  vertexIndex: number,
): DraftPoint[] | null => {
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
