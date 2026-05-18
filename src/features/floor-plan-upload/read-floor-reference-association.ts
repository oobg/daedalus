import type { Floor } from "../../domain/floor.ts";

export interface ReadFloorReferenceAssociationInput {
  floors: readonly Floor[];
  floorId: string;
}

export function readFloorReferenceAssociation(
  input: ReadFloorReferenceAssociationInput,
): string | null {
  const floor = input.floors.find(({ id }) => id === input.floorId);

  if (floor == null) {
    throw new Error(`Floor "${input.floorId}" was not found.`);
  }

  return floor.referenceImage;
}
