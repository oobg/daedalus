import {
  calculateRoomPolygonArea,
  calculateRoomPolygonLabelPosition,
  createRoomPolygonSource,
} from "./room-polygon-source.ts";
import {
  type EditorPoint,
  type RoomOpening,
  type EditorOpening,
  type EditorRoom,
  type EditorRoomInput,
  type RoomLabelPosition,
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

  const source = createRoomPolygonSource({
    roomId,
    roomPolygon,
    sharedBoundaries,
    openings: cloneEdgeOpenings(input.edgeOpenings ?? []),
  });

  return {
    roomId,
    roomName,
    roomPolygon: source.roomPolygon,
    sharedBoundaries: source.sharedBoundaries,
    area: calculatePolygonArea(source.roomPolygon),
    labelPosition: calculatePolygonLabelPosition(source.roomPolygon),
    openings: cloneRoomOpenings(input.openings ?? []),
    ...optionalArrayField("edgeOpenings", source.openings),
    ...optionalMetadataField(input.metadata),
  };
}

export function calculatePolygonArea(points: readonly EditorPoint[]): number {
  return calculateRoomPolygonArea(points);
}

export function calculatePolygonLabelPosition(
  points: readonly EditorPoint[],
): RoomLabelPosition | null {
  return calculateRoomPolygonLabelPosition(points);
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

  if (countDistinctPoints(points) < 3) {
    return {
      code: "invalid_room_polygon",
      message: "Room polygon must contain at least 3 distinct points.",
    };
  }

  if (calculatePolygonArea(points) === 0) {
    return {
      code: "invalid_room_polygon",
      message: "Room polygon must define a non-empty closed shape.",
    };
  }

  return null;
}

function countDistinctPoints(points: readonly EditorPoint[]): number {
  return new Set(points.map((point) => `${point.x},${point.y}`)).size;
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

function cloneRoomOpenings(openings: readonly RoomOpening[]): RoomOpening[] {
  return openings.map((opening) => ({
    id: opening.id,
    type: opening.type,
    x: opening.x,
    y: opening.y,
    angle: opening.angle,
  }));
}

function cloneEdgeOpenings(openings: readonly EditorOpening[]): EditorOpening[] {
  return openings.map((opening) => ({
    openingId: opening.openingId,
    openingType: opening.openingType,
    attachedEdgeId: opening.attachedEdgeId,
    edgeRelativePosition: opening.edgeRelativePosition,
  }));
}

function optionalArrayField<TKey extends string, TValue>(
  key: TKey,
  value: TValue[],
): Record<TKey, TValue[]> | object {
  return value.length > 0 ? { [key]: value } as Record<TKey, TValue[]> : {};
}

function optionalMetadataField(
  metadata: EditorRoomInput["metadata"],
): { metadata: NonNullable<EditorRoomInput["metadata"]> } | object {
  return metadata == null ? {} : { metadata: { ...metadata } };
}

function normalizeRequiredString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}
