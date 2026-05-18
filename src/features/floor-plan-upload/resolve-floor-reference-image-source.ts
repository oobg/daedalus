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

export interface ResolvedFloorReferenceImage {
  usage: "editing-reference";
  editable: false;
  source: string;
}

export type FloorReferenceImageSourceResult =
  | {
      ok: true;
      floorId: string;
      image: Readonly<ResolvedFloorReferenceImage>;
    }
  | {
      ok: false;
      floorId: string | null;
      code: "floor_not_found" | "reference_image_not_found";
    };

export function resolveFloorReferenceImageSource(
  input: ResolveFloorReferenceImageSourceInput,
  storage: FloorPlanImageStorage,
): string | null {
  const result = loadFloorReferenceImageSource(input, storage);

  return result.ok ? result.image.source : null;
}

export function resolveFloorReferenceImage(
  input: ResolveFloorReferenceImageSourceInput,
  storage: FloorPlanImageStorage,
): Readonly<ResolvedFloorReferenceImage> | null {
  const result = loadFloorReferenceImageSource(input, storage);

  return result.ok ? result.image : null;
}

export function loadFloorReferenceImageSource(
  input: ResolveFloorReferenceImageSourceInput,
  storage: FloorPlanImageStorage,
): FloorReferenceImageSourceResult {
  if (input.selectedFloorId == null) {
    return {
      ok: false,
      floorId: null,
      code: "floor_not_found",
    };
  }

  const floor = input.floors.find(
    ({ floorId }) => floorId === input.selectedFloorId,
  );

  if (floor == null) {
    return {
      ok: false,
      floorId: input.selectedFloorId,
      code: "floor_not_found",
    };
  }

  const referenceImage = floor.referenceImage;

  if (referenceImage == null || referenceImage.trim() === "") {
    return {
      ok: false,
      floorId: input.selectedFloorId,
      code: "reference_image_not_found",
    };
  }

  if (isInlineImageSource(referenceImage)) {
    return Object.freeze({
      ok: true,
      floorId: input.selectedFloorId ?? "",
      image: Object.freeze({
        usage: "editing-reference",
        editable: false,
        source: referenceImage,
      }),
    });
  }

  const asset = loadStoredFloorPlanImage(referenceImage, storage);

  if (asset == null) {
    return {
      ok: false,
      floorId: input.selectedFloorId,
      code: "reference_image_not_found",
    };
  }

  return Object.freeze({
    ok: true,
    floorId: input.selectedFloorId ?? "",
    image: Object.freeze({
      usage: "editing-reference",
      editable: false,
      source: createFloorPlanImageDataUrl(asset),
    }),
  });
}

function isInlineImageSource(value: string): boolean {
  return value.startsWith("data:image/") || value.startsWith("blob:");
}
