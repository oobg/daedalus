export const ACCEPTED_FLOOR_PLAN_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

const MAX_FLOOR_PLAN_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

export type FloorPlanImageValidationCode =
  | "valid"
  | "missing_file"
  | "invalid_file_instance"
  | "empty_file"
  | "unsupported_type"
  | "file_too_large";

export type FloorPlanImageValidationResult =
  | {
      ok: true;
      code: "valid";
      message: string;
      file: File;
    }
  | {
      ok: false;
      code: Exclude<FloorPlanImageValidationCode, "valid">;
      message: string;
    };

export function validateFloorPlanImageFile(
  file: File | null | undefined,
): FloorPlanImageValidationResult {
  if (file == null) {
    return {
      ok: false,
      code: "missing_file",
      message: "Select a floor plan image file to continue.",
    };
  }

  if (!(file instanceof File)) {
    return {
      ok: false,
      code: "invalid_file_instance",
      message: "The selected upload is not a valid file object.",
    };
  }

  if (file.size === 0) {
    return {
      ok: false,
      code: "empty_file",
      message: "The selected file is empty.",
    };
  }

  if (!ACCEPTED_FLOOR_PLAN_IMAGE_TYPES.includes(file.type as never)) {
    return {
      ok: false,
      code: "unsupported_type",
      message: "Unsupported file type. Use PNG, JPEG, or WebP.",
    };
  }

  if (file.size > MAX_FLOOR_PLAN_IMAGE_SIZE_BYTES) {
    return {
      ok: false,
      code: "file_too_large",
      message: "The selected file exceeds the 10 MB upload limit.",
    };
  }

  return {
    ok: true,
    code: "valid",
    message: "Floor plan image accepted.",
    file,
  };
}
