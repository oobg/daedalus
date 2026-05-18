export const ACCEPTED_UPLOADED_PROJECT_FILE_TYPES = [
  "application/json",
  "text/json",
] as const;

export const ACCEPTED_UPLOADED_PROJECT_FILE_EXTENSIONS = [".json"] as const;

export type UploadedProjectFileValidationCode =
  | "valid"
  | "missing_file"
  | "invalid_file_instance"
  | "empty_file"
  | "unsupported_type";

export type UploadedProjectFileValidationResult =
  | {
      ok: true;
      code: "valid";
      message: string;
      file: File;
    }
  | {
      ok: false;
      code: Exclude<UploadedProjectFileValidationCode, "valid">;
      message: string;
    };

function getNormalizedFileExtension(fileName: string): string | null {
  const lastDotIndex = fileName.lastIndexOf(".");

  if (lastDotIndex < 0 || lastDotIndex === fileName.length - 1) {
    return null;
  }

  return fileName.slice(lastDotIndex).toLowerCase();
}

export function isSupportedUploadedProjectFileType(
  file: Pick<File, "name" | "type">,
): boolean {
  const normalizedMimeType = file.type.toLowerCase();
  const normalizedExtension = getNormalizedFileExtension(file.name);

  return (
    ACCEPTED_UPLOADED_PROJECT_FILE_TYPES.includes(normalizedMimeType as never) ||
    (normalizedExtension != null &&
      ACCEPTED_UPLOADED_PROJECT_FILE_EXTENSIONS.includes(
        normalizedExtension as never,
      ))
  );
}

export function validateUploadedProjectFile(
  file: File | null | undefined,
): UploadedProjectFileValidationResult {
  if (file == null) {
    return {
      ok: false,
      code: "missing_file",
      message: "Select a JSON project file to continue.",
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

  if (!isSupportedUploadedProjectFileType(file)) {
    return {
      ok: false,
      code: "unsupported_type",
      message: "Unsupported file type. Use a JSON project file.",
    };
  }

  return {
    ok: true,
    code: "valid",
    message: "Project file accepted.",
    file,
  };
}
