import type { Floor } from "../../domain/floor.ts";
import {
  replaceFloorReferenceImage as replaceFloorReferenceImageMetadata,
  type ReplaceFloorReferenceImageInput,
} from "./floor-reference-image-metadata.ts";

export function replaceFloorReferenceImage(
  input: ReplaceFloorReferenceImageInput,
): {
  floors: Floor[];
  floor: Floor;
} {
  return replaceFloorReferenceImageMetadata(input);
}
