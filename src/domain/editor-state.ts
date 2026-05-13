import {
  calculatePolygonArea,
  calculatePolygonLabelPosition,
  createValidatedEditorRoom,
} from "./editor-room.ts";

export const EDITOR_OBJECT_VERSION = 1;
export const DEFAULT_PROJECT_NAME = "Untitled Building Guide";
export const DEFAULT_FLOOR_NAME = "Floor 1";
export const DEFAULT_ROOM_NAME = "Room 1";
export const DEFAULT_FLOOR_HEIGHT = 3;

export interface EditorPoint {
  x: number;
  y: number;
}

export interface RoomLabelPosition {
  x: number;
  y: number;
}

export interface SharedBoundaryRef {
  edgeId: string;
  roomId: string;
  adjacentRoomId: string;
  adjacentEdgeId: string;
}

export type RoomOpeningType = "door" | "window" | "stair" | "elevator";

export interface RoomOpening {
  id: string;
  type: RoomOpeningType;
  x: number;
  y: number;
  angle: number;
}

export interface EditorRoom {
  roomId: string;
  roomName: string;
  roomPolygon: EditorPoint[];
  sharedBoundaries: SharedBoundaryRef[];
  area: number;
  labelPosition: RoomLabelPosition | null;
  openings: RoomOpening[];
}

export interface EditorFloor {
  floorId: string;
  floorName: string;
  floorHeight: number;
  referenceImage: string | null;
  rooms: EditorRoom[];
}

export interface EditorViewState {
  activeFloorId: string | null;
  selectedRoomId: string | null;
}

export interface EditorProject {
  projectId: string;
  projectName: string;
  objectVersion: number;
  floors: EditorFloor[];
  viewState: EditorViewState;
  exteriorPolygon: EditorPoint[] | null;
}

export interface BuildingGuideEditorState {
  project: EditorProject;
}

export interface EditorRoomInput {
  roomId: string;
  roomName?: string;
  roomPolygon?: readonly EditorPoint[];
  sharedBoundaries?: readonly SharedBoundaryRef[];
}

export interface EditorFloorInput {
  floorId: string;
  floorName?: string;
  floorHeight?: number;
  referenceImage?: string | null;
  rooms?: readonly EditorRoomInput[];
}

export interface EditorProjectInput {
  projectId: string;
  projectName?: string;
  objectVersion?: number;
  floors?: readonly EditorFloorInput[];
  viewState?: Partial<EditorViewState>;
  exteriorPolygon?: EditorPoint[] | null;
}

export interface UpdateEditorProjectInput {
  projectName?: string;
  objectVersion?: number;
  viewState?: Partial<EditorViewState>;
}

export interface UpdateEditorFloorInput {
  floorName?: string;
  floorHeight?: number;
  referenceImage?: string | null;
}

export interface UpdateEditorRoomInput {
  roomName?: string;
  roomPolygon?: readonly EditorPoint[];
  sharedBoundaries?: readonly SharedBoundaryRef[];
}

export function createEditorRoom(input: EditorRoomInput): EditorRoom {
  return createValidatedEditorRoom(input);
}

export { calculatePolygonArea, calculatePolygonLabelPosition };

export function createEditorFloor(input: EditorFloorInput): EditorFloor {
  return {
    floorId: input.floorId,
    floorName: input.floorName ?? DEFAULT_FLOOR_NAME,
    floorHeight: input.floorHeight ?? DEFAULT_FLOOR_HEIGHT,
    referenceImage: input.referenceImage ?? null,
    rooms: (input.rooms ?? []).map(createEditorRoom),
  };
}

export function createEditorProject(input: EditorProjectInput): EditorProject {
  const floors = (input.floors ?? []).map(createEditorFloor);
  const requestedActiveFloorId = input.viewState?.activeFloorId ?? null;

  return {
    projectId: input.projectId,
    projectName: input.projectName ?? DEFAULT_PROJECT_NAME,
    objectVersion: input.objectVersion ?? EDITOR_OBJECT_VERSION,
    floors,
    viewState: {
      activeFloorId: resolveActiveFloorId(floors, requestedActiveFloorId),
      selectedRoomId: input.viewState?.selectedRoomId ?? null,
    },
    exteriorPolygon: input.exteriorPolygon ?? null,
  };
}

export function createEditorState(
  input: EditorProjectInput,
): BuildingGuideEditorState {
  return {
    project: createEditorProject(input),
  };
}

export function updateEditorProject(
  project: EditorProject,
  input: UpdateEditorProjectInput,
): EditorProject {
  const nextFloors = project.floors.slice();
  const requestedActiveFloorId =
    input.viewState?.activeFloorId ?? project.viewState.activeFloorId;
  const activeFloorId = resolveActiveFloorId(nextFloors, requestedActiveFloorId);
  const selectedRoomId =
    activeFloorId === project.viewState.activeFloorId
      ? input.viewState?.selectedRoomId ?? project.viewState.selectedRoomId
      : null;

  return {
    ...project,
    projectName: input.projectName ?? project.projectName,
    objectVersion: input.objectVersion ?? project.objectVersion,
    viewState: {
      activeFloorId,
      selectedRoomId,
    },
  };
}

export function addEditorFloor(
  project: EditorProject,
  input: EditorFloorInput,
): EditorProject {
  assertFloorDoesNotExist(project.floors, input.floorId);

  const floor = createEditorFloor(input);
  const floors = [...project.floors, floor];

  return {
    ...project,
    floors,
    viewState: {
      activeFloorId: project.viewState.activeFloorId ?? floor.floorId,
      selectedRoomId: project.viewState.selectedRoomId,
    },
  };
}

export function updateEditorFloor(
  project: EditorProject,
  floorId: string,
  input: UpdateEditorFloorInput,
): EditorProject {
  assertFloorExists(project.floors, floorId);

  return {
    ...project,
    floors: project.floors.map((floor) => {
      if (floor.floorId !== floorId) {
        return floor;
      }

      return {
        ...floor,
        floorName: input.floorName ?? floor.floorName,
        floorHeight: input.floorHeight ?? floor.floorHeight,
        referenceImage:
          input.referenceImage === undefined
            ? floor.referenceImage
            : input.referenceImage,
      };
    }),
  };
}

export function removeEditorFloor(
  project: EditorProject,
  floorId: string,
): EditorProject {
  assertFloorExists(project.floors, floorId);

  const floors = project.floors.filter((floor) => floor.floorId !== floorId);
  const activeFloorId = resolveActiveFloorId(
    floors,
    project.viewState.activeFloorId === floorId
      ? floors[0]?.floorId ?? null
      : project.viewState.activeFloorId,
  );

  return {
    ...project,
    floors,
    viewState: {
      activeFloorId,
      selectedRoomId:
        activeFloorId === project.viewState.activeFloorId
          ? project.viewState.selectedRoomId
          : null,
    },
  };
}

export function addEditorRoom(
  project: EditorProject,
  floorId: string,
  input: EditorRoomInput,
): EditorProject {
  const floor = getEditorFloor(project.floors, floorId);
  assertRoomDoesNotExist(project.floors, input.roomId);

  const room = createEditorRoom(input);
  const floors = project.floors.map((candidateFloor) => {
    if (candidateFloor.floorId !== floor.floorId) {
      return candidateFloor;
    }

    return {
      ...candidateFloor,
      rooms: [...candidateFloor.rooms, room],
    };
  });

  return {
    ...project,
    floors,
  };
}

export function updateEditorRoom(
  project: EditorProject,
  floorId: string,
  roomId: string,
  input: UpdateEditorRoomInput,
): EditorProject {
  const floor = getEditorFloor(project.floors, floorId);
  const room = getEditorRoom(floor, roomId);

  const nextRoomPolygon = input.roomPolygon ?? room.roomPolygon;
  const synchronizedAdjacentPolygons = synchronizeSharedBoundaryVertices(
    floor,
    room,
    nextRoomPolygon,
  );

  const floors = project.floors.map((candidateFloor) => {
    if (candidateFloor.floorId !== floor.floorId) {
      return candidateFloor;
    }

    return {
      ...candidateFloor,
      rooms: candidateFloor.rooms.map((candidateRoom) => {
        if (candidateRoom.roomId === room.roomId) {
          return createEditorRoom({
            roomId: candidateRoom.roomId,
            roomName: input.roomName ?? candidateRoom.roomName,
            roomPolygon: nextRoomPolygon,
            sharedBoundaries:
              input.sharedBoundaries ?? candidateRoom.sharedBoundaries,
          });
        }

        const synchronizedPolygon = synchronizedAdjacentPolygons.get(
          candidateRoom.roomId,
        );

        if (synchronizedPolygon == null) {
          return candidateRoom;
        }

        return createEditorRoom({
          roomId: candidateRoom.roomId,
          roomName: candidateRoom.roomName,
          roomPolygon: synchronizedPolygon,
          sharedBoundaries: candidateRoom.sharedBoundaries,
        });
      }),
    };
  });

  return {
    ...project,
    floors,
  };
}

export function removeEditorRoom(
  project: EditorProject,
  floorId: string,
  roomId: string,
): EditorProject {
  const floor = getEditorFloor(project.floors, floorId);
  getEditorRoom(floor, roomId);

  const floors = project.floors.map((candidateFloor) => {
    if (candidateFloor.floorId !== floor.floorId) {
      return candidateFloor;
    }

    return {
      ...candidateFloor,
      rooms: candidateFloor.rooms.filter((room) => room.roomId !== roomId),
    };
  });

  return {
    ...project,
    floors,
    viewState: {
      ...project.viewState,
      selectedRoomId:
        project.viewState.selectedRoomId === roomId
          ? null
          : project.viewState.selectedRoomId,
    },
  };
}

function clonePoints(points: readonly EditorPoint[]): EditorPoint[] {
  return points.map((point) => ({
    x: point.x,
    y: point.y,
  }));
}

function synchronizeSharedBoundaryVertices(
  floor: EditorFloor,
  room: EditorRoom,
  nextPolygon: readonly EditorPoint[],
): Map<string, EditorPoint[]> {
  if (room.roomPolygon.length !== nextPolygon.length) {
    return new Map();
  }

  const movedVertexIndices = room.roomPolygon.reduce<number[]>(
    (indices, point, index) => {
      if (!pointsEqual(point, nextPolygon[index])) {
        indices.push(index);
      }

      return indices;
    },
    [],
  );

  if (movedVertexIndices.length === 0) {
    return new Map();
  }

  const synchronizedPolygons = new Map<string, EditorPoint[]>();
  const sourceVertexCount = room.roomPolygon.length;
  const sharedEdgeMatches = collectExactlySharedBoundaryMatches(floor, room);

  for (const vertexIndex of movedVertexIndices) {
    const incidentEdgeIndices = [
      getWrappedVertexIndex(vertexIndex - 1, sourceVertexCount),
      vertexIndex,
    ];

    for (const edgeIndex of incidentEdgeIndices) {
      const sharedEdgeMatch = sharedEdgeMatches.get(edgeIndex);

      if (sharedEdgeMatch == null) {
        continue;
      }

      const adjacentPolygon =
        synchronizedPolygons.get(sharedEdgeMatch.room.roomId) ??
        clonePoints(sharedEdgeMatch.room.roomPolygon);
      const adjacentVertexCount = adjacentPolygon.length;
      const sourceEdgeStartIndex = edgeIndex;
      const sourceEdgeEndIndex = getWrappedVertexIndex(
        edgeIndex + 1,
        sourceVertexCount,
      );
      const adjacentVertexIndex =
        vertexIndex === sourceEdgeStartIndex
          ? getWrappedVertexIndex(
              sharedEdgeMatch.edgeIndex + 1,
              adjacentVertexCount,
            )
          : sourceEdgeEndIndex === vertexIndex
            ? sharedEdgeMatch.edgeIndex
            : null;

      if (adjacentVertexIndex == null) {
        continue;
      }

      adjacentPolygon[adjacentVertexIndex] = {
        x: nextPolygon[vertexIndex].x,
        y: nextPolygon[vertexIndex].y,
      };
      synchronizedPolygons.set(sharedEdgeMatch.room.roomId, adjacentPolygon);
    }
  }

  return synchronizedPolygons;
}

function collectExactlySharedBoundaryMatches(
  floor: EditorFloor,
  room: EditorRoom,
): Map<number, { room: EditorRoom; edgeIndex: number }> {
  const matchesBySourceEdge = new Map<
    number,
    { room: EditorRoom; edgeIndex: number }[]
  >();

  for (const adjacentRoom of floor.rooms) {
    if (adjacentRoom.roomId === room.roomId) {
      continue;
    }

    if (!roomsDeclareSharedBoundary(room, adjacentRoom)) {
      continue;
    }

    for (
      let sourceEdgeIndex = 0;
      sourceEdgeIndex < room.roomPolygon.length;
      sourceEdgeIndex += 1
    ) {
      const matchingAdjacentEdgeIndex = findUniqueReversedMatchingEdgeIndex(
        room.roomPolygon,
        adjacentRoom.roomPolygon,
        sourceEdgeIndex,
      );

      if (matchingAdjacentEdgeIndex == null) {
        continue;
      }

      const matches = matchesBySourceEdge.get(sourceEdgeIndex) ?? [];
      matches.push({
        room: adjacentRoom,
        edgeIndex: matchingAdjacentEdgeIndex,
      });
      matchesBySourceEdge.set(sourceEdgeIndex, matches);
    }
  }

  const exactlySharedBoundaryMatches = new Map<
    number,
    { room: EditorRoom; edgeIndex: number }
  >();

  for (const [sourceEdgeIndex, matches] of matchesBySourceEdge) {
    if (matches.length === 1) {
      exactlySharedBoundaryMatches.set(sourceEdgeIndex, matches[0]);
    }
  }

  return exactlySharedBoundaryMatches;
}

function roomsDeclareSharedBoundary(
  room: EditorRoom,
  adjacentRoom: EditorRoom,
): boolean {
  return (
    room.sharedBoundaries.some(
      (boundary) => boundary.adjacentRoomId === adjacentRoom.roomId,
    ) &&
    adjacentRoom.sharedBoundaries.some(
      (boundary) => boundary.adjacentRoomId === room.roomId,
    )
  );
}

function findUniqueReversedMatchingEdgeIndex(
  sourcePolygon: readonly EditorPoint[],
  adjacentPolygon: readonly EditorPoint[],
  sourceEdgeIndex: number,
): number | null {
  const sourceEdgeStart = sourcePolygon[sourceEdgeIndex];
  const sourceEdgeEnd =
    sourcePolygon[getWrappedVertexIndex(sourceEdgeIndex + 1, sourcePolygon.length)];
  const matchingAdjacentEdgeIndices: number[] = [];

  for (let adjacentEdgeIndex = 0; adjacentEdgeIndex < adjacentPolygon.length; adjacentEdgeIndex += 1) {
    const adjacentEdgeStart = adjacentPolygon[adjacentEdgeIndex];
    const adjacentEdgeEnd =
      adjacentPolygon[
        getWrappedVertexIndex(adjacentEdgeIndex + 1, adjacentPolygon.length)
      ];

    if (
      pointsEqual(sourceEdgeStart, adjacentEdgeEnd) &&
      pointsEqual(sourceEdgeEnd, adjacentEdgeStart)
    ) {
      matchingAdjacentEdgeIndices.push(adjacentEdgeIndex);
    }
  }

  return matchingAdjacentEdgeIndices.length === 1
    ? matchingAdjacentEdgeIndices[0]
    : null;
}

function getWrappedVertexIndex(index: number, vertexCount: number): number {
  return ((index % vertexCount) + vertexCount) % vertexCount;
}

function pointsEqual(left: EditorPoint, right: EditorPoint): boolean {
  return left.x === right.x && left.y === right.y;
}

function resolveActiveFloorId(
  floors: readonly EditorFloor[],
  activeFloorId: string | null,
): string | null {
  if (activeFloorId == null) {
    return floors[0]?.floorId ?? null;
  }

  return floors.some((floor) => floor.floorId === activeFloorId)
    ? activeFloorId
    : floors[0]?.floorId ?? null;
}

function assertFloorExists(
  floors: readonly EditorFloor[],
  floorId: string,
): void {
  if (!floors.some((floor) => floor.floorId === floorId)) {
    throw new Error(`Floor "${floorId}" was not found.`);
  }
}

function assertFloorDoesNotExist(
  floors: readonly EditorFloor[],
  floorId: string,
): void {
  if (floors.some((floor) => floor.floorId === floorId)) {
    throw new Error(`Floor "${floorId}" already exists.`);
  }
}

function getEditorFloor(
  floors: readonly EditorFloor[],
  floorId: string,
): EditorFloor {
  const floor = floors.find((candidateFloor) => candidateFloor.floorId === floorId);

  if (floor == null) {
    throw new Error(`Floor "${floorId}" was not found.`);
  }

  return floor;
}

function getEditorRoom(floor: EditorFloor, roomId: string): EditorRoom {
  const room = floor.rooms.find((candidateRoom) => candidateRoom.roomId === roomId);

  if (room == null) {
    throw new Error(`Room "${roomId}" was not found on floor "${floor.floorId}".`);
  }

  return room;
}

function assertRoomDoesNotExist(
  floors: readonly EditorFloor[],
  roomId: string,
): void {
  if (floors.some((floor) => floor.rooms.some((room) => room.roomId === roomId))) {
    throw new Error(`Room "${roomId}" already exists.`);
  }
}
