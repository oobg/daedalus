export const FLOOR_HEIGHT_VALIDATION_MESSAGE =
  "Floor height must be a number greater than 0.";

export interface FloorHeightValidationError {
  code: "invalid_floor_height";
  message: string;
}

export type ValidateFloorHeightResult =
  | {
      ok: true;
      value: number;
    }
  | {
      ok: false;
      error: FloorHeightValidationError;
    };

export function validateFloorHeightValue(
  input: number | string,
): ValidateFloorHeightResult {
  const value =
    typeof input === "string" ? parseFloorHeightString(input) : input;

  if (!Number.isFinite(value) || value <= 0) {
    return {
      ok: false,
      error: {
        code: "invalid_floor_height",
        message: FLOOR_HEIGHT_VALIDATION_MESSAGE,
      },
    };
  }

  return {
    ok: true,
    value,
  };
}

function parseFloorHeightString(input: string): number {
  const trimmedInput = input.trim();

  if (trimmedInput.length === 0) {
    return Number.NaN;
  }

  return Number(trimmedInput);
}
