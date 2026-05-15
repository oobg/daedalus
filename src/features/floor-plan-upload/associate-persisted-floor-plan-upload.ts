import type { Floor } from "../../domain/floor.ts";
import type { StoredFloorPlanImageAsset } from "./floor-plan-image-storage.ts";
import {
  assignFloorReferenceImageToFloor,
  type FloorReferenceImageMetadataUpdateResult,
} from "./floor-reference-image-metadata.ts";

export interface AssociatePersistedFloorPlanUploadInput {
  floors: readonly Floor[];
  floorId: string;
  persistedUpload: Pick<StoredFloorPlanImageAsset, "assetRef">;
}

export interface AssociatedPersistedFloorPlanUploadResult
  extends FloorReferenceImageMetadataUpdateResult {
  persistedUpload: Pick<StoredFloorPlanImageAsset, "assetRef">;
}

export function associatePersistedFloorPlanUploadToFloor(
  input: AssociatePersistedFloorPlanUploadInput,
): AssociatedPersistedFloorPlanUploadResult {
  const association = assignFloorReferenceImageToFloor({
    floors: input.floors,
    floorId: input.floorId,
    referenceImageAssetRef: input.persistedUpload.assetRef,
  });

  return {
    ...association,
    persistedUpload: input.persistedUpload,
  };
}
