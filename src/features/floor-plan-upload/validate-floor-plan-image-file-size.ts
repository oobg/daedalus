export const MAX_FLOOR_PLAN_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

export type FloorPlanImageFileSizeValidationResult =
  | {
      ok: true;
      code: "within_size_limit";
      message: string;
      maxSizeBytes: number;
      fileSizeBytes: number;
    }
  | {
      ok: false;
      code: "file_too_large";
      message: string;
      maxSizeBytes: number;
      fileSizeBytes: number;
    };

export function validateFloorPlanImageFileSize(
  file: Pick<File, "size">,
  maxSizeBytes = MAX_FLOOR_PLAN_IMAGE_SIZE_BYTES,
): FloorPlanImageFileSizeValidationResult {
  if (file.size > maxSizeBytes) {
    return {
      ok: false,
      code: "file_too_large",
      message: "The selected file exceeds the 10 MB upload limit.",
      maxSizeBytes,
      fileSizeBytes: file.size,
    };
  }

  return {
    ok: true,
    code: "within_size_limit",
    message: "The selected file is within the upload size limit.",
    maxSizeBytes,
    fileSizeBytes: file.size,
  };
}
