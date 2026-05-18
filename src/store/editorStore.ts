"use client";

import { useEffect, useState } from "react";
import type { EditorFloor, EditorRoom } from "@/domain/editor-state";
import {
  resolveFloorReferenceImage,
  type ResolvedFloorReferenceImage,
} from "@/features/floor-plan-upload/resolve-floor-reference-image-source";
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
  const referenceImage = useActiveFloorReferenceImage();

  return referenceImage?.source ?? null;
}

export function useActiveFloorReferenceImage(): Readonly<ResolvedFloorReferenceImage> | null {
  const floor = useActiveFloor();
  const floors = useEditorStore((s) => s.project.floors);
  const [referenceImage, setReferenceImage] =
    useState<Readonly<ResolvedFloorReferenceImage> | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      setReferenceImage(null);
      return;
    }

    setReferenceImage(
      resolveFloorReferenceImage(
        {
          floors,
          selectedFloorId: floor?.floorId ?? null,
        },
        window.localStorage,
      ),
    );
  }, [floor?.floorId, floor?.referenceImage, floors]);

  return referenceImage;
}

export function useSelectedRoom(): EditorRoom | null {
  return useEditorStore((state: EditorStoreState) => selectSelectedRoom(state.project));
}
