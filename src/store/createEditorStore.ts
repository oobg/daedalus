import { create } from "zustand";
import { nanoid } from "nanoid";

import type {
  EditorFloor,
  EditorPoint,
  EditorProject,
  EditorProjectInput,
  EditorRoom,
  RoomOpening,
  RoomOpeningType,
  SharedBoundaryRef,
} from "../domain/editor-state.ts";
import {
  DEFAULT_FLOOR_HEIGHT,
  addEditorFloor,
  createEditorProject,
  createEditorState,
  removeEditorFloor,
  removeEditorRoom,
  updateEditorFloor,
  updateEditorProject,
  updateEditorRoom,
} from "../domain/editor-state.ts";
import {
  persistCompletedRoomPolygon,
} from "../features/editor/model/roomPolygonCompletionPersistence.ts";
import {
  applyValidatedFloorHeightChange,
  applyValidatedSelectedFloorHeightChange,
} from "../features/editor/model/floorHeightEditing.ts";
import {
  persistDeletedRoomPolygonEdge,
  persistDeletedRoomPolygonVertex,
  persistInsertedRoomPolygonEdgeVertex,
} from "../features/editor/model/roomPolygonStatePersistence.ts";
import { translateRoomGeometrySource } from "../features/editor/model/roomGeometryHandles.ts";
import { collectRoomOutlinePoint } from "../features/editor/model/roomOutlinePointCollection.ts";
import {
  loadActiveProjectIdFromLocalStorage,
  loadProjectFromLocalStorage,
  saveProjectToLocalStorage,
  type LocalProjectStorage,
} from "../features/project-persistence/local-project-storage.ts";

export type ToolType =
  | "select"
  | "room"
  | "exterior"
  | "door"
  | "window"
  | "stair"
  | "elevator";

const STORAGE_KEY = "daedalus.project";

export interface EditorStoreOptions {
  storage?: LocalProjectStorage | null;
}

export interface EditorStoreState {
  project: EditorProject;
  activeTool: ToolType;
  isDrawing: boolean;
  draftPoints: EditorPoint[];
  replaceProject: (project: EditorProject) => void;
  setActiveTool: (tool: ToolType) => void;
  addFloor: () => void;
  updateFloor: (
    floorId: string,
    input: {
      floorName?: string;
      floorHeight?: number;
      referenceImage?: string | null;
    },
  ) => void;
  updateFloorHeight: (floorId: string, floorHeight: number) => void;
  updateActiveFloorHeight: (floorHeight: number) => void;
  removeFloor: (floorId: string) => void;
  setActiveFloor: (floorId: string) => void;
  addDraftPoint: (point: EditorPoint) => void;
  cancelDraft: () => void;
  commitDraft: () => void;
  setExteriorPolygon: (points: EditorPoint[] | null) => void;
  updateRoom: (
    floorId: string,
    roomId: string,
    input: {
      roomName?: string;
      roomPolygon?: EditorPoint[];
      sharedBoundaries?: SharedBoundaryRef[];
      openings?: RoomOpening[];
    },
  ) => void;
  insertRoomVertexOnEdge: (
    floorId: string,
    roomId: string,
    edgeIndex: number,
    point: EditorPoint,
  ) => void;
  removeRoomVertex: (
    floorId: string,
    roomId: string,
    vertexIndex: number,
  ) => void;
  collapseRoomEdge: (
    floorId: string,
    roomId: string,
    edgeIndex: number,
  ) => void;
  translateRoom: (floorId: string, roomId: string, delta: EditorPoint) => void;
  removeRoom: (floorId: string, roomId: string) => void;
  selectRoom: (roomId: string | null) => void;
  setFloorReferenceImage: (floorId: string, dataUrl: string | null) => void;
  setActiveFloorReferenceImage: (dataUrl: string | null) => void;
  addOpening: (
    floorId: string,
    roomId: string,
    type: RoomOpeningType,
    x: number,
    y: number,
  ) => void;
  removeOpening: (floorId: string, roomId: string, openingId: string) => void;
  addExteriorOpening: (type: RoomOpeningType, x: number, y: number) => void;
  removeExteriorOpening: (openingId: string) => void;
  exportJSON: () => string;
  importJSON: (json: string) => { ok: true } | { ok: false; error: string };
  saveToLocalStorage: () => void;
  loadFromLocalStorage: () => boolean;
}

function makeInitialProject(): EditorProject {
  const floorId = nanoid();

  return createEditorState({
    projectId: nanoid(),
    projectName: "New Building Guide",
    floors: [{ floorId, floorName: "1F", floorHeight: DEFAULT_FLOOR_HEIGHT }],
  }).project;
}

function normalizeProjectForStore(
  project: EditorProject | EditorProjectInput,
): EditorProject {
  return createEditorProject({
    projectId: project.projectId,
    projectName: project.projectName,
    objectVersion: project.objectVersion,
    floors: (project.floors ?? []).map((floor) => ({
      floorId: floor.floorId,
      floorName: floor.floorName,
      floorHeight: floor.floorHeight,
      referenceImage: floor.referenceImage,
      rooms: (floor.rooms ?? []).map((room) => ({
        roomId: room.roomId,
        roomName: room.roomName,
        roomPolygon: room.roomPolygon,
        sharedBoundaries: room.sharedBoundaries,
        openings: room.openings,
        edgeOpenings: room.edgeOpenings,
        metadata: room.metadata,
      })),
      verticalConnectors: floor.verticalConnectors,
      guideObjects: floor.guideObjects,
      metadata: floor.metadata,
    })),
    viewState: project.viewState,
    exteriorPolygon: project.exteriorPolygon,
    exteriorEdgeOpenings: project.exteriorEdgeOpenings,
    metadata: project.metadata,
  });
}

function resolveEditorStorage(
  storage: EditorStoreOptions["storage"],
): LocalProjectStorage | null {
  if (storage !== undefined) {
    return storage;
  }

  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

export function createEditorStore(options: EditorStoreOptions = {}) {
  const storage = resolveEditorStorage(options.storage);

  return create<EditorStoreState>((set, get) => ({
    project: makeInitialProject(),
    activeTool: "select",
    isDrawing: false,
    draftPoints: [],

    replaceProject: (project) =>
      set({ project: normalizeProjectForStore(project) }),

    setActiveTool: (tool) =>
      set({ activeTool: tool, isDrawing: false, draftPoints: [] }),

    addFloor: () => {
      const { project } = get();
      const floorId = nanoid();
      const index = project.floors.length + 1;
      const nextProject = addEditorFloor(project, {
        floorId,
        floorName: `${index}F`,
        floorHeight: DEFAULT_FLOOR_HEIGHT,
      });

      set({ project: nextProject });
      get().saveToLocalStorage();
    },

    updateFloor: (floorId, input) => {
      set({ project: updateEditorFloor(get().project, floorId, input) });
      get().saveToLocalStorage();
    },

    updateFloorHeight: (floorId, floorHeight) => {
      set({
        project: applyValidatedFloorHeightChange(
          get().project,
          floorId,
          floorHeight,
        ),
      });
      get().saveToLocalStorage();
    },

    updateActiveFloorHeight: (floorHeight) => {
      const activeFloorId = get().project.viewState.activeFloorId;

      if (activeFloorId === null) {
        applyValidatedSelectedFloorHeightChange(get().project, floorHeight);
        return;
      }

      get().updateFloorHeight(activeFloorId, floorHeight);
    },

    removeFloor: (floorId) => {
      const { project } = get();

      if (project.floors.length <= 1) {
        return;
      }

      set({ project: removeEditorFloor(project, floorId) });
    },

    setActiveFloor: (floorId) => {
      set({
        project: updateEditorProject(get().project, {
          viewState: {
            activeFloorId: floorId,
            selectedRoomId: null,
          },
        }),
        isDrawing: false,
        draftPoints: [],
      });
    },

    addDraftPoint: (point) => {
      const { activeTool, draftPoints } = get();

      if (activeTool === "room") {
        const capture = collectRoomOutlinePoint(
          {
            activeTool,
            isDrawing: get().isDrawing,
            draftPoints,
          },
          point,
        );

        if (capture.completed) {
          get().commitDraft();
          return;
        }

        set({
          isDrawing: capture.state.isDrawing,
          draftPoints: [...capture.state.draftPoints],
        });
        return;
      }

      if (activeTool !== "exterior") {
        return;
      }

      set({ isDrawing: true, draftPoints: [...draftPoints, point] });
    },

    cancelDraft: () => set({ isDrawing: false, draftPoints: [] }),

    commitDraft: () => {
      const { draftPoints, project, activeTool } = get();

      if (draftPoints.length < 3) {
        return;
      }

      if (activeTool === "exterior") {
        set((state) => ({
          project: { ...state.project, exteriorPolygon: [...draftPoints] },
          isDrawing: false,
          draftPoints: [],
        }));
        return;
      }

      const activeFloorId = project.viewState.activeFloorId;

      if (!activeFloorId) {
        return;
      }

      const roomCount =
        project.floors.find((floor) => floor.floorId === activeFloorId)?.rooms
          .length ?? 0;
      const roomId = nanoid();
      const roomName = `Room ${roomCount + 1}`;
      const persistedRoom = persistCompletedRoomPolygon({
        project,
        floorId: activeFloorId,
        roomId,
        roomName,
        orderedVertices: draftPoints,
      });

      if (!persistedRoom.ok) {
        return;
      }

      set({
        project: persistedRoom.project,
        isDrawing: false,
        draftPoints: [],
      });

      get().saveToLocalStorage();
    },

    setExteriorPolygon: (points) => {
      set((state) => ({ project: { ...state.project, exteriorPolygon: points } }));
    },

    updateRoom: (floorId, roomId, input) => {
      const project = updateEditorRoom(get().project, floorId, roomId, input);

      set({ project });
      get().saveToLocalStorage();
    },

    insertRoomVertexOnEdge: (floorId, roomId, edgeIndex, point) => {
      const result = persistInsertedRoomPolygonEdgeVertex(
        get().project,
        {
          floorId,
          roomId,
        },
        edgeIndex,
        point,
      );

      if (!result.ok) {
        return;
      }

      set({ project: result.project });
      get().saveToLocalStorage();
    },

    removeRoomVertex: (floorId, roomId, vertexIndex) => {
      const result = persistDeletedRoomPolygonVertex(
        get().project,
        {
          floorId,
          roomId,
        },
        vertexIndex,
      );

      if (!result.ok) {
        return;
      }

      set({ project: result.project });
      get().saveToLocalStorage();
    },

    collapseRoomEdge: (floorId, roomId, edgeIndex) => {
      const result = persistDeletedRoomPolygonEdge(
        get().project,
        {
          floorId,
          roomId,
        },
        edgeIndex,
      );

      if (!result.ok) {
        return;
      }

      set({ project: result.project });
      get().saveToLocalStorage();
    },

    translateRoom: (floorId, roomId, delta) => {
      const { project } = get();
      const floor = project.floors.find(
        (candidate) => candidate.floorId === floorId,
      );
      const room = floor?.rooms.find((candidate) => candidate.roomId === roomId);

      if (!room) {
        return;
      }

      const translatedGeometry = translateRoomGeometrySource(room, delta);

      if (translatedGeometry === null) {
        return;
      }

      set({
        project: updateEditorRoom(project, floorId, roomId, {
          roomPolygon: translatedGeometry.roomPolygon,
          openings: translatedGeometry.openings,
        }),
      });

      get().saveToLocalStorage();
    },

    removeRoom: (floorId, roomId) => {
      set({ project: removeEditorRoom(get().project, floorId, roomId) });
      get().saveToLocalStorage();
    },

    selectRoom: (roomId) => {
      set({
        project: updateEditorProject(get().project, {
          viewState: { selectedRoomId: roomId },
        }),
      });
    },

    setFloorReferenceImage: (floorId, dataUrl) => {
      set({
        project: updateEditorFloor(get().project, floorId, {
          referenceImage: dataUrl,
        }),
      });
      get().saveToLocalStorage();
    },

    setActiveFloorReferenceImage: (dataUrl) => {
      const activeFloorId = get().project.viewState.activeFloorId;

      if (!activeFloorId) {
        return;
      }

      get().setFloorReferenceImage(activeFloorId, dataUrl);
    },

    addOpening: (floorId, roomId, type, x, y) => {
      const opening: RoomOpening = { id: nanoid(), type, x, y, angle: 0 };

      set((state) => ({
        project: {
          ...state.project,
          floors: state.project.floors.map((floor) =>
            floor.floorId !== floorId
              ? floor
              : {
                  ...floor,
                  rooms: floor.rooms.map((room) =>
                    room.roomId !== roomId
                      ? room
                      : {
                          ...room,
                          openings: [...(room.openings ?? []), opening],
                        },
                  ),
                },
          ),
        },
      }));
    },

    removeOpening: (floorId, roomId, openingId) => {
      set((state) => ({
        project: {
          ...state.project,
          floors: state.project.floors.map((floor) =>
            floor.floorId !== floorId
              ? floor
              : {
                  ...floor,
                  rooms: floor.rooms.map((room) =>
                    room.roomId !== roomId
                      ? room
                      : {
                          ...room,
                          openings: (room.openings ?? []).filter(
                            (opening) => opening.id !== openingId,
                          ),
                        },
                  ),
                },
          ),
        },
      }));
    },

    addExteriorOpening: (type, x, y) => {
      const opening: RoomOpening = { id: nanoid(), type, x, y, angle: 0 };

      set((state) => ({
        project: {
          ...state.project,
          exteriorEdgeOpenings: [
            ...(state.project.exteriorEdgeOpenings ?? []),
            opening,
          ],
        },
      }));
      get().saveToLocalStorage();
    },

    removeExteriorOpening: (openingId) => {
      set((state) => ({
        project: {
          ...state.project,
          exteriorEdgeOpenings: (state.project.exteriorEdgeOpenings ?? []).filter(
            (op) => op.id !== openingId,
          ),
        },
      }));
      get().saveToLocalStorage();
    },

    exportJSON: () => JSON.stringify(get().project, null, 2),

    importJSON: (json) => {
      try {
        const parsed = JSON.parse(json) as Partial<EditorProjectInput>;

        if (!parsed.projectId || !Array.isArray(parsed.floors)) {
          return { ok: false, error: "Invalid project format." };
        }

        set({ project: normalizeProjectForStore(parsed as EditorProjectInput) });
        return { ok: true };
      } catch {
        return { ok: false, error: "Failed to parse JSON." };
      }
    },

    saveToLocalStorage: () => {
      if (storage == null) {
        return;
      }

      try {
        const project = normalizeProjectForStore(get().project);

        set({ project });

        saveProjectToLocalStorage(project, storage);
        storage.setItem(STORAGE_KEY, JSON.stringify(project));
      } catch {
        // Storage might be unavailable (SSR, private browsing)
      }
    },

    loadFromLocalStorage: () => {
      if (storage == null) {
        return false;
      }

      try {
        const activeProjectId = loadActiveProjectIdFromLocalStorage(storage);

        if (activeProjectId) {
          const storedRecord = loadProjectFromLocalStorage<EditorProject>(
            activeProjectId,
            storage,
          );

          if (storedRecord?.project) {
            set({ project: normalizeProjectForStore(storedRecord.project) });
            return true;
          }
        }

        const raw = storage.getItem(STORAGE_KEY);

        if (!raw) {
          return false;
        }

        const parsed = JSON.parse(raw) as Partial<EditorProjectInput>;

        if (!parsed.projectId || !Array.isArray(parsed.floors)) {
          return false;
        }

        set({ project: normalizeProjectForStore(parsed as EditorProjectInput) });
        return true;
      } catch {
        return false;
      }
    },
  }));
}

export function selectActiveFloor(
  project: EditorProject,
): EditorFloor | null {
  const activeFloorId = project.viewState.activeFloorId;

  return project.floors.find((floor) => floor.floorId === activeFloorId) ?? null;
}

export function selectSelectedRoom(
  project: EditorProject,
): EditorRoom | null {
  const { activeFloorId, selectedRoomId } = project.viewState;

  if (!activeFloorId || !selectedRoomId) {
    return null;
  }

  const floor = project.floors.find(
    (candidate) => candidate.floorId === activeFloorId,
  );

  return floor?.rooms.find((room) => room.roomId === selectedRoomId) ?? null;
}
