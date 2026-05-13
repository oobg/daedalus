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

export type FloorReferenceImageData = Readonly<StoredFloorPlanImageAsset>;

export function loadFloorReferenceImage(
  input: LoadFloorReferenceImageInput,
  storage: FloorPlanImageStorage,
): FloorReferenceImageData | null {
  const floor = input.floors.find(({ id }) => id === input.floorId);

  if (floor == null) {
    throw new Error(`Floor "${input.floorId}" was not found.`);
  }

  if (floor.referenceImage == null) {
    return null;
  }

  const asset = loadStoredFloorPlanImage(floor.referenceImage, storage);

  if (asset == null) {
    return null;
  }

  return Object.freeze({
    ...asset,
  });
}
