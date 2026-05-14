import {
  createValidatedWallSegment,
  type WallSegment,
} from "./wall.ts";

export const ROOM_POLYGON_SOURCE_FIELD = "roomPolygon";

export interface RoomPolygonPoint {
  x: number;
  y: number;
}

export interface RoomPolygonLabelPosition {
  x: number;
  y: number;
}

export interface RoomPolygonSharedBoundary {
  edgeId: string;
  roomId: string;
  adjacentRoomId: string;
  adjacentEdgeId: string;
}

export interface RoomPolygonOpening {
  openingId: string;
  openingType: "door" | "window";
  attachedEdgeId: string;
  edgeRelativePosition: number;
}

export interface RoomPolygonSourceInput {
  roomId: string;
  roomPolygon: readonly RoomPolygonPoint[];
  sharedBoundaries?: readonly RoomPolygonSharedBoundary[];
  openings?: readonly RoomPolygonOpening[];
}

export interface RoomPolygonSource {
  roomId: string;
  roomPolygon: RoomPolygonPoint[];
  sharedBoundaries: RoomPolygonSharedBoundary[];
  openings: RoomPolygonOpening[];
}

export interface RoomPolygonDerivedGeometry {
  area: number;
  labelPosition: RoomPolygonLabelPosition | null;
  walls: WallSegment[];
}

export interface RoomPolygonMapGeometry extends RoomPolygonSource {
  derivedGeometry: RoomPolygonDerivedGeometry;
}

export function createRoomPolygonSource(
  input: RoomPolygonSourceInput,
): RoomPolygonSource {
  return {
    roomId: input.roomId,
    roomPolygon: clonePoints(input.roomPolygon),
    sharedBoundaries: cloneSharedBoundaries(input.sharedBoundaries ?? []),
    openings: cloneOpenings(input.openings ?? []),
  };
}

export function createRoomPolygonMapGeometry(
  input: RoomPolygonSourceInput,
): RoomPolygonMapGeometry {
  const source = createRoomPolygonSource(input);

  return {
    ...source,
    derivedGeometry: deriveRoomPolygonGeometry(source),
  };
}

export function replaceRoomPolygonSource(
  source: RoomPolygonSource,
  roomPolygon: readonly RoomPolygonPoint[],
): RoomPolygonMapGeometry {
  return createRoomPolygonMapGeometry({
    roomId: source.roomId,
    roomPolygon,
    sharedBoundaries: source.sharedBoundaries,
    openings: source.openings,
  });
}

export function deriveRoomPolygonGeometry(
  source: Pick<RoomPolygonSource, "roomId" | "roomPolygon">,
): RoomPolygonDerivedGeometry {
  return {
    area: calculateRoomPolygonArea(source.roomPolygon),
    labelPosition: calculateRoomPolygonLabelPosition(source.roomPolygon),
    walls: deriveRoomPolygonWalls(source.roomId, source.roomPolygon),
  };
}

export function calculateRoomPolygonArea(
  points: readonly RoomPolygonPoint[],
): number {
  if (points.length < 3) {
    return 0;
  }

  let area = 0;

  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    area += current.x * next.y - next.x * current.y;
  }

  return Math.abs(area / 2);
}

export function calculateRoomPolygonLabelPosition(
  points: readonly RoomPolygonPoint[],
): RoomPolygonLabelPosition | null {
  if (points.length === 0) {
    return null;
  }

  let x = 0;
  let y = 0;

  for (const point of points) {
    x += point.x;
    y += point.y;
  }

  return {
    x: x / points.length,
    y: y / points.length,
  };
}

export function deriveRoomPolygonWalls(
  roomId: string,
  roomPolygon: readonly RoomPolygonPoint[],
): WallSegment[] {
  const vertices = normalizeOpenPolygon(roomPolygon);

  if (vertices.length < 2) {
    return [];
  }

  return vertices.map((point, index) =>
    createValidatedWallSegment({
      edgeId: getRoomPolygonEdgeId(roomId, index),
      start: point,
      end: vertices[(index + 1) % vertices.length],
    }),
  );
}

export function getRoomPolygonEdgeId(roomId: string, edgeIndex: number): string {
  return `${roomId}:edge:${edgeIndex}`;
}

function normalizeOpenPolygon(
  roomPolygon: readonly RoomPolygonPoint[],
): readonly RoomPolygonPoint[] {
  if (
    roomPolygon.length > 1 &&
    pointsEqual(roomPolygon[0], roomPolygon[roomPolygon.length - 1])
  ) {
    return roomPolygon.slice(0, -1);
  }

  return roomPolygon;
}

function clonePoints(
  points: readonly RoomPolygonPoint[],
): RoomPolygonPoint[] {
  return points.map((point) => ({
    x: point.x,
    y: point.y,
  }));
}

function cloneSharedBoundaries(
  sharedBoundaries: readonly RoomPolygonSharedBoundary[],
): RoomPolygonSharedBoundary[] {
  return sharedBoundaries.map((boundary) => ({
    edgeId: boundary.edgeId,
    roomId: boundary.roomId,
    adjacentRoomId: boundary.adjacentRoomId,
    adjacentEdgeId: boundary.adjacentEdgeId,
  }));
}

function cloneOpenings(
  openings: readonly RoomPolygonOpening[],
): RoomPolygonOpening[] {
  return openings.map((opening) => ({
    openingId: opening.openingId,
    openingType: opening.openingType,
    attachedEdgeId: opening.attachedEdgeId,
    edgeRelativePosition: opening.edgeRelativePosition,
  }));
}

function pointsEqual(
  left: RoomPolygonPoint,
  right: RoomPolygonPoint,
): boolean {
  return left.x === right.x && left.y === right.y;
}
