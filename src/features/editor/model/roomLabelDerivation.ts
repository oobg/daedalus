import {
  calculatePolygonLabelPosition,
  type RoomLabelPosition,
} from '../../../domain/editor-state.ts';
import type { RoomPolygon } from './roomDraft.ts';

export interface DerivedRoomLabel {
  readonly position: RoomLabelPosition | null;
}

export const deriveRoomLabel = (
  polygon: RoomPolygon,
): DerivedRoomLabel => ({
  position: calculatePolygonLabelPosition(getLabelPoints(polygon)),
});

const getLabelPoints = (polygon: RoomPolygon) => {
  const { points } = polygon;

  if (points.length < 2) {
    return points;
  }

  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];

  if (firstPoint.x === lastPoint.x && firstPoint.y === lastPoint.y) {
    return points.slice(0, -1);
  }

  return points;
};
