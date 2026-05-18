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
  | "invalid_image_content"
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

export async function validateFloorPlanImageUpload(
  file: File | null | undefined,
): Promise<FloorPlanImageUploadValidationResult> {
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

  if (!(await hasValidFloorPlanImageContent(file))) {
    return {
      ok: false,
      code: "invalid_image_content",
      message:
        "The selected file could not be validated as a supported PNG, JPG, JPEG, or WebP image.",
    };
  }

  return {
    ok: true,
    code: "valid",
    message: "Floor plan image accepted.",
    file,
  };
}

async function hasValidFloorPlanImageContent(file: File): Promise<boolean> {
  const bytes = new Uint8Array(await file.arrayBuffer());

  return (
    hasValidPngSignature(bytes) ||
    hasValidJpegSignature(bytes) ||
    hasValidWebpSignature(bytes)
  );
}

function hasValidPngSignature(bytes: Uint8Array): boolean {
  const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

  if (bytes.length < 12) {
    return false;
  }

  return pngSignature.every((byte, index) => bytes[index] === byte);
}

function hasValidJpegSignature(bytes: Uint8Array): boolean {
  if (bytes.length < 4) {
    return false;
  }

  return (
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[bytes.length - 2] === 0xff &&
    bytes[bytes.length - 1] === 0xd9
  );
}

function hasValidWebpSignature(bytes: Uint8Array): boolean {
  if (bytes.length < 12) {
    return false;
  }

  return (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  );
}
