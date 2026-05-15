import {
  loadStoredFloorPlanImage,
  type FloorPlanImageStorage,
  type StoredFloorPlanImageAsset,
} from "./floor-plan-image-storage.ts";

export interface RetrieveFloorPlanImageAssetInput {
  assetRef: string;
}

export type RetrievedFloorPlanImageAsset = Readonly<StoredFloorPlanImageAsset>;

export function retrieveFloorPlanImageAsset(
  input: RetrieveFloorPlanImageAssetInput,
  storage: FloorPlanImageStorage,
): RetrievedFloorPlanImageAsset | null {
  const asset = loadStoredFloorPlanImage(input.assetRef, storage);

  if (asset == null) {
    return null;
  }

  return Object.freeze({
    ...asset,
  });
}
