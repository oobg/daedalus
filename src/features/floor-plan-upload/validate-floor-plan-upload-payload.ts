import {
  validateFloorPlanImageUpload,
  type FloorPlanImageUploadValidationCode,
} from "./validate-floor-plan-image-upload.ts";

export type FloorPlanUploadPayloadValidationCode =
  | "valid"
  | "invalid_project_id"
  | "invalid_floor_id"
  | Exclude<FloorPlanImageUploadValidationCode, "valid">;

export interface FloorPlanUploadPayload {
  projectId: string;
  floorId: string;
  upload: File | null | undefined;
}

export type FloorPlanUploadPayloadValidationResult =
  | {
      ok: true;
      code: "valid";
      message: string;
      value: {
        projectId: string;
        floorId: string;
        upload: File;
      };
    }
  | {
      ok: false;
      code: Exclude<FloorPlanUploadPayloadValidationCode, "valid">;
      message: string;
    };

export async function validateFloorPlanUploadPayload(
  payload: FloorPlanUploadPayload,
): Promise<FloorPlanUploadPayloadValidationResult> {
  const projectId = payload.projectId.trim();

  if (projectId.length === 0) {
    return {
      ok: false,
      code: "invalid_project_id",
      message: "A project id is required before saving a floor plan upload.",
    };
  }

  const floorId = payload.floorId.trim();

  if (floorId.length === 0) {
    return {
      ok: false,
      code: "invalid_floor_id",
      message: "A floor id is required before saving a floor plan upload.",
    };
  }

  const uploadValidation = await validateFloorPlanImageUpload(payload.upload);

  if (!uploadValidation.ok) {
    return uploadValidation;
  }

  return {
    ok: true,
    code: "valid",
    message: "Floor upload payload accepted.",
    value: {
      projectId,
      floorId,
      upload: uploadValidation.file,
    },
  };
}
