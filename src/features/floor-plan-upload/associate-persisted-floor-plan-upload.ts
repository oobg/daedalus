import type { Floor } from "../../domain/floor.ts";
import type { StoredFloorPlanImageAsset } from "./floor-plan-image-storage.ts";
import {
  assignFloorReferenceImageToFloor,
  type FloorReferenceImageMetadataUpdateResult,
} from "./floor-reference-image-metadata.ts";

export interface AssociatePersistedFloorPlanUploadInput {
  floors: readonly Floor[];
  floorId: string;
  persistedUpload: Pick<StoredFloorPlanImageAsset, "assetRef" | "floorId">;
}

export interface AssociatedPersistedFloorPlanUploadResult
  extends FloorReferenceImageMetadataUpdateResult {
  persistedUpload: Pick<StoredFloorPlanImageAsset, "assetRef" | "floorId">;
}

export function associatePersistedFloorPlanUploadToFloor(
  input: AssociatePersistedFloorPlanUploadInput,
): AssociatedPersistedFloorPlanUploadResult {
  if (input.persistedUpload.floorId !== input.floorId) {
    throw new Error(
      `Persisted floor plan upload belongs to floor "${input.persistedUpload.floorId}", not "${input.floorId}".`,
    );
  }

  const association = assignFloorReferenceImageToFloor({
    floors: input.floors,
    floorId: input.floorId,
    referenceImageAssetRef: input.persistedUpload.assetRef,
  });

  return {
    ...association,
    persistedUpload: {
      floorId: input.persistedUpload.floorId,
      assetRef: input.persistedUpload.assetRef,
    },
  };
}
