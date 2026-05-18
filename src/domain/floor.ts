import {
  validateFloorHeightValue,
  type FloorHeightValidationError,
} from "./floor-height.ts";

export const DEFAULT_FLOOR_HEIGHT = 3;

export interface Floor {
  id: string;
  name: string;
  height: number;
  referenceImage: string | null;
}

export interface FloorInput {
  id: string;
  name: string;
  height?: number;
  referenceImage?: string | null;
}

export interface SerializedFloor {
  id: string;
  name: string;
  height: number;
  referenceImage: string | null;
}

export interface FloorVerticalPlacement {
  floorId: string;
  offset: number;
  height: number;
}

export interface FloorBaseElevation {
  floorId: string;
  baseElevation: number;
}

export type FloorHeightInput = number | string;

export type UpdateFloorHeightResult =
  | {
      ok: true;
      floors: Floor[];
      floor: Floor;
    }
  | {
      ok: false;
      error: FloorHeightValidationError;
    };

export interface AssignFloorReferenceImageInput {
  floorId: string;
  referenceImage: string | null;
}

export const MIN_FLOOR_HEIGHT = 0;

export function createFloor(input: FloorInput): Floor {
  const height = input.height ?? DEFAULT_FLOOR_HEIGHT;
  assertValidFloorHeight(height);

  return {
    id: input.id,
    name: input.name,
    height,
    referenceImage: input.referenceImage ?? null,
  };
}

export function normalizeFloor(input: FloorInput): Floor {
  return createFloor(input);
}

export function deserializeFloor(input: SerializedFloor | FloorInput): Floor {
  return createFloor(input);
}

export function serializeFloor(floor: Floor): SerializedFloor {
  return {
    id: floor.id,
    name: floor.name,
    height: floor.height,
    referenceImage: floor.referenceImage,
  };
}

export function parseFloorHeightInput(
  input: FloorHeightInput,
): number | FloorHeightValidationError {
  const result = validateFloorHeightValue(input);

  return result.ok ? result.value : result.error;
}

function assertValidFloorHeight(height: number): void {
  const parsedHeight = parseFloorHeightInput(height);

  if (typeof parsedHeight !== "number") {
    throw new Error(parsedHeight.message);
  }
}

export function getFloorVerticalOffset(
  floors: readonly Floor[],
  floorId: string,
): number {
  let offset = 0;

  for (const floor of floors) {
    if (floor.id === floorId) {
      return offset;
    }

    offset += floor.height;
  }

  throw new Error(`Floor "${floorId}" was not found.`);
}

export function resolveFloorBaseElevations(
  floors: readonly Floor[],
): FloorBaseElevation[] {
  let baseElevation = 0;

  return floors.map((floor) => {
    const resolvedBaseElevation = {
      floorId: floor.id,
      baseElevation: roundFloorElevation(baseElevation),
    };

    baseElevation += floor.height;

    return resolvedBaseElevation;
  });
}

export function resolveFloorVerticalPlacements(
  floors: readonly Floor[],
): FloorVerticalPlacement[] {
  const baseElevationsByFloorId = new Map(
    resolveFloorBaseElevations(floors).map((placement) => [
      placement.floorId,
      placement.baseElevation,
    ]),
  );

  return floors.map((floor) => ({
    floorId: floor.id,
    offset: baseElevationsByFloorId.get(floor.id) ?? 0,
    height: floor.height,
  }));
}

export function updateFloorHeight(
  floors: readonly Floor[],
  floorId: string,
  heightInput: FloorHeightInput,
): UpdateFloorHeightResult {
  const parsedHeight = parseFloorHeightInput(heightInput);

  if (typeof parsedHeight !== "number") {
    return {
      ok: false,
      error: parsedHeight,
    };
  }

  let updatedFloor: Floor | null = null;
  const nextFloors = floors.map((floor) => {
    if (floor.id !== floorId) {
      return floor;
    }

    updatedFloor = {
      ...floor,
      height: parsedHeight,
    };

    return updatedFloor;
  });

  if (updatedFloor === null) {
    throw new Error(`Floor "${floorId}" was not found.`);
  }

  return {
    ok: true,
    floors: nextFloors,
    floor: updatedFloor,
  };
}

export function assignFloorReferenceImage(
  floors: readonly Floor[],
  input: AssignFloorReferenceImageInput,
): {
  floors: Floor[];
  floor: Floor;
} {
  let updatedFloor: Floor | null = null;

  const nextFloors = floors.map((floor) => {
    if (floor.id !== input.floorId) {
      return floor;
    }

    updatedFloor = {
      ...floor,
      referenceImage: input.referenceImage,
    };

    return updatedFloor;
  });

  if (updatedFloor === null) {
    throw new Error(`Floor "${input.floorId}" was not found.`);
  }

  return {
    floors: nextFloors,
    floor: updatedFloor,
  };
}

function roundFloorElevation(value: number): number {
  return Number(value.toFixed(6));
}
