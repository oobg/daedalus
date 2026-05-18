import {
  createRoomPolygonSource,
  deriveRoomPolygonGeometry,
  type RoomPolygonMapGeometry,
  type RoomPolygonSource,
} from "../../../domain/room-polygon-source.ts";
import type {
  BuildingGuideEditorState,
  EditorFloor,
  EditorRoom,
} from "../../../domain/editor-state.ts";

type DeepReadonly<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends readonly (infer Item)[]
    ? readonly DeepReadonly<Item>[]
    : T extends object
      ? { readonly [Key in keyof T]: DeepReadonly<T[Key]> }
      : T;

export interface EditorRoomPolygonQueryInput {
  readonly state: BuildingGuideEditorState;
  readonly floorId: string;
  readonly roomId: string;
}

export interface EditorDerivedRoomState extends RoomPolygonSource {
  readonly roomName: string;
  readonly area: number;
  readonly labelPosition: RoomPolygonMapGeometry["derivedGeometry"]["labelPosition"];
  readonly walls: RoomPolygonMapGeometry["derivedGeometry"]["walls"];
}

export function readRoomPolygonSource(
  input: EditorRoomPolygonQueryInput,
): DeepReadonly<RoomPolygonSource> {
  const room = findRoom(input.state, input.floorId, input.roomId);

  return freezeClone(
    createRoomPolygonSource({
      roomId: room.roomId,
      roomPolygon: room.roomPolygon,
      sharedBoundaries: room.sharedBoundaries,
      openings: room.edgeOpenings ?? [],
    }),
  );
}

export function readDerivedRoomState(
  input: EditorRoomPolygonQueryInput,
): DeepReadonly<EditorDerivedRoomState> {
  const room = findRoom(input.state, input.floorId, input.roomId);
  const source = createRoomPolygonSource({
    roomId: room.roomId,
    roomPolygon: room.roomPolygon,
    sharedBoundaries: room.sharedBoundaries,
    openings: room.edgeOpenings ?? [],
  });
  const derivedGeometry = deriveRoomPolygonGeometry(source);

  return freezeClone({
    ...source,
    roomName: room.roomName,
    area: derivedGeometry.area,
    labelPosition: derivedGeometry.labelPosition,
    walls: derivedGeometry.walls,
  });
}

function findRoom(
  state: BuildingGuideEditorState,
  floorId: string,
  roomId: string,
): EditorRoom {
  const floor = findFloor(state, floorId);
  const room = floor.rooms.find((candidate) => candidate.roomId === roomId);

  if (room == null) {
    throw new Error(`Room "${roomId}" was not found on floor "${floorId}".`);
  }

  return room;
}

function findFloor(
  state: BuildingGuideEditorState,
  floorId: string,
): EditorFloor {
  const floor = state.project.floors.find((candidate) => candidate.floorId === floorId);

  if (floor == null) {
    throw new Error(`Floor "${floorId}" was not found.`);
  }

  return floor;
}

function freezeClone<T>(value: T): DeepReadonly<T> {
  return deepFreeze(structuredClone(value));
}

function deepFreeze<T>(value: T): DeepReadonly<T> {
  if (value === null || typeof value !== "object") {
    return value as DeepReadonly<T>;
  }

  for (const nestedValue of Object.values(value)) {
    deepFreeze(nestedValue);
  }

  return Object.freeze(value) as DeepReadonly<T>;
}
