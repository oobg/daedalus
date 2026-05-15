import type { DraftPoint } from './roomDraft.ts';

export interface InsertRoomPolygonVertexAtEdge {
  readonly edgeIndex: number;
}

export interface InsertRoomPolygonVertexAtVertex {
  readonly vertexIndex: number;
}

export type InsertRoomPolygonVertexTarget =
  | InsertRoomPolygonVertexAtEdge
  | InsertRoomPolygonVertexAtVertex;

const pointsEqual = (left: DraftPoint, right: DraftPoint): boolean =>
  left.x === right.x && left.y === right.y;

const isClosedPolygon = (points: readonly DraftPoint[]): boolean =>
  points.length > 1 && pointsEqual(points[0], points[points.length - 1]);

export const insertRoomPolygonVertexAt = (
  points: readonly DraftPoint[],
  target: InsertRoomPolygonVertexTarget,
  nextPoint: DraftPoint,
): DraftPoint[] | null => {
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
