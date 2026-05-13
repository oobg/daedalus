export interface WallPoint {
  x: number;
  y: number;
}

export interface WallSegment {
  edgeId: string;
  start: WallPoint;
  end: WallPoint;
}

export interface WallSegmentInput {
  edgeId: string;
  start: WallPoint;
  end: WallPoint;
}

export type WallValidationErrorCode =
  | "invalid_wall_edge_id"
  | "invalid_wall_point"
  | "invalid_wall_geometry";

export interface WallValidationError {
  code: WallValidationErrorCode;
  message: string;
}

export type ValidateWallSegmentInputResult =
  | {
      ok: true;
      value: WallSegment;
    }
  | {
      ok: false;
      error: WallValidationError;
    };

export function validateWallSegmentInput(
  input: WallSegmentInput,
): ValidateWallSegmentInputResult {
  const edgeId = normalizeRequiredString(input.edgeId);

  if (edgeId == null) {
    return {
      ok: false,
      error: {
        code: "invalid_wall_edge_id",
        message: "Wall edge id must be a non-empty string.",
      },
    };
  }

  const start = clonePoint(input.start);
  const end = clonePoint(input.end);

  if (!isFinitePoint(start) || !isFinitePoint(end)) {
    return {
      ok: false,
      error: {
        code: "invalid_wall_point",
        message: "Wall points must use finite x/y coordinates.",
      },
    };
  }

  if (start.x === end.x && start.y === end.y) {
    return {
      ok: false,
      error: {
        code: "invalid_wall_geometry",
        message: "Wall start and end points must not be identical.",
      },
    };
  }

  return {
    ok: true,
    value: {
      edgeId,
      start,
      end,
    },
  };
}

export function createValidatedWallSegment(
  input: WallSegmentInput,
): WallSegment {
  const validation = validateWallSegmentInput(input);

  if (!validation.ok) {
    throw new Error(validation.error.message);
  }

  return validation.value;
}

function normalizeRequiredString(value: string): string | null {
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function isFinitePoint(point: WallPoint): boolean {
  return Number.isFinite(point.x) && Number.isFinite(point.y);
}

function clonePoint(point: WallPoint): WallPoint {
  return {
    x: point.x,
    y: point.y,
  };
}
