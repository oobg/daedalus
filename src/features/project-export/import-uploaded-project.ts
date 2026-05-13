import {
  PROJECT_EXPORT_FORMAT_VERSION,
  type ProjectExportEnvelope,
  type ProjectExportMetadata,
} from "./export-schema.ts";
import {
  parseUploadedProjectJson,
  type UploadedProjectJsonParseError,
} from "./parse-uploaded-project-json.ts";
import {
  type SerializedProjectData,
} from "./project-serializer.ts";
import {
  validateUploadedProjectSchema,
  type ProjectSchemaValidationError,
} from "./validate-uploaded-project-schema.ts";

export interface UploadedProjectEnvelopeError {
  code:
    | "invalid_project_envelope"
    | "unsupported_project_export_version"
    | "project_metadata_mismatch";
  message: string;
}

export type ImportUploadedProjectResult =
  | {
      ok: true;
      value: SerializedProjectData;
    }
  | {
      ok: false;
      stage: "parse";
      error: UploadedProjectJsonParseError;
    }
  | {
      ok: false;
      stage: "envelope";
      error: UploadedProjectEnvelopeError;
    }
  | {
      ok: false;
      stage: "schema";
      errors: ProjectSchemaValidationError[];
    };

export function importUploadedProject(
  content: string,
): ImportUploadedProjectResult {
  const parsed = parseUploadedProjectJson(content);

  if (!parsed.ok) {
    return {
      ok: false,
      stage: "parse",
      error: parsed.error,
    };
  }

  const extractedProject = extractProjectFromUpload(parsed.value);

  if (!extractedProject.ok) {
    return extractedProject;
  }

  const validated = validateUploadedProjectSchema(extractedProject.value);

  if (!validated.ok) {
    return {
      ok: false,
      stage: "schema",
      errors: validated.errors,
    };
  }

  return {
    ok: true,
    value: validated.value,
  };
}

function extractProjectFromUpload(
  value: Record<string, unknown>,
):
  | {
      ok: true;
      value: Record<string, unknown>;
    }
  | {
      ok: false;
      stage: "envelope";
      error: UploadedProjectEnvelopeError;
    } {
  const looksLikeEnvelope =
    "project" in value ||
    "exportFormatVersion" in value ||
    "exportedAt" in value ||
    "projectMetadata" in value;

  if (!looksLikeEnvelope) {
    return {
      ok: true,
      value,
    };
  }

  if (!isValidProjectExportEnvelope(value)) {
    return {
      ok: false,
      stage: "envelope",
      error: {
        code: "invalid_project_envelope",
        message:
          "Uploaded project export must include exportFormatVersion, exportedAt, projectMetadata, and a top-level project object.",
      },
    };
  }

  if (value.exportFormatVersion !== PROJECT_EXPORT_FORMAT_VERSION) {
    return {
      ok: false,
      stage: "envelope",
      error: {
        code: "unsupported_project_export_version",
        message: `Uploaded project export version ${String(value.exportFormatVersion)} is not supported. Expected version ${PROJECT_EXPORT_FORMAT_VERSION}.`,
      },
    };
  }

  if (
    value.project.projectId !== value.projectMetadata.projectId ||
    value.project.projectName !== value.projectMetadata.projectName ||
    value.project.objectVersion !== value.projectMetadata.objectVersion
  ) {
    return {
      ok: false,
      stage: "envelope",
      error: {
        code: "project_metadata_mismatch",
        message:
          "Uploaded project export metadata does not match the embedded project payload.",
      },
    };
  }

  return {
    ok: true,
    value: value.project,
  };
}

function isValidProjectExportEnvelope(
  value: unknown,
): value is ProjectExportEnvelope<Record<string, unknown> & ProjectExportMetadata> {
  if (!isPlainObject(value)) return false;
  return (
    typeof value.exportFormatVersion === "number" &&
    typeof value.exportedAt === "string" &&
    isPlainObject(value.projectMetadata) &&
    typeof value.projectMetadata.projectId === "string" &&
    typeof value.projectMetadata.projectName === "string" &&
    typeof value.projectMetadata.objectVersion === "number" &&
    isPlainObject(value.project) &&
    typeof value.project.projectId === "string" &&
    typeof value.project.projectName === "string" &&
    typeof value.project.objectVersion === "number"
  );
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value != null && !Array.isArray(value) && typeof value === "object";
}
