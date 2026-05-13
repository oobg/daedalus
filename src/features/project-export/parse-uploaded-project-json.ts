export interface UploadedProjectJsonParseError {
  code: "invalid_project_json" | "invalid_project_json_root";
  message: string;
}

export type UploadedProjectJsonParseResult =
  | {
      ok: true;
      value: Record<string, unknown>;
    }
  | {
      ok: false;
      error: UploadedProjectJsonParseError;
    };

export function parseUploadedProjectJson(
  content: string,
): UploadedProjectJsonParseResult {
  try {
    const parsed = JSON.parse(stripUtf8Bom(content)) as unknown;

    if (parsed == null || Array.isArray(parsed) || typeof parsed !== "object") {
      return {
        ok: false,
        error: {
          code: "invalid_project_json_root",
          message: "Uploaded project JSON must contain a top-level object.",
        },
      };
    }

    return {
      ok: true,
      value: parsed as Record<string, unknown>,
    };
  } catch (error) {
    const detail =
      error instanceof Error && error.message.trim().length > 0
        ? ` ${error.message}`
        : "";

    return {
      ok: false,
      error: {
        code: "invalid_project_json",
        message: `Uploaded project JSON is malformed and could not be parsed.${detail}`,
      },
    };
  }
}

function stripUtf8Bom(content: string): string {
  return content.replace(/^\uFEFF/, "");
}
