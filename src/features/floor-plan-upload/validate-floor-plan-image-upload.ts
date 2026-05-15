import { validateFloorPlanImageFileSize } from "./validate-floor-plan-image-file-size.ts";

export const ACCEPTED_FLOOR_PLAN_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

export const ACCEPTED_FLOOR_PLAN_IMAGE_EXTENSIONS = [
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
] as const;

export type FloorPlanImageUploadValidationCode =
  | "valid"
  | "missing_file"
  | "invalid_file_instance"
  | "empty_file"
  | "unsupported_type"
  | "file_too_large";

export type FloorPlanImageUploadValidationResult =
  | {
      ok: true;
      code: "valid";
      message: string;
      file: File;
    }
  | {
      ok: false;
      code: Exclude<FloorPlanImageUploadValidationCode, "valid">;
      message: string;
    };

function getNormalizedFileExtension(fileName: string): string | null {
  const lastDotIndex = fileName.lastIndexOf(".");

  if (lastDotIndex < 0 || lastDotIndex === fileName.length - 1) {
    return null;
  }

  return fileName.slice(lastDotIndex).toLowerCase();
}

export function isSupportedFloorPlanImageFileType(
  file: Pick<File, "name" | "type">,
): boolean {
  const normalizedMimeType = file.type.toLowerCase();
  const normalizedExtension = getNormalizedFileExtension(file.name);

  return (
    ACCEPTED_FLOOR_PLAN_IMAGE_TYPES.includes(normalizedMimeType as never) ||
    (normalizedExtension != null &&
      ACCEPTED_FLOOR_PLAN_IMAGE_EXTENSIONS.includes(normalizedExtension as never))
  );
}

export function validateFloorPlanImageUpload(
  file: File | null | undefined,
): FloorPlanImageUploadValidationResult {
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

  if (!isSupportedFloorPlanImageFileType(file)) {
    return {
      ok: false,
      code: "unsupported_type",
      message: "Unsupported file type. Use PNG, JPG, JPEG, or WebP.",
    };
  }

  const sizeValidation = validateFloorPlanImageFileSize(file);

  if (!sizeValidation.ok) {
    return {
      ok: false,
      code: sizeValidation.code,
      message: sizeValidation.message,
    };
  }

  return {
    ok: true,
    code: "valid",
    message: "Floor plan image accepted.",
    file,
  };
}
