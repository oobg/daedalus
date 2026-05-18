import type { Floor } from "../../domain/floor.ts";
import {
  loadStoredFloorPlanImage,
  type FloorPlanImageStorage,
  type StoredFloorPlanImageAsset,
} from "./floor-plan-image-storage.ts";

export interface LoadFloorReferenceImageInput {
  floors: readonly Floor[];
  floorId: string;
}

export interface FloorReferenceImageData {
  usage: "editing-reference";
  editable: false;
  sourceAsset: Readonly<StoredFloorPlanImageAsset>;
}

export type LoadFloorReferenceImageResult =
  | {
      ok: true;
      code: "loaded";
      image: FloorReferenceImageData;
    }
  | {
      ok: false;
      code: "missing_reference_image" | "missing_reference_image_asset";
      message: string;
    };

export function loadFloorReferenceImage(
  input: LoadFloorReferenceImageInput,
  storage: FloorPlanImageStorage,
): LoadFloorReferenceImageResult {
  const floor = input.floors.find(({ id }) => id === input.floorId);

  if (floor == null) {
    throw new Error(`Floor "${input.floorId}" was not found.`);
  }

  if (floor.referenceImage == null) {
    return {
      ok: false,
      code: "missing_reference_image",
      message: `Floor "${input.floorId}" has no associated reference image.`,
    };
  }

  const asset = loadStoredFloorPlanImage(floor.referenceImage, storage);

  if (asset == null) {
    return {
      ok: false,
      code: "missing_reference_image_asset",
      message: `Floor "${input.floorId}" references a floor plan image asset that is unavailable in storage.`,
    };
  }

  return Object.freeze({
    ok: true,
    code: "loaded",
    image: Object.freeze({
      usage: "editing-reference",
      editable: false,
      sourceAsset: Object.freeze({
        ...asset,
      }),
    }),
  });
}
