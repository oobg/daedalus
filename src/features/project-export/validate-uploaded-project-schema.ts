import type {
  SerializedProjectData,
} from "./project-serializer.ts";
import { DEFAULT_FLOOR_HEIGHT } from "../../domain/floor.ts";

export type ProjectSchemaValidationErrorCode =
  | "missing_field"
  | "invalid_field"
  | "unexpected_field";

export interface ProjectSchemaValidationError {
  code: ProjectSchemaValidationErrorCode;
  path: string;
  message: string;
}

export type ValidateUploadedProjectSchemaResult =
  | {
      ok: true;
      value: SerializedProjectData;
    }
  | {
      ok: false;
      errors: ProjectSchemaValidationError[];
    };

type ValidationContext = {
  errors: ProjectSchemaValidationError[];
};

type Validator = (value: unknown, path: string, context: ValidationContext) => void;
type OptionalValidator = Validator & { optional: true };

const ASSET_TYPES = new Set([
  "reference-image",
  "icon",
  "texture",
  "document",
]);

const ANNOTATION_TYPES = new Set(["label", "note", "arrow", "warning"]);
const EDITOR_TOOLS = new Set(["select", "room", "opening", "annotation"]);

export function validateUploadedProjectSchema(
  value: Record<string, unknown>,
): ValidateUploadedProjectSchemaResult {
  const context: ValidationContext = {
    errors: [],
  };

  validateProject(value, "project", context);

  if (context.errors.length > 0) {
    return {
      ok: false,
      errors: context.errors,
    };
  }

  return {
    ok: true,
    value: normalizeUploadedProjectSchemaDefaults(
      value,
    ) as unknown as SerializedProjectData,
  };
}

function validateProject(
  value: unknown,
  path: string,
  context: ValidationContext,
): void {
  validateObject(
    value,
    path,
    context,
    {
      projectId: validateString,
      projectName: validateString,
      objectVersion: validateNumber,
      floors: (member, memberPath, memberContext) =>
        validateArray(member, memberPath, memberContext, validateFloor),
      viewState: validateViewState,
      assets: (member, memberPath, memberContext) =>
        validateArray(member, memberPath, memberContext, validateAsset),
      annotations: (member, memberPath, memberContext) =>
        validateArray(member, memberPath, memberContext, validateAnnotation),
      editorConfig: validateEditorConfig,
    },
  );
}

function validateFloor(
  value: unknown,
  path: string,
  context: ValidationContext,
): void {
  validateObject(
    value,
    path,
    context,
    {
      floorId: validateString,
      floorName: validateString,
      floorHeight: optional(validatePositiveNumber),
      referenceImage: validateNullableString,
      rooms: (member, memberPath, memberContext) =>
        validateArray(member, memberPath, memberContext, validateRoom),
      verticalConnectors: (member, memberPath, memberContext) =>
        validateArray(
          member,
          memberPath,
          memberContext,
          validateVerticalConnector,
        ),
    },
  );
}

function validateRoom(
  value: unknown,
  path: string,
  context: ValidationContext,
): void {
  validateObject(
    value,
    path,
    context,
    {
      roomId: validateString,
      roomName: validateString,
      roomPolygon: (member, memberPath, memberContext) =>
        validateArray(member, memberPath, memberContext, validatePoint),
      sharedBoundaries: (member, memberPath, memberContext) =>
        validateArray(member, memberPath, memberContext, validateSharedBoundary),
      area: validateNumber,
      labelPosition: validatePoint,
      walls: (member, memberPath, memberContext) =>
        validateArray(member, memberPath, memberContext, validateWall),
      openings: (member, memberPath, memberContext) =>
        validateArray(member, memberPath, memberContext, validateOpening),
    },
  );
}

function validateSharedBoundary(
  value: unknown,
  path: string,
  context: ValidationContext,
): void {
  validateObject(
    value,
    path,
    context,
    {
      edgeId: validateString,
      adjacentRoomId: validateString,
      adjacentEdgeId: validateString,
    },
  );
}

function validateOpening(
  value: unknown,
  path: string,
  context: ValidationContext,
): void {
  validateObject(
    value,
    path,
    context,
    {
      openingId: validateString,
      openingType: validateString,
      attachedEdgeId: validateString,
      edgeRelativePosition: validateNumber,
    },
  );
}

function validateWall(
  value: unknown,
  path: string,
  context: ValidationContext,
): void {
  validateObject(
    value,
    path,
    context,
    {
      edgeId: validateString,
      start: validatePoint,
      end: validatePoint,
    },
  );
}

function validateVerticalConnector(
  value: unknown,
  path: string,
  context: ValidationContext,
): void {
  validateObject(
    value,
    path,
    context,
    {
      connectorId: validateString,
      connectorType: validateString,
      roomId: validateString,
      targetFloorId: validateString,
      position: validatePoint,
    },
  );
}

function validateViewState(
  value: unknown,
  path: string,
  context: ValidationContext,
): void {
  validateObject(
    value,
    path,
    context,
    {
      activeFloorId: validateString,
      zoom: validateNumber,
      pan: validatePoint,
      uploadedProjectName: optional(validateNullableString),
    },
  );
}

function validateAsset(
  value: unknown,
  path: string,
  context: ValidationContext,
): void {
  validateObject(
    value,
    path,
    context,
    {
      assetId: validateString,
      assetType: (member, memberPath, memberContext) =>
        validateStringEnum(member, memberPath, memberContext, ASSET_TYPES),
      floorId: validateNullableString,
      fileName: validateString,
      mimeType: validateString,
      size: validateNumber,
      storageKey: validateString,
      assetRef: validateString,
    },
  );
}

function validateAnnotation(
  value: unknown,
  path: string,
  context: ValidationContext,
): void {
  validateObject(
    value,
    path,
    context,
    {
      annotationId: validateString,
      floorId: validateString,
      annotationType: (member, memberPath, memberContext) =>
        validateStringEnum(member, memberPath, memberContext, ANNOTATION_TYPES),
      text: validateString,
      targetRoomId: validateNullableString,
      position: validatePoint,
      color: validateString,
      isVisible: validateBoolean,
    },
  );
}

function validateEditorConfig(
  value: unknown,
  path: string,
  context: ValidationContext,
): void {
  validateObject(
    value,
    path,
    context,
    {
      selectedTool: (member, memberPath, memberContext) =>
        validateStringEnum(member, memberPath, memberContext, EDITOR_TOOLS),
      snapToGrid: validateBoolean,
      gridSize: validateNumber,
      showGrid: validateBoolean,
      showReferenceImages: validateBoolean,
      showRoomLabels: validateBoolean,
    },
  );
}

function validatePoint(
  value: unknown,
  path: string,
  context: ValidationContext,
): void {
  validateObject(
    value,
    path,
    context,
    {
      x: validateNumber,
      y: validateNumber,
    },
  );
}

function validateObject(
  value: unknown,
  path: string,
  context: ValidationContext,
  schema: Record<string, Validator>,
): void {
  if (!isPlainObject(value)) {
    pushInvalidFieldError(context, path, "object", value);
    return;
  }

  const entries = value as Record<string, unknown>;

  for (const key of Object.keys(schema)) {
    if (!(key in entries)) {
      if (isOptionalValidator(schema[key])) {
        continue;
      }

      context.errors.push({
        code: "missing_field",
        path: `${path}.${key}`,
        message: `Missing required field "${key}".`,
      });
      continue;
    }

    schema[key](entries[key], `${path}.${key}`, context);
  }

  for (const key of Object.keys(entries)) {
    if (key in schema) {
      continue;
    }

    context.errors.push({
      code: "unexpected_field",
      path: `${path}.${key}`,
      message: `Unexpected field "${key}".`,
    });
  }
}

function validateArray(
  value: unknown,
  path: string,
  context: ValidationContext,
  itemValidator: Validator,
): void {
  if (!Array.isArray(value)) {
    pushInvalidFieldError(context, path, "array", value);
    return;
  }

  value.forEach((item, index) => {
    itemValidator(item, `${path}[${index}]`, context);
  });
}

function validateString(
  value: unknown,
  path: string,
  context: ValidationContext,
): void {
  if (typeof value !== "string") {
    pushInvalidFieldError(context, path, "string", value);
  }
}

function validateNullableString(
  value: unknown,
  path: string,
  context: ValidationContext,
): void {
  if (value !== null && typeof value !== "string") {
    pushInvalidFieldError(context, path, "string | null", value);
  }
}

function validateNumber(
  value: unknown,
  path: string,
  context: ValidationContext,
): void {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    pushInvalidFieldError(context, path, "finite number", value);
  }
}

function validatePositiveNumber(
  value: unknown,
  path: string,
  context: ValidationContext,
): void {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    pushInvalidFieldError(context, path, "positive finite number", value);
  }
}

function validateBoolean(
  value: unknown,
  path: string,
  context: ValidationContext,
): void {
  if (typeof value !== "boolean") {
    pushInvalidFieldError(context, path, "boolean", value);
  }
}

function validateStringEnum(
  value: unknown,
  path: string,
  context: ValidationContext,
  allowedValues: ReadonlySet<string>,
): void {
  if (typeof value !== "string" || !allowedValues.has(value)) {
    const expected = Array.from(allowedValues).map((item) => `"${item}"`).join(", ");
    context.errors.push({
      code: "invalid_field",
      path,
      message: `Expected one of ${expected}, received ${describeValue(value)}.`,
    });
  }
}

function optional(validator: Validator): OptionalValidator {
  const wrappedValidator: OptionalValidator = Object.assign(
    (value: unknown, path: string, context: ValidationContext) => {
      validator(value, path, context);
    },
    { optional: true as const },
  );

  return wrappedValidator;
}

function isOptionalValidator(validator: Validator): validator is OptionalValidator {
  return "optional" in validator && validator.optional === true;
}

function normalizeUploadedProjectSchemaDefaults(
  value: Record<string, unknown>,
): Record<string, unknown> {
  const floors = value.floors;

  if (!Array.isArray(floors)) {
    return value;
  }

  return {
    ...value,
    floors: floors.map((floor) => {
      if (!isPlainObject(floor) || "floorHeight" in floor) {
        return floor;
      }

      return {
        ...floor,
        floorHeight: DEFAULT_FLOOR_HEIGHT,
      };
    }),
  };
}

function pushInvalidFieldError(
  context: ValidationContext,
  path: string,
  expected: string,
  received: unknown,
): void {
  context.errors.push({
    code: "invalid_field",
    path,
    message: `Expected ${expected}, received ${describeValue(received)}.`,
  });
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value != null && !Array.isArray(value) && typeof value === "object";
}

function describeValue(value: unknown): string {
  if (value === null) {
    return "null";
  }

  if (Array.isArray(value)) {
    return "array";
  }

  return typeof value;
}
