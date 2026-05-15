export interface RoomPolygonAreaPoint {
  readonly x: number;
  readonly y: number;
}

export const calculateRoomPolygonSignedArea = (
  points: readonly RoomPolygonAreaPoint[],
): number => {
  let area = 0;

  for (let index = 0; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    area += current.x * next.y - next.x * current.y;
  }

  return area / 2;
};

export const roomPolygonHasZeroArea = (
  points: readonly RoomPolygonAreaPoint[],
): boolean => calculateRoomPolygonSignedArea(points) === 0;

export type RoomPolygonZeroAreaValidationResult =
  | {
      readonly ok: true;
      readonly area: number;
    }
  | {
      readonly ok: false;
      readonly area: 0;
      readonly error: 'polygon_area_must_be_non_zero';
    };

export const validateRoomPolygonZeroArea = (
  points: readonly RoomPolygonAreaPoint[],
): RoomPolygonZeroAreaValidationResult => {
  const area = calculateRoomPolygonSignedArea(points);

  if (area === 0) {
    return {
      ok: false,
      area: 0,
      error: 'polygon_area_must_be_non_zero',
    };
  }

  return {
    ok: true,
    area,
  };
};
