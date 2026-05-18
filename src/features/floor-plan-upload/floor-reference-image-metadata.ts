import {
  assignFloorReferenceImage,
  type Floor,
} from "../../domain/floor.ts";

export interface AssignFloorReferenceImageToFloorInput {
  floors: readonly Floor[];
  floorId: string;
  referenceImageAssetRef: string;
}

export interface ReplaceFloorReferenceImageInput {
  floors: readonly Floor[];
  floorId: string;
  nextReferenceImage: string | null;
}

export interface ClearFloorReferenceImageInput {
  floors: readonly Floor[];
  floorId: string;
}

export interface FloorReferenceImageMetadataUpdateResult {
  floors: Floor[];
  floor: Floor;
}

export function assignFloorReferenceImageToFloor(
  input: AssignFloorReferenceImageToFloorInput,
): FloorReferenceImageMetadataUpdateResult {
  const floor = input.floors.find(({ id }) => id === input.floorId);

  if (floor == null) {
    throw new Error(`Floor "${input.floorId}" was not found.`);
  }

  if (floor.referenceImage != null) {
    throw new Error(
      `Floor "${input.floorId}" already has an associated reference image.`,
    );
  }

  return assignFloorReferenceImage(input.floors, {
    floorId: input.floorId,
    referenceImage: input.referenceImageAssetRef,
  });
}

export function replaceFloorReferenceImage(
  input: ReplaceFloorReferenceImageInput,
): FloorReferenceImageMetadataUpdateResult {
  return assignFloorReferenceImage(input.floors, {
    floorId: input.floorId,
    referenceImage: input.nextReferenceImage,
  });
}

export function clearFloorReferenceImage(
  input: ClearFloorReferenceImageInput,
): FloorReferenceImageMetadataUpdateResult {
  return assignFloorReferenceImage(input.floors, {
    floorId: input.floorId,
    referenceImage: null,
  });
}
