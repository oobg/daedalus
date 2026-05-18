import {
  updateEditorRoom,
  type EditorPoint,
  type EditorProject,
  type EditorRoom,
} from "../../../domain/editor-state.ts";
import {
  deleteActiveRoomPolygonVertex,
  insertActiveRoomPolygonEdgeVertex,
  insertActiveRoomPolygonVertex,
  moveActiveRoomPolygonVertex,
  type EditActiveRoomPolygonResult,
  type RoomPolygonEditorRoom,
} from "./roomPolygonUpdate.ts";

interface PersistedRoomPolygonEditorRoom extends RoomPolygonEditorRoom {
  readonly roomId: string;
  readonly roomName: string;
}

interface RoomPolygonPersistenceContext {
  readonly floorId: string;
  readonly roomId: string;
}

export type PersistRoomPolygonEditResult =
  | {
      readonly ok: true;
      readonly project: EditorProject;
      readonly room: EditorRoom;
    }
  | {
      readonly ok: false;
      readonly error: "invalid_polygon";
    };

export const persistMovedRoomPolygonVertex = (
  project: EditorProject,
  context: RoomPolygonPersistenceContext,
  vertexIndex: number,
  nextPoint: EditorPoint,
): PersistRoomPolygonEditResult =>
  persistRoomPolygonEdit(project, context, (room) =>
    moveActiveRoomPolygonVertex(createPersistenceState(room), vertexIndex, nextPoint),
  );

export const persistInsertedRoomPolygonVertex = (
  project: EditorProject,
  context: RoomPolygonPersistenceContext,
  vertexIndex: number,
  nextPoint: EditorPoint,
): PersistRoomPolygonEditResult =>
  persistRoomPolygonEdit(project, context, (room) =>
    insertActiveRoomPolygonVertex(createPersistenceState(room), vertexIndex, nextPoint),
  );

export const persistInsertedRoomPolygonEdgeVertex = (
  project: EditorProject,
  context: RoomPolygonPersistenceContext,
  edgeIndex: number,
  nextPoint: EditorPoint,
): PersistRoomPolygonEditResult =>
  persistRoomPolygonEdit(project, context, (room) =>
    insertActiveRoomPolygonEdgeVertex(
      createPersistenceState(room),
      edgeIndex,
      nextPoint,
    ),
  );

export const persistDeletedRoomPolygonVertex = (
  project: EditorProject,
  context: RoomPolygonPersistenceContext,
  vertexIndex: number,
): PersistRoomPolygonEditResult =>
  persistRoomPolygonEdit(project, context, (room) =>
    deleteActiveRoomPolygonVertex(createPersistenceState(room), vertexIndex),
  );

function persistRoomPolygonEdit(
  project: EditorProject,
  context: RoomPolygonPersistenceContext,
  edit: (
    room: EditorRoom,
  ) => EditActiveRoomPolygonResult<
    PersistedRoomPolygonEditorRoom,
    { readonly polygon?: { readonly points: readonly EditorPoint[] } }
  >,
): PersistRoomPolygonEditResult {
  const room = getRoom(project, context);
  const result = edit(room);

  if (!result.ok) {
    return result;
  }

  if (result.geometry.polygon == null) {
    throw new Error("Successful room polygon edit must return polygon geometry.");
  }

  const nextProject = updateEditorRoom(project, context.floorId, context.roomId, {
    roomPolygon: openRoomPolygon(result.geometry.polygon.points),
  });

  return {
    ok: true,
    project: nextProject,
    room: getRoom(nextProject, context),
  };
}

function createPersistenceState(room: EditorRoom) {
  const persistedRoom = createPersistedEditorRoom(room);

  return {
    rooms: [persistedRoom],
    activeRoomId: persistedRoom.id,
  };
}

function createPersistedEditorRoom(
  room: EditorRoom,
): PersistedRoomPolygonEditorRoom {
  return {
    id: room.roomId,
    roomId: room.roomId,
    roomName: room.roomName,
    polygon: {
      roomId: room.roomId,
      points: closeRoomPolygon(room.roomPolygon),
    },
    area: room.area,
    labelPosition:
      room.labelPosition == null
        ? room.labelPosition
        : {
            x: room.labelPosition.x,
            y: room.labelPosition.y,
          },
  };
}

function closeRoomPolygon(points: readonly EditorPoint[]): EditorPoint[] {
  if (points.length === 0) {
    return [];
  }

  const clonedPoints = points.map((point) => ({
    x: point.x,
    y: point.y,
  }));
  const firstPoint = clonedPoints[0];
  const lastPoint = clonedPoints[clonedPoints.length - 1];

  if (pointsEqual(firstPoint, lastPoint)) {
    return clonedPoints;
  }

  return [
    ...clonedPoints,
    {
      x: firstPoint.x,
      y: firstPoint.y,
    },
  ];
}

function openRoomPolygon(points: readonly EditorPoint[]): EditorPoint[] {
  if (
    points.length > 1 &&
    pointsEqual(points[0], points[points.length - 1])
  ) {
    return points.slice(0, -1).map((point) => ({
      x: point.x,
      y: point.y,
    }));
  }

  return points.map((point) => ({
    x: point.x,
    y: point.y,
  }));
}

function pointsEqual(left: EditorPoint, right: EditorPoint): boolean {
  return left.x === right.x && left.y === right.y;
}

function getRoom(
  project: EditorProject,
  context: RoomPolygonPersistenceContext,
): EditorRoom {
  const floor = project.floors.find(
    (candidateFloor) => candidateFloor.floorId === context.floorId,
  );

  if (floor == null) {
    throw new Error(`Floor "${context.floorId}" was not found.`);
  }

  const room = floor.rooms.find(
    (candidateRoom) => candidateRoom.roomId === context.roomId,
  );

  if (room == null) {
    throw new Error(
      `Room "${context.roomId}" was not found on floor "${context.floorId}".`,
    );
  }

  return room;
}
