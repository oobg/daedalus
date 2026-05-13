"use client";

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
} from "@/domain/editor-state";
import {
  createEditorState,
  addEditorFloor,
  updateEditorFloor,
  removeEditorFloor,
  addEditorRoom,
  updateEditorRoom,
  removeEditorRoom,
  updateEditorProject,
} from "@/domain/editor-state";

export type ToolType = "select" | "room" | "exterior" | "door" | "window" | "stair" | "elevator";

const STORAGE_KEY = "daedalus.project";

interface EditorStoreState {
  project: EditorProject;
  activeTool: ToolType;
  isDrawing: boolean;
  draftPoints: EditorPoint[];

  setActiveTool: (tool: ToolType) => void;

  addFloor: () => void;
  updateFloor: (floorId: string, input: { floorName?: string; floorHeight?: number; referenceImage?: string | null }) => void;
  removeFloor: (floorId: string) => void;
  setActiveFloor: (floorId: string) => void;

  addDraftPoint: (point: EditorPoint) => void;
  cancelDraft: () => void;
  commitDraft: () => void;
  setExteriorPolygon: (points: EditorPoint[] | null) => void;

  updateRoom: (floorId: string, roomId: string, input: { roomName?: string; roomPolygon?: EditorPoint[]; sharedBoundaries?: SharedBoundaryRef[] }) => void;
  removeRoom: (floorId: string, roomId: string) => void;
  selectRoom: (roomId: string | null) => void;

  setReferenceImage: (floorId: string, dataUrl: string | null) => void;

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
    floors: [{ floorId, floorName: "1F", floorHeight: 3 }],
  }).project;
}

export const useEditorStore = create<EditorStoreState>((set, get) => ({
  project: makeInitialProject(),
  activeTool: "select",
  isDrawing: false,
  draftPoints: [],

  setActiveTool: (tool) => set({ activeTool: tool, isDrawing: false, draftPoints: [] }),

  addFloor: () => {
    const { project } = get();
    const floorId = nanoid();
    const index = project.floors.length + 1;
    set({ project: addEditorFloor(project, { floorId, floorName: `${index}F`, floorHeight: 3 }) });
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
    if (activeTool !== "room" && activeTool !== "exterior") return;
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
    set({
      project: addEditorRoom(project, activeFloorId, {
        roomId,
        roomName: `Room ${roomCount + 1}`,
        roomPolygon: draftPoints,
        sharedBoundaries: [],
      }),
      isDrawing: false,
      draftPoints: [],
    });
  },

  setExteriorPolygon: (points) => {
    set(s => ({ project: { ...s.project, exteriorPolygon: points } }));
  },

  updateRoom: (floorId, roomId, input) => {
    set({ project: updateEditorRoom(get().project, floorId, roomId, input) });
  },

  removeRoom: (floorId, roomId) => {
    set({ project: removeEditorRoom(get().project, floorId, roomId) });
  },

  selectRoom: (roomId) => {
    set({ project: updateEditorProject(get().project, { viewState: { selectedRoomId: roomId } }) });
  },

  setReferenceImage: (floorId, dataUrl) => {
    set({ project: updateEditorFloor(get().project, floorId, { referenceImage: dataUrl }) });
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
      const parsed = JSON.parse(json) as EditorProject;
      if (!parsed.projectId || !Array.isArray(parsed.floors)) {
        return { ok: false, error: "Invalid project format." };
      }
      set({ project: parsed });
      return { ok: true };
    } catch {
      return { ok: false, error: "Failed to parse JSON." };
    }
  },

  saveToLocalStorage: () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(get().project));
    } catch {
      // Storage might be unavailable (SSR, private browsing)
    }
  },

  loadFromLocalStorage: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const parsed = JSON.parse(raw) as EditorProject;
      if (!parsed.projectId || !Array.isArray(parsed.floors)) return false;
      set({ project: parsed });
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

    const W = 800;
    const H = 600;
    const paths = floor.rooms.map(room => {
      const pts = room.roomPolygon
        .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
        .join(" ") + " Z";
      return `  <path d="${pts}" fill="#e8e8e0" stroke="#888" stroke-width="2"><title>${room.roomName}</title></path>`;
    });
    const labels = floor.rooms.map(room => {
      const lp = room.labelPosition;
      if (!lp) return "";
      return `  <text x="${lp.x.toFixed(1)}" y="${lp.y.toFixed(1)}" text-anchor="middle" font-size="12" fill="#444">${room.roomName}</text>`;
    });
    const svg = [
      `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`,
      `  <rect width="${W}" height="${H}" fill="#fafaf8"/>`,
      ...paths,
      ...labels,
      `</svg>`,
    ].join("\n");

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

export function useSelectedRoom(): EditorRoom | null {
  return useEditorStore(s => {
    const { activeFloorId, selectedRoomId } = s.project.viewState;
    if (!activeFloorId || !selectedRoomId) return null;
    const floor = s.project.floors.find(f => f.floorId === activeFloorId);
    return floor?.rooms.find(r => r.roomId === selectedRoomId) ?? null;
  });
}
