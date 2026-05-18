import {
  deriveRoomWallsFromPolygon,
  type EditorFloor,
  type EditorPoint,
  type EditorProject,
  type EditorRoom,
} from "../../domain/editor-state.ts";
import type {
  ReadonlyEditorStateProjection,
  ReadonlyRendererSnapshotProject,
  RendererConsumer,
  RendererSnapshotFloor,
  RendererSnapshotOpening,
  RendererSnapshotPoint,
  RendererSnapshotRoom,
  RendererSnapshotSharedBoundary,
  RendererSnapshotVerticalConnector,
  RendererSnapshotWallSegment,
  SerializedEditorStateProjection,
} from "./renderer-contract.ts";
import { EDITOR_STATE_PROJECTION_VERSION } from "./renderer-contract.ts";

const DEFAULT_RENDERER_CONSUMERS: readonly RendererConsumer[] = [
  "renderer",
  "viewer",
];

export interface EditorStateProjectionOptions {
  projectedAt?: Date;
  consumers?: readonly RendererConsumer[];
}

export function createReadonlyEditorStateProjection(
  project: EditorProject,
  options: EditorStateProjectionOptions = {},
): Readonly<ReadonlyEditorStateProjection> {
  const projection: ReadonlyEditorStateProjection = {
    projectionVersion: EDITOR_STATE_PROJECTION_VERSION,
    projectedAt: (options.projectedAt ?? new Date()).toISOString(),
    consumers: [...(options.consumers ?? DEFAULT_RENDERER_CONSUMERS)],
    project: projectEditorStateForRenderer(project),
  };

  return deepFreeze(projection);
}

export function serializeEditorStateProjection(
  project: EditorProject,
  options: EditorStateProjectionOptions = {},
): SerializedEditorStateProjection {
  const projection = createReadonlyEditorStateProjection(project, options);

  return {
    projectionVersion: projection.projectionVersion,
    projectedAt: projection.projectedAt,
    consumers: [...projection.consumers],
    project: structuredClone(projection.project),
  };
}

export function projectEditorStateForRenderer(
  project: EditorProject,
): ReadonlyRendererSnapshotProject {
  return deepFreeze({
    projectId: project.projectId,
    projectName: project.projectName,
    objectVersion: project.objectVersion,
    floors: project.floors.map((floor) => mapEditorFloorToRendererSnapshotFloor(floor)),
    viewState: {
      activeFloorId: project.viewState.activeFloorId,
      selectedRoomId: project.viewState.selectedRoomId,
    },
  });
}

export function mapEditorFloorToRendererSnapshotFloor(
  floor: EditorFloor,
  mappedRooms: readonly RendererSnapshotRoom[] = floor.rooms.map(
    mapEditorRoomToRendererSnapshotRoom,
  ),
): RendererSnapshotFloor {
  const rooms = [...mappedRooms]
    .sort((left, right) => left.roomId.localeCompare(right.roomId))
    .map(cloneRendererSnapshotRoom);
  const verticalConnectors = [...(floor.verticalConnectors ?? [])]
    .sort((left, right) => left.connectorId.localeCompare(right.connectorId))
    .map(projectVerticalConnectorForRenderer);

  return {
    floorId: floor.floorId,
    floorName: floor.floorName,
    floorHeight: floor.floorHeight,
    referenceImage: floor.referenceImage,
    rooms,
    verticalConnectors,
  };
}

export function mapEditorRoomToRendererSnapshotRoom(
  room: EditorRoom,
): RendererSnapshotRoom {
  return {
    roomId: room.roomId,
    roomName: room.roomName,
    roomPolygon: room.roomPolygon.map(clonePoint),
    sharedBoundaries: room.sharedBoundaries.map(projectSharedBoundaryForRenderer),
    area: room.area,
    labelPosition: room.labelPosition == null ? null : clonePoint(room.labelPosition),
    walls: deriveRoomWallsFromPolygon(room.roomId, room.roomPolygon).map(
      projectWallForRenderer,
    ),
    openings: (room.edgeOpenings ?? []).map(projectOpeningForRenderer),
  };
}

function projectSharedBoundaryForRenderer(
  boundary: EditorRoom["sharedBoundaries"][number],
): RendererSnapshotSharedBoundary {
  return {
    edgeId: boundary.edgeId,
    adjacentRoomId: boundary.adjacentRoomId,
    adjacentEdgeId: boundary.adjacentEdgeId,
  };
}

function projectOpeningForRenderer(
  opening: NonNullable<EditorRoom["edgeOpenings"]>[number],
): RendererSnapshotOpening {
  return {
    openingId: opening.openingId,
    openingType: opening.openingType,
    attachedEdgeId: opening.attachedEdgeId,
    edgeRelativePosition: opening.edgeRelativePosition,
  };
}

function projectWallForRenderer(
  wall: ReturnType<typeof deriveRoomWallsFromPolygon>[number],
): RendererSnapshotWallSegment {
  return {
    edgeId: wall.edgeId,
    start: clonePoint(wall.start),
    end: clonePoint(wall.end),
  };
}

function projectVerticalConnectorForRenderer(
  connector: NonNullable<EditorFloor["verticalConnectors"]>[number],
): RendererSnapshotVerticalConnector {
  return {
    connectorId: connector.connectorId,
    connectorType: connector.connectorType,
    roomId: connector.roomId,
    targetFloorId: connector.targetFloorId,
    position: clonePoint(connector.position),
  };
}

function cloneRendererSnapshotRoom(
  room: RendererSnapshotRoom,
): RendererSnapshotRoom {
  return {
    roomId: room.roomId,
    roomName: room.roomName,
    roomPolygon: room.roomPolygon.map(clonePoint),
    sharedBoundaries: room.sharedBoundaries.map(cloneRendererSharedBoundary),
    area: room.area,
    labelPosition: room.labelPosition == null ? null : clonePoint(room.labelPosition),
    walls: room.walls?.map(cloneRendererWallSegment) ?? [],
    openings: room.openings?.map(cloneRendererOpening) ?? [],
  };
}

function clonePoint(point: EditorPoint): RendererSnapshotPoint {
  return {
    x: point.x,
    y: point.y,
  };
}

function cloneRendererSharedBoundary(
  boundary: RendererSnapshotSharedBoundary,
): RendererSnapshotSharedBoundary {
  return {
    edgeId: boundary.edgeId,
    adjacentRoomId: boundary.adjacentRoomId,
    adjacentEdgeId: boundary.adjacentEdgeId,
  };
}

function cloneRendererOpening(
  opening: RendererSnapshotOpening,
): RendererSnapshotOpening {
  return {
    openingId: opening.openingId,
    openingType: opening.openingType,
    attachedEdgeId: opening.attachedEdgeId,
    edgeRelativePosition: opening.edgeRelativePosition,
  };
}

function cloneRendererWallSegment(
  wall: RendererSnapshotWallSegment,
): RendererSnapshotWallSegment {
  return {
    edgeId: wall.edgeId,
    start: clonePoint(wall.start),
    end: clonePoint(wall.end),
  };
}

function deepFreeze<T>(value: T): Readonly<T> {
  if (value == null || typeof value !== "object" || Object.isFrozen(value)) {
    return value as Readonly<T>;
  }

  for (const nestedValue of Object.values(value)) {
    deepFreeze(nestedValue);
  }

  return Object.freeze(value);
}
