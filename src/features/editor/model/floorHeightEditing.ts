import {
  updateEditorFloor,
  type EditorProject,
} from "../../../domain/editor-state.ts";
import { validateFloorHeightValue } from "../../../domain/floor-height.ts";

export function parseFloorHeightEditorValue(value: string): number | null {
  const result = validateFloorHeightValue(value);

  return result.ok ? result.value : null;
}

export function formatFloorHeightEditorValue(floorHeight: number): string {
  return Number.isFinite(floorHeight) && floorHeight > 0 ? String(floorHeight) : "";
}

export function applyValidatedFloorHeightChange(
  project: EditorProject,
  floorId: string,
  floorHeight: number,
): EditorProject {
  const result = validateFloorHeightValue(floorHeight);

  if (!result.ok) {
    throw new Error(result.error.message);
  }

  return updateEditorFloor(project, floorId, {
    floorHeight: result.value,
  });
}
