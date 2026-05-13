import {
  assignFloorReferenceImage,
  type Floor,
} from "../../domain/floor.ts";

export interface ReplaceFloorReferenceImageInput {
  floors: readonly Floor[];
  floorId: string;
  nextReferenceImage: string | null;
}

export function replaceFloorReferenceImage(
  input: ReplaceFloorReferenceImageInput,
): {
  floors: Floor[];
  floor: Floor;
} {
  return assignFloorReferenceImage(input.floors, {
    floorId: input.floorId,
    referenceImage: input.nextReferenceImage,
  });
}
