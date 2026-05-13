import {
  type FloorPlanImageValidationResult,
  validateFloorPlanImageFile,
} from "./validate-floor-plan-image-file.ts";

export type FloorPlanUploadState = {
  selectedFile: File | null;
  validation: FloorPlanImageValidationResult;
};

export function createInitialFloorPlanUploadState(): FloorPlanUploadState {
  return {
    selectedFile: null,
    validation: {
      ok: false,
      code: "missing_file",
      message: "Select a floor plan image file to continue.",
    },
  };
}

export function validateFloorPlanImageSelection(
  file: File | null | undefined,
): FloorPlanUploadState {
  const validation = validateFloorPlanImageFile(file);

  return {
    selectedFile: validation.ok ? validation.file : null,
    validation,
  };
}
