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
