import {
  calculatePolygonArea,
  calculatePolygonLabelPosition,
  deriveRoomWallsFromPolygon,
  type EditorFloor,
  type EditorPoint,
  type EditorProject,
  type EditorRoom,
  type EditorVerticalConnector,
  type SharedBoundaryRef,
} from "../../domain/editor-state.ts";
import type { EditorOpening } from "../../domain/opening.ts";
import type { EditorWallSegment } from "../../domain/wall.ts";

export interface SerializedEditorProjectPoint {
  x: number;
  y: number;
}

export interface SerializedEditorProjectLabelPosition {
  x: number;
  y: number;
}

export interface SerializedEditorProjectSharedBoundary {
  edgeId: string;
  roomId: string;
  adjacentRoomId: string;
  adjacentEdgeId: string;
}

export interface SerializedEditorProjectOpening {
  openingId: string;
  openingType: "door" | "window";
  attachedEdgeId: string;
  edgeRelativePosition: number;
}

export interface SerializedEditorProjectWall {
  edgeId: string;
  start: SerializedEditorProjectPoint;
  end: SerializedEditorProjectPoint;
}

export interface SerializedEditorProjectRoom {
  roomId: string;
  roomName: string;
  roomPolygon: SerializedEditorProjectPoint[];
  sharedBoundaries: SerializedEditorProjectSharedBoundary[];
  area: number;
  labelPosition: SerializedEditorProjectLabelPosition | null;
  walls: SerializedEditorProjectWall[];
  openings: SerializedEditorProjectOpening[];
}

export interface SerializedEditorProjectVerticalConnector {
  connectorId: string;
  connectorType: "stair" | "elevator";
  roomId: string;
  targetFloorId: string;
  position: SerializedEditorProjectPoint;
}

export interface SerializedEditorProjectFloor {
  floorId: string;
  floorName: string;
  floorHeight: number;
  referenceImage: string | null;
  rooms: SerializedEditorProjectRoom[];
  verticalConnectors: SerializedEditorProjectVerticalConnector[];
}

export interface SerializedEditorProjectViewState {
  activeFloorId: string | null;
  selectedRoomId: string | null;
}

export interface SerializedEditorProjectDocument {
  projectId: string;
  projectName: string;
  objectVersion: number;
  floors: SerializedEditorProjectFloor[];
  viewState: SerializedEditorProjectViewState;
}

export function serializeEditorProjectToJsonDocument(
  project: EditorProject,
): SerializedEditorProjectDocument {
  return {
    projectId: project.projectId,
    projectName: project.projectName,
    objectVersion: project.objectVersion,
    floors: project.floors.map(serializeFloor),
    viewState: {
      activeFloorId: project.viewState.activeFloorId,
      selectedRoomId: project.viewState.selectedRoomId,
    },
  };
}

export function serializeEditorProjectToJson(
  project: EditorProject,
): string {
  return JSON.stringify(serializeEditorProjectToJsonDocument(project), null, 2);
}

function serializeFloor(floor: EditorFloor): SerializedEditorProjectFloor {
  return {
    floorId: floor.floorId,
    floorName: floor.floorName,
    floorHeight: floor.floorHeight,
    referenceImage: floor.referenceImage,
    rooms: floor.rooms.map(serializeRoom),
    verticalConnectors: (floor.verticalConnectors ?? []).map(
      serializeVerticalConnector,
    ),
  };
}

function serializeRoom(room: EditorRoom): SerializedEditorProjectRoom {
  const roomPolygon = room.roomPolygon.map(serializePoint);

  return {
    roomId: room.roomId,
    roomName: room.roomName,
    roomPolygon,
    sharedBoundaries: room.sharedBoundaries.map(serializeSharedBoundary),
    area: calculatePolygonArea(room.roomPolygon),
    labelPosition: serializeLabelPosition(
      calculatePolygonLabelPosition(room.roomPolygon),
    ),
    walls: deriveRoomWallsFromPolygon(room.roomId, room.roomPolygon).map(
      serializeWall,
    ),
    openings: (room.edgeOpenings ?? []).map(serializeOpening),
  };
}

function serializeVerticalConnector(
  connector: EditorVerticalConnector,
): SerializedEditorProjectVerticalConnector {
  return {
    connectorId: connector.connectorId,
    connectorType: connector.connectorType,
    roomId: connector.roomId,
    targetFloorId: connector.targetFloorId,
    position: serializePoint(connector.position),
  };
}

function serializeSharedBoundary(
  boundary: SharedBoundaryRef,
): SerializedEditorProjectSharedBoundary {
  return {
    edgeId: boundary.edgeId,
    roomId: boundary.roomId,
    adjacentRoomId: boundary.adjacentRoomId,
    adjacentEdgeId: boundary.adjacentEdgeId,
  };
}

function serializeWall(wall: EditorWallSegment): SerializedEditorProjectWall {
  return {
    edgeId: wall.edgeId,
    start: serializePoint(wall.start),
    end: serializePoint(wall.end),
  };
}

function serializeOpening(
  opening: EditorOpening,
): SerializedEditorProjectOpening {
  return {
    openingId: opening.openingId,
    openingType: opening.openingType,
    attachedEdgeId: opening.attachedEdgeId,
    edgeRelativePosition: opening.edgeRelativePosition,
  };
}

function serializeLabelPosition(
  labelPosition: { x: number; y: number } | null,
): SerializedEditorProjectLabelPosition | null {
  if (labelPosition == null) {
    return null;
  }

  return {
    x: labelPosition.x,
    y: labelPosition.y,
  };
}

function serializePoint(point: EditorPoint): SerializedEditorProjectPoint {
  return {
    x: point.x,
    y: point.y,
  };
}
