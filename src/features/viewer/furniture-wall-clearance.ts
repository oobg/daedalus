import {
  resolveFurnitureFootprintClearance,
  type Viewer25DPlacementBounds,
  type Viewer25DPoint2D,
} from "../../components/viewer/viewer25dGeometry.ts";

const CLEARANCE_EPSILON = 1e-6;

export type FurnitureWallClearanceValidationReason =
  | "clear"
  | "intersects-clearance-zone"
  | "room-too-tight";

export interface FurnitureWallClearanceValidationResult {
  isValid: boolean;
  reason: FurnitureWallClearanceValidationReason;
  minimumWallClearance: number;
  placementBounds: Viewer25DPlacementBounds | null;
  safeInteriorFootprint: Viewer25DPoint2D[];
  suggestedFootprint: Viewer25DPoint2D[] | null;
}

export function validateFurnitureWallClearance(
  roomPolygon: readonly Viewer25DPoint2D[],
  furnitureFootprint: readonly Viewer25DPoint2D[],
  minimumWallClearance: number,
): FurnitureWallClearanceValidationResult {
  const clearance = resolveFurnitureFootprintClearance(
    roomPolygon,
    furnitureFootprint,
    minimumWallClearance,
  );

  if (!clearance.fitsWithinClearance || clearance.adjustedFootprint == null) {
    return {
      isValid: false,
      reason: "room-too-tight",
      minimumWallClearance,
      placementBounds: clearance.placementBounds,
      safeInteriorFootprint: clearance.safeInteriorFootprint,
      suggestedFootprint: clearance.adjustedFootprint,
    };
  }

  if (footprintsMatch(furnitureFootprint, clearance.adjustedFootprint)) {
    return {
      isValid: true,
      reason: "clear",
      minimumWallClearance,
      placementBounds: clearance.placementBounds,
      safeInteriorFootprint: clearance.safeInteriorFootprint,
      suggestedFootprint: clearance.adjustedFootprint,
    };
  }

  return {
    isValid: false,
    reason: "intersects-clearance-zone",
    minimumWallClearance,
    placementBounds: clearance.placementBounds,
    safeInteriorFootprint: clearance.safeInteriorFootprint,
    suggestedFootprint: clearance.adjustedFootprint,
  };
}

function footprintsMatch(
  left: readonly Viewer25DPoint2D[],
  right: readonly Viewer25DPoint2D[],
): boolean {
  if (left.length !== right.length) {
    return false;
  }

  for (let index = 0; index < left.length; index += 1) {
    if (
      Math.abs(left[index].x - right[index].x) > CLEARANCE_EPSILON ||
      Math.abs(left[index].y - right[index].y) > CLEARANCE_EPSILON
    ) {
      return false;
    }
  }

  return true;
}
