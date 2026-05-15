import {
  saveAcceptedFloorPlanImage,
  type FloorPlanImageStorage,
  type StoredFloorPlanImageAsset,
} from "./floor-plan-image-storage.ts";
import { validateFloorPlanUploadPayload } from "./validate-floor-plan-upload-payload.ts";

export interface CreateFloorPlanImageAssetInput {
  projectId: string;
  floorId: string;
  upload: File | null | undefined;
}

export async function createFloorPlanImageAsset(
  input: CreateFloorPlanImageAssetInput,
  storage: FloorPlanImageStorage,
): Promise<StoredFloorPlanImageAsset> {
  const validation = validateFloorPlanUploadPayload(input);

  if (!validation.ok) {
    throw new Error(
      `Cannot create floor plan image asset: ${validation.code} (${validation.message})`,
    );
  }

  return saveAcceptedFloorPlanImage(
    {
      projectId: validation.value.projectId,
      floorId: validation.value.floorId,
      file: validation.value.upload,
    },
    storage,
  );
}
