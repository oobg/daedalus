import {
  type FloorPlanImageUploadValidationResult,
  validateFloorPlanImageUpload,
} from "./validate-floor-plan-image-upload.ts";

export type FloorPlanUploadState = {
  selectedFile: File | null;
  validation: FloorPlanImageUploadValidationResult;
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
  const validation = validateFloorPlanImageUpload(file);

  return {
    selectedFile: validation.ok ? validation.file : null,
    validation,
  };
}
