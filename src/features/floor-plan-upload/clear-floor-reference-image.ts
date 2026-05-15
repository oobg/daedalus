import type { Floor } from "../../domain/floor.ts";
import {
  clearFloorReferenceImage as clearFloorReferenceImageMetadata,
  type ClearFloorReferenceImageInput,
} from "./floor-reference-image-metadata.ts";

export function clearFloorReferenceImage(
  input: ClearFloorReferenceImageInput,
): {
  floors: Floor[];
  floor: Floor;
} {
  return clearFloorReferenceImageMetadata(input);
}
