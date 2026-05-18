"use client";

import { useEffect, useState } from "react";
import type { EditorFloor, EditorRoom } from "@/domain/editor-state";
import { resolveFloorReferenceImageSource } from "@/features/floor-plan-upload/resolve-floor-reference-image-source";
import {
  createEditorStore,
  selectActiveFloor,
  selectSelectedRoom,
  type EditorStoreState,
  type ToolType,
} from "./createEditorStore";

export type { ToolType } from "./createEditorStore";

export const useEditorStore = createEditorStore();

export function useActiveFloor(): EditorFloor | null {
  return useEditorStore((state: EditorStoreState) => selectActiveFloor(state.project));
}

export function useActiveFloorReferenceImageSource(): string | null {
  const floor = useActiveFloor();
  const floors = useEditorStore((s) => s.project.floors);
  const [source, setSource] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      setSource(null);
      return;
    }

    setSource(
      resolveFloorReferenceImageSource(
        {
          floors,
          selectedFloorId: floor?.floorId ?? null,
        },
        window.localStorage,
      ),
    );
  }, [floor?.floorId, floor?.referenceImage, floors]);

  return source;
}

export function useSelectedRoom(): EditorRoom | null {
  return useEditorStore((state: EditorStoreState) => selectSelectedRoom(state.project));
}
