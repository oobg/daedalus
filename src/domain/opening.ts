export const SUPPORTED_OPENING_TYPES = ["door", "window"] as const;

export type EditorOpeningType = (typeof SUPPORTED_OPENING_TYPES)[number];

export interface EditorOpening {
  openingId: string;
  openingType: EditorOpeningType;
  attachedEdgeId: string;
  edgeRelativePosition: number;
}

export interface EditorOpeningInput {
  openingId: string;
  openingType: string;
  attachedEdgeId: string;
  edgeRelativePosition: number;
}

export type OpeningValidationErrorCode =
  | "invalid_opening_id"
  | "invalid_opening_type"
  | "invalid_opening_edge_id"
  | "invalid_opening_position";

export interface OpeningValidationError {
  code: OpeningValidationErrorCode;
  message: string;
}

export type ValidateEditorOpeningInputResult =
  | {
      ok: true;
      value: EditorOpening;
    }
  | {
      ok: false;
      error: OpeningValidationError;
    };

export function validateEditorOpeningInput(
  input: EditorOpeningInput,
): ValidateEditorOpeningInputResult {
  const openingId = normalizeRequiredString(input.openingId);

  if (openingId == null) {
    return {
      ok: false,
      error: {
        code: "invalid_opening_id",
        message: "Opening id must be a non-empty string.",
      },
    };
  }

  const openingType = normalizeOpeningType(input.openingType);

  if (openingType == null) {
    return {
      ok: false,
      error: {
        code: "invalid_opening_type",
        message: 'Opening type must be either "door" or "window".',
      },
    };
  }

  const attachedEdgeId = normalizeRequiredString(input.attachedEdgeId);

  if (attachedEdgeId == null) {
    return {
      ok: false,
      error: {
        code: "invalid_opening_edge_id",
        message: "Opening attached edge id must be a non-empty string.",
      },
    };
  }

  if (
    !Number.isFinite(input.edgeRelativePosition) ||
    input.edgeRelativePosition < 0 ||
    input.edgeRelativePosition > 1
  ) {
    return {
      ok: false,
      error: {
        code: "invalid_opening_position",
        message:
          "Opening edge relative position must be a finite number between 0 and 1.",
      },
    };
  }

  return {
    ok: true,
    value: {
      openingId,
      openingType,
      attachedEdgeId,
      edgeRelativePosition: input.edgeRelativePosition,
    },
  };
}

export function createValidatedEditorOpening(
  input: EditorOpeningInput,
): EditorOpening {
  const validation = validateEditorOpeningInput(input);

  if (!validation.ok) {
    throw new Error(validation.error.message);
  }

  return validation.value;
}

function normalizeRequiredString(value: string): string | null {
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function normalizeOpeningType(value: string): EditorOpeningType | null {
  const normalized = normalizeRequiredString(value);

  if (normalized == null) {
    return null;
  }

  return SUPPORTED_OPENING_TYPES.find((candidate) => candidate === normalized) ?? null;
}
