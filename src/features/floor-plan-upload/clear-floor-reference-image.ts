import {
  assignFloorReferenceImage,
  type Floor,
} from "../../domain/floor.ts";

export interface ClearFloorReferenceImageInput {
  floors: readonly Floor[];
  floorId: string;
}

export function clearFloorReferenceImage(
  input: ClearFloorReferenceImageInput,
): {
  floors: Floor[];
  floor: Floor;
} {
  return assignFloorReferenceImage(input.floors, {
    floorId: input.floorId,
    referenceImage: null,
  });
}
