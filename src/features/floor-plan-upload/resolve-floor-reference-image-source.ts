import type { EditorFloor } from "../../domain/editor-state.ts";
import {
  createFloorPlanImageDataUrl,
  loadStoredFloorPlanImage,
  type FloorPlanImageStorage,
} from "./floor-plan-image-storage.ts";

export interface ResolveFloorReferenceImageSourceInput {
  floors: readonly EditorFloor[];
  selectedFloorId: string | null;
}

export function resolveFloorReferenceImageSource(
  input: ResolveFloorReferenceImageSourceInput,
  storage: FloorPlanImageStorage,
): string | null {
  const referenceImage = resolveFloorReferenceImageAssetRef(input);

  if (referenceImage == null || referenceImage.trim() === "") {
    return null;
  }

  if (isInlineImageSource(referenceImage)) {
    return referenceImage;
  }

  const asset = loadStoredFloorPlanImage(referenceImage, storage);

  if (asset == null) {
    return null;
  }

  return createFloorPlanImageDataUrl(asset);
}

function isInlineImageSource(value: string): boolean {
  return value.startsWith("data:image/") || value.startsWith("blob:");
}

function resolveFloorReferenceImageAssetRef(
  input: ResolveFloorReferenceImageSourceInput,
): string | null {
  if (input.selectedFloorId == null) {
    return null;
  }

  const floor = input.floors.find(
    ({ floorId }) => floorId === input.selectedFloorId,
  );

  return floor?.referenceImage ?? null;
}
