import type { Floor } from "../../domain/floor.ts";
import {
  loadStoredFloorPlanImageMetadata,
  type FloorPlanImageStorage,
  type StoredFloorPlanImageAssetMetadata,
} from "./floor-plan-image-storage.ts";

export interface DeriveStoredFloorPlanReferenceMetadataInput {
  floors: readonly Floor[];
  floorId: string;
}

export type DeriveStoredFloorPlanReferenceMetadataResult =
  | {
      ok: true;
      code: "derived";
      metadata: Readonly<StoredFloorPlanImageAssetMetadata>;
    }
  | {
      ok: false;
      code: "missing_reference_image" | "missing_reference_image_asset";
      message: string;
    };

export function deriveStoredFloorPlanReferenceMetadata(
  input: DeriveStoredFloorPlanReferenceMetadataInput,
  storage: FloorPlanImageStorage,
): DeriveStoredFloorPlanReferenceMetadataResult {
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

  const metadata = loadStoredFloorPlanImageMetadata(floor.referenceImage, storage);

  if (metadata == null) {
    return {
      ok: false,
      code: "missing_reference_image_asset",
      message: `Floor "${input.floorId}" references a floor plan image asset that is unavailable in storage.`,
    };
  }

  return Object.freeze({
    ok: true,
    code: "derived",
    metadata,
  });
}
