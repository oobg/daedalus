export const FLOOR_HEIGHT_VALIDATION_MESSAGE =
  "Floor height must be a finite number greater than 0.";
export const EMPTY_FLOOR_HEIGHT_MESSAGE = "Floor height is required.";
export const MALFORMED_FLOOR_HEIGHT_MESSAGE = "Floor height must be numeric.";
export const NON_POSITIVE_FLOOR_HEIGHT_MESSAGE =
  "Floor height must be greater than 0.";
export const NON_FINITE_FLOOR_HEIGHT_MESSAGE =
  "Floor height must be a finite number.";

export type FloorHeightValidationError =
  | {
      code: "empty_floor_height";
      message: string;
    }
  | {
      code: "malformed_floor_height";
      message: string;
    }
  | {
      code: "non_positive_floor_height";
      message: string;
    }
  | {
      code: "non_finite_floor_height";
      message: string;
    };

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
  if (typeof input === "string") {
    const parsedInput = parseFloorHeightString(input);

    if (!parsedInput.ok) {
      return parsedInput;
    }

    return validateNumericFloorHeight(parsedInput.value);
  }

  return validateNumericFloorHeight(input);
}

function parseFloorHeightString(input: string): ValidateFloorHeightResult {
  const trimmedInput = input.trim();

  if (trimmedInput.length === 0) {
    return invalidFloorHeight("empty_floor_height", EMPTY_FLOOR_HEIGHT_MESSAGE);
  }

  const value = Number(trimmedInput);

  if (Number.isNaN(value)) {
    return invalidFloorHeight(
      "malformed_floor_height",
      MALFORMED_FLOOR_HEIGHT_MESSAGE,
    );
  }

  return {
    ok: true,
    value,
  };
}

function validateNumericFloorHeight(value: number): ValidateFloorHeightResult {
  if (!Number.isFinite(value)) {
    return invalidFloorHeight(
      "non_finite_floor_height",
      NON_FINITE_FLOOR_HEIGHT_MESSAGE,
    );
  }

  if (value <= 0) {
    return invalidFloorHeight(
      "non_positive_floor_height",
      NON_POSITIVE_FLOOR_HEIGHT_MESSAGE,
    );
  }

  return {
    ok: true,
    value,
  };
}

function invalidFloorHeight(
  code: FloorHeightValidationError["code"],
  message: string,
): ValidateFloorHeightResult {
  return {
    ok: false,
    error: {
      code,
      message,
    },
  };
}
