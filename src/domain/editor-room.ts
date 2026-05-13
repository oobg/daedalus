import {
  type EditorPoint,
  type EditorRoom,
  type EditorRoomInput,
  type RoomLabelPosition,
  type RoomOpening,
  type SharedBoundaryRef,
} from "./editor-state.ts";

const DEFAULT_VALIDATED_ROOM_NAME = "Room 1";

export type EditorRoomValidationErrorCode =
  | "invalid_room_id"
  | "invalid_room_name"
  | "invalid_room_polygon"
  | "invalid_shared_boundary";

export interface EditorRoomValidationError {
  code: EditorRoomValidationErrorCode;
  message: string;
}

export interface ValidatedEditorRoomInput {
  roomId: string;
  roomName: string;
  roomPolygon: EditorPoint[];
  sharedBoundaries: SharedBoundaryRef[];
}

export type ValidateEditorRoomInputResult =
  | {
      ok: true;
      value: ValidatedEditorRoomInput;
    }
  | {
      ok: false;
      error: EditorRoomValidationError;
    };

export function validateEditorRoomInput(
  input: EditorRoomInput,
): ValidateEditorRoomInputResult {
  const roomId = normalizeRequiredString(input.roomId);

  if (roomId == null) {
    return {
      ok: false,
      error: {
        code: "invalid_room_id",
        message: "Room id must be a non-empty string.",
      },
    };
  }

  const roomName = input.roomName ?? DEFAULT_VALIDATED_ROOM_NAME;

  if (normalizeRequiredString(roomName) == null) {
    return {
      ok: false,
      error: {
        code: "invalid_room_name",
        message: "Room name must be a non-empty string.",
      },
    };
  }

  const roomPolygon = clonePoints(input.roomPolygon ?? []);
  const polygonError = validateRoomPolygon(roomPolygon);

  if (polygonError != null) {
    return {
      ok: false,
      error: polygonError,
    };
  }

  const sharedBoundaries = cloneSharedBoundaries(input.sharedBoundaries ?? []);
  const sharedBoundaryError = validateSharedBoundaries(roomId, sharedBoundaries);

  if (sharedBoundaryError != null) {
    return {
      ok: false,
      error: sharedBoundaryError,
    };
  }

  return {
    ok: true,
    value: {
      roomId,
      roomName,
      roomPolygon,
      sharedBoundaries,
    },
  };
}

export function createValidatedEditorRoom(input: EditorRoomInput): EditorRoom {
  const validation = validateEditorRoomInput(input);

  if (!validation.ok) {
    throw new Error(validation.error.message);
  }

  const { roomId, roomName, roomPolygon, sharedBoundaries } = validation.value;

  return {
    roomId,
    roomName,
    roomPolygon,
    sharedBoundaries,
    area: calculatePolygonArea(roomPolygon),
    labelPosition: calculatePolygonLabelPosition(roomPolygon),
    openings: ((input as { openings?: RoomOpening[] }).openings ?? []),
  };
}

export function calculatePolygonArea(points: readonly EditorPoint[]): number {
  if (points.length < 3) {
    return 0;
  }

  let area = 0;

  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    area += current.x * next.y - next.x * current.y;
  }

  return Math.abs(area / 2);
}

export function calculatePolygonLabelPosition(
  points: readonly EditorPoint[],
): RoomLabelPosition | null {
  if (points.length === 0) {
    return null;
  }

  let x = 0;
  let y = 0;

  for (const point of points) {
    x += point.x;
    y += point.y;
  }

  return {
    x: x / points.length,
    y: y / points.length,
  };
}

function validateRoomPolygon(
  points: readonly EditorPoint[],
): EditorRoomValidationError | null {
  if (points.length === 0) {
    return null;
  }

  if (points.length < 3) {
    return {
      code: "invalid_room_polygon",
      message: "Room polygon must contain at least 3 points.",
    };
  }

  for (const point of points) {
    if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) {
      return {
        code: "invalid_room_polygon",
        message: "Room polygon points must use finite x/y coordinates.",
      };
    }
  }

  if (calculatePolygonArea(points) === 0) {
    return {
      code: "invalid_room_polygon",
      message: "Room polygon area must be greater than 0.",
    };
  }

  return null;
}

function validateSharedBoundaries(
  roomId: string,
  sharedBoundaries: readonly SharedBoundaryRef[],
): EditorRoomValidationError | null {
  for (const boundary of sharedBoundaries) {
    if (
      normalizeRequiredString(boundary.edgeId) == null ||
      normalizeRequiredString(boundary.roomId) == null ||
      normalizeRequiredString(boundary.adjacentRoomId) == null ||
      normalizeRequiredString(boundary.adjacentEdgeId) == null
    ) {
      return {
        code: "invalid_shared_boundary",
        message:
          "Shared boundaries must include edge, room, adjacent room, and adjacent edge ids.",
      };
    }

    if (boundary.roomId !== roomId) {
      return {
        code: "invalid_shared_boundary",
        message: `Shared boundary roomId must match room "${roomId}".`,
      };
    }
  }

  return null;
}

function clonePoints(points: readonly EditorPoint[]): EditorPoint[] {
  return points.map((point) => ({
    x: point.x,
    y: point.y,
  }));
}

function cloneSharedBoundaries(
  sharedBoundaries: readonly SharedBoundaryRef[],
): SharedBoundaryRef[] {
  return sharedBoundaries.map((boundary) => ({
    edgeId: boundary.edgeId,
    roomId: boundary.roomId,
    adjacentRoomId: boundary.adjacentRoomId,
    adjacentEdgeId: boundary.adjacentEdgeId,
  }));
}

function normalizeRequiredString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}
