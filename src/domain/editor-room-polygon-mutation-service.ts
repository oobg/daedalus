import {
  addEditorRoom,
  createEditorState,
  removeEditorRoom,
  updateEditorRoom,
  type BuildingGuideEditorState,
  type EditorProjectInput,
  type EditorRoomInput,
  type EditorPoint,
} from "./editor-state.ts";

export interface EditorRoomPolygonMutationService {
  getSnapshot(): DeepReadonly<BuildingGuideEditorState>;
  replaceState(input: EditorProjectInput): DeepReadonly<BuildingGuideEditorState>;
  addRoom(
    floorId: string,
    input: EditorRoomInput,
  ): DeepReadonly<BuildingGuideEditorState>;
  updateRoomPolygon(
    floorId: string,
    roomId: string,
    roomPolygon: readonly EditorPoint[],
  ): DeepReadonly<BuildingGuideEditorState>;
  removeRoom(
    floorId: string,
    roomId: string,
  ): DeepReadonly<BuildingGuideEditorState>;
}

export type DeepReadonly<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends readonly (infer Item)[]
    ? readonly DeepReadonly<Item>[]
    : T extends object
      ? { readonly [Key in keyof T]: DeepReadonly<T[Key]> }
      : T;

export function createEditorRoomPolygonMutationService(
  initialState: EditorProjectInput,
): EditorRoomPolygonMutationService {
  let state = createEditorState(initialState);

  return {
    getSnapshot: () => cloneReadonlyState(state),
    replaceState: (input) => {
      state = createEditorState(input);
      return cloneReadonlyState(state);
    },
    addRoom: (floorId, input) => {
      state = {
        project: addEditorRoom(state.project, floorId, input),
      };
      return cloneReadonlyState(state);
    },
    updateRoomPolygon: (floorId, roomId, roomPolygon) => {
      state = {
        project: updateEditorRoom(state.project, floorId, roomId, {
          roomPolygon,
        }),
      };
      return cloneReadonlyState(state);
    },
    removeRoom: (floorId, roomId) => {
      state = {
        project: removeEditorRoom(state.project, floorId, roomId),
      };
      return cloneReadonlyState(state);
    },
  };
}

function cloneReadonlyState(
  state: BuildingGuideEditorState,
): DeepReadonly<BuildingGuideEditorState> {
  return deepFreeze(structuredClone(state));
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
