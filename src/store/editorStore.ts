"use client";

import { useEffect, useState } from "react";
import { create } from "zustand";
import { nanoid } from "nanoid";
import type {
  EditorProject,
  EditorFloor,
  EditorRoom,
  EditorPoint,
  SharedBoundaryRef,
  RoomOpening,
  RoomOpeningType,
  EditorProjectInput,
} from "@/domain/editor-state";
import {
  DEFAULT_FLOOR_HEIGHT,
  createEditorState,
  createEditorProject,
  addEditorFloor,
  updateEditorFloor,
  removeEditorFloor,
  addEditorRoom,
  updateEditorRoom,
  removeEditorRoom,
  updateEditorProject,
} from "@/domain/editor-state";
import { collectRoomOutlinePoint } from "@/features/editor/model/roomOutlinePointCollection";
import { resolveFloorReferenceImageSource } from "@/features/floor-plan-upload/resolve-floor-reference-image-source";
import {
  collectRoomDraftPoints,
  finalizeEditorRoomDraft,
} from "@/features/editor/model/roomDraft";
import { translateRoomGeometrySource } from "@/features/editor/model/roomGeometryHandles";
import { buildFloorGuideSvgExport } from "@/features/project-export/floor-guide-svg-export";
import {
  loadActiveProjectIdFromLocalStorage,
  loadProjectFromLocalStorage,
  saveProjectToLocalStorage,
} from "@/features/project-persistence/local-project-storage";

export type ToolType = "select" | "room" | "exterior" | "door" | "window" | "stair" | "elevator";

const STORAGE_KEY = "daedalus.project";

interface EditorStoreState {
  project: EditorProject;
  activeTool: ToolType;
  isDrawing: boolean;
  draftPoints: EditorPoint[];

  replaceProject: (project: EditorProject) => void;

  setActiveTool: (tool: ToolType) => void;

  addFloor: () => void;
  updateFloor: (floorId: string, input: { floorName?: string; floorHeight?: number; referenceImage?: string | null }) => void;
  removeFloor: (floorId: string) => void;
  setActiveFloor: (floorId: string) => void;

  addDraftPoint: (point: EditorPoint) => void;
  cancelDraft: () => void;
  commitDraft: () => void;
  setExteriorPolygon: (points: EditorPoint[] | null) => void;

  updateRoom: (floorId: string, roomId: string, input: { roomName?: string; roomPolygon?: EditorPoint[]; sharedBoundaries?: SharedBoundaryRef[]; openings?: RoomOpening[] }) => void;
  translateRoom: (floorId: string, roomId: string, delta: EditorPoint) => void;
  removeRoom: (floorId: string, roomId: string) => void;
  selectRoom: (roomId: string | null) => void;

  setFloorReferenceImage: (floorId: string, dataUrl: string | null) => void;
  setActiveFloorReferenceImage: (dataUrl: string | null) => void;

  addOpening: (floorId: string, roomId: string, type: RoomOpeningType, x: number, y: number) => void;
  removeOpening: (floorId: string, roomId: string, openingId: string) => void;

  exportJSON: () => string;
  importJSON: (json: string) => { ok: true } | { ok: false; error: string };
  saveToLocalStorage: () => void;
  loadFromLocalStorage: () => boolean;

  exportSVG: (floorId?: string) => void;
}

function makeInitialProject(): EditorProject {
  const floorId = nanoid();
  return createEditorState({
    projectId: nanoid(),
    projectName: "New Building Guide",
    floors: [{ floorId, floorName: "1F", floorHeight: DEFAULT_FLOOR_HEIGHT }],
  }).project;
}

export const useEditorStore = create<EditorStoreState>((set, get) => ({
  project: makeInitialProject(),
  activeTool: "select",
  isDrawing: false,
  draftPoints: [],

  replaceProject: (project) => set({ project }),

  setActiveTool: (tool) => set({ activeTool: tool, isDrawing: false, draftPoints: [] }),

  addFloor: () => {
    const { project } = get();
    const floorId = nanoid();
    const index = project.floors.length + 1;
    set({ project: addEditorFloor(project, { floorId, floorName: `${index}F`, floorHeight: DEFAULT_FLOOR_HEIGHT }) });
  },

  updateFloor: (floorId, input) => {
    set({ project: updateEditorFloor(get().project, floorId, input) });
  },

  removeFloor: (floorId) => {
    const { project } = get();
    if (project.floors.length <= 1) return;
    set({ project: removeEditorFloor(project, floorId) });
  },

  setActiveFloor: (floorId) => {
    set({
      project: updateEditorProject(get().project, { viewState: { activeFloorId: floorId, selectedRoomId: null } }),
      isDrawing: false,
      draftPoints: [],
    });
  },

  addDraftPoint: (point) => {
    const { activeTool, draftPoints } = get();
    if (activeTool === "room") {
      const capture = collectRoomOutlinePoint({
        activeTool,
        isDrawing: get().isDrawing,
        draftPoints,
      }, point);

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

    if (activeTool !== "exterior") return;
    set({ isDrawing: true, draftPoints: [...draftPoints, point] });
  },

  cancelDraft: () => set({ isDrawing: false, draftPoints: [] }),

  commitDraft: () => {
    const { draftPoints, project, activeTool } = get();
    if (draftPoints.length < 3) return;

    if (activeTool === "exterior") {
      set(s => ({
        project: { ...s.project, exteriorPolygon: [...draftPoints] },
        isDrawing: false,
        draftPoints: [],
      }));
      return;
    }

    const activeFloorId = project.viewState.activeFloorId;
    if (!activeFloorId) return;
    const roomCount = project.floors.find(f => f.floorId === activeFloorId)?.rooms.length ?? 0;
    const roomId = nanoid();
    const roomName = `Room ${roomCount + 1}`;
    const roomDraft = collectRoomDraftPoints(roomId, draftPoints);
    let roomInput: ReturnType<typeof finalizeEditorRoomDraft>;

    try {
      roomInput = finalizeEditorRoomDraft(roomDraft, roomName);
    } catch {
      return;
    }

    const nextProject = addEditorRoom(project, activeFloorId, roomInput);

    set({
      project: nextProject,
      isDrawing: false,
      draftPoints: [],
    });
    get().saveToLocalStorage();
  },

  setExteriorPolygon: (points) => {
    set(s => ({ project: { ...s.project, exteriorPolygon: points } }));
  },

  updateRoom: (floorId, roomId, input) => {
    set({ project: updateEditorRoom(get().project, floorId, roomId, input) });
  },

  translateRoom: (floorId, roomId, delta) => {
    const { project } = get();
    const floor = project.floors.find((candidate) => candidate.floorId === floorId);
    const room = floor?.rooms.find((candidate) => candidate.roomId === roomId);

    if (!room) return;

    const translatedGeometry = translateRoomGeometrySource(room, delta);

    if (translatedGeometry === null) return;

    set({
      project: updateEditorRoom(project, floorId, roomId, {
        roomPolygon: translatedGeometry.roomPolygon,
        openings: translatedGeometry.openings,
      }),
    });
  },

  removeRoom: (floorId, roomId) => {
    set({ project: removeEditorRoom(get().project, floorId, roomId) });
  },

  selectRoom: (roomId) => {
    set({ project: updateEditorProject(get().project, { viewState: { selectedRoomId: roomId } }) });
  },

  setFloorReferenceImage: (floorId, dataUrl) => {
    set({ project: updateEditorFloor(get().project, floorId, { referenceImage: dataUrl }) });
  },

  setActiveFloorReferenceImage: (dataUrl) => {
    const activeFloorId = get().project.viewState.activeFloorId;
    if (!activeFloorId) return;

    get().setFloorReferenceImage(activeFloorId, dataUrl);
  },

  addOpening: (floorId, roomId, type, x, y) => {
    const opening: RoomOpening = { id: nanoid(), type, x, y, angle: 0 };
    set(s => ({
      project: {
        ...s.project,
        floors: s.project.floors.map(f =>
          f.floorId !== floorId ? f : {
            ...f,
            rooms: f.rooms.map(r =>
              r.roomId !== roomId ? r : { ...r, openings: [...(r.openings ?? []), opening] }
            ),
          }
        ),
      },
    }));
  },

  removeOpening: (floorId, roomId, openingId) => {
    set(s => ({
      project: {
        ...s.project,
        floors: s.project.floors.map(f =>
          f.floorId !== floorId ? f : {
            ...f,
            rooms: f.rooms.map(r =>
              r.roomId !== roomId ? r : { ...r, openings: (r.openings ?? []).filter(o => o.id !== openingId) }
            ),
          }
        ),
      },
    }));
  },

  exportJSON: () => {
    return JSON.stringify(get().project, null, 2);
  },

  importJSON: (json) => {
    try {
      const parsed = JSON.parse(json) as Partial<EditorProjectInput>;
      if (!parsed.projectId || !Array.isArray(parsed.floors)) {
        return { ok: false, error: "Invalid project format." };
      }
      set({ project: createEditorProject(parsed as EditorProjectInput) });
      return { ok: true };
    } catch {
      return { ok: false, error: "Failed to parse JSON." };
    }
  },

  saveToLocalStorage: () => {
    try {
      const project = get().project;

      saveProjectToLocalStorage(project, localStorage);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
    } catch {
      // Storage might be unavailable (SSR, private browsing)
    }
  },

  loadFromLocalStorage: () => {
    try {
      const activeProjectId = loadActiveProjectIdFromLocalStorage(localStorage);

      if (activeProjectId) {
        const storedRecord = loadProjectFromLocalStorage<EditorProject>(
          activeProjectId,
          localStorage,
        );

        if (storedRecord?.project) {
          set({ project: createEditorProject(storedRecord.project) });
          return true;
        }
      }

      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const parsed = JSON.parse(raw) as Partial<EditorProjectInput>;
      if (!parsed.projectId || !Array.isArray(parsed.floors)) return false;
      set({ project: createEditorProject(parsed as EditorProjectInput) });
      return true;
    } catch {
      return false;
    }
  },

  exportSVG: (floorId) => {
    const { project } = get();
    const targetFloorId = floorId ?? project.viewState.activeFloorId;
    const floor = project.floors.find(f => f.floorId === targetFloorId);
    if (!floor) return;

    const svg = buildFloorGuideSvgExport(floor);

    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${floor.floorName ?? "floor"}-guide.svg`;
    a.click();
    URL.revokeObjectURL(url);
  },
}));

export function useActiveFloor(): EditorFloor | null {
  return useEditorStore(s => {
    const id = s.project.viewState.activeFloorId;
    return s.project.floors.find(f => f.floorId === id) ?? null;
  });
}

export function useActiveFloorReferenceImageSource(): string | null {
  const floor = useActiveFloor();
  const [source, setSource] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      setSource(null);
      return;
    }

    setSource(resolveFloorReferenceImageSource({ floor }, window.localStorage));
  }, [floor?.floorId, floor?.referenceImage]);

  return source;
}

export function useSelectedRoom(): EditorRoom | null {
  return useEditorStore(s => {
    const { activeFloorId, selectedRoomId } = s.project.viewState;
    if (!activeFloorId || !selectedRoomId) return null;
    const floor = s.project.floors.find(f => f.floorId === activeFloorId);
    return floor?.rooms.find(r => r.roomId === selectedRoomId) ?? null;
  });
}
