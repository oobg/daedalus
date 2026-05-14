import {
  deserializeFloor,
  serializeFloor,
  type Floor,
} from "../../domain/floor.ts";
import {
  createValidatedEditorOpening,
  type EditorOpening,
} from "../../domain/opening.ts";
export type { EditorOpening };
import {
  createValidatedWallSegment,
  type WallSegment as EditorWallSegment,
} from "../../domain/wall.ts";
export type { EditorWallSegment };
import {
  restoreProjectNonGeometryData,
  serializeProjectNonGeometryData,
  type EditorProjectAnnotation,
  type EditorProjectAsset,
  type EditorProjectEditorConfig,
  type SerializedProjectAnnotation,
  type SerializedProjectAsset,
  type SerializedProjectEditorConfig,
} from "./project-non-geometry-serializer.ts";
import { relinkProjectRelationships } from "./project-relationship-relinker.ts";
import { serializeRoomPolygon } from "../editor/model/roomPolygonSerialization.ts";

export interface EditorPoint {
  x: number;
  y: number;
}

export interface EditorLabelPosition {
  x: number;
  y: number;
}

export interface EditorSharedBoundary {
  edgeId: string;
  adjacentRoomId: string;
  adjacentEdgeId: string;
}

export interface EditorRoom {
  roomId: string;
  roomName: string;
  roomPolygon: EditorPoint[];
  sharedBoundaries: EditorSharedBoundary[];
  area: number;
  labelPosition: EditorLabelPosition;
  walls: EditorWallSegment[];
  openings: EditorOpening[];
}

export interface EditorVerticalConnector {
  connectorId: string;
  connectorType: string;
  roomId: string;
  targetFloorId: string;
  position: EditorPoint;
}

export interface EditorFloorState extends Floor {
  rooms: EditorRoom[];
  verticalConnectors: EditorVerticalConnector[];
}

export interface EditorViewState {
  activeFloorId: string;
  zoom: number;
  pan: EditorPoint;
  uploadedProjectName?: string | null;
}

export interface EditorProjectState {
  projectId: string;
  projectName: string;
  objectVersion: number;
  floors: EditorFloorState[];
  viewState: EditorViewState;
  assets?: EditorProjectAsset[];
  annotations?: EditorProjectAnnotation[];
  editorConfig?: Partial<EditorProjectEditorConfig>;
}

export interface SerializedPoint {
  x: number;
  y: number;
}

export interface SerializedLabelPosition {
  x: number;
  y: number;
}

export interface SerializedSharedBoundary {
  edgeId: string;
  adjacentRoomId: string;
  adjacentEdgeId: string;
}

export interface SerializedOpening {
  openingId: string;
  openingType: string;
  attachedEdgeId: string;
  edgeRelativePosition: number;
}

export interface SerializedWallSegment {
  edgeId: string;
  start: SerializedPoint;
  end: SerializedPoint;
}

export interface SerializedRoom {
  roomId: string;
  roomName: string;
  roomPolygon: SerializedPoint[];
  sharedBoundaries: SerializedSharedBoundary[];
  area: number;
  labelPosition: SerializedLabelPosition;
  walls: SerializedWallSegment[];
  openings: SerializedOpening[];
}

export interface SerializedVerticalConnector {
  connectorId: string;
  connectorType: string;
  roomId: string;
  targetFloorId: string;
  position: SerializedPoint;
}

export interface SerializedProjectFloor {
  floorId: string;
  floorName: string;
  floorHeight?: number;
  referenceImage: string | null;
  rooms: SerializedRoom[];
  verticalConnectors: SerializedVerticalConnector[];
}

export interface SerializedProjectViewState {
  activeFloorId: string;
  zoom: number;
  pan: SerializedPoint;
  uploadedProjectName?: string | null;
}

export interface SerializedProjectData {
  projectId: string;
  projectName: string;
  objectVersion: number;
  floors: SerializedProjectFloor[];
  viewState: SerializedProjectViewState;
  assets: SerializedProjectAsset[];
  annotations: SerializedProjectAnnotation[];
  editorConfig: SerializedProjectEditorConfig;
}

export function restoreProjectFromImport(
  project: SerializedProjectData,
): EditorProjectState {
  const restoredNonGeometryData = restoreProjectNonGeometryData({
    assets: project.assets,
    annotations: project.annotations,
    editorConfig: project.editorConfig,
  });

  return relinkProjectRelationships({
    projectId: project.projectId,
    projectName: project.projectName,
    objectVersion: project.objectVersion,
    floors: project.floors.map(restoreProjectFloor),
    viewState: restoreViewState(project.viewState),
    assets: restoredNonGeometryData.assets,
    annotations: restoredNonGeometryData.annotations,
    editorConfig: restoredNonGeometryData.editorConfig,
  });
}

export function serializeProjectForExport(
  project: EditorProjectState,
): SerializedProjectData {
  const nonGeometryData = serializeProjectNonGeometryData(project);

  return {
    projectId: project.projectId,
    projectName: project.projectName,
    objectVersion: project.objectVersion,
    floors: project.floors.map(serializeProjectFloor),
    viewState: serializeViewState(project.viewState),
    assets: nonGeometryData.assets,
    annotations: nonGeometryData.annotations,
    editorConfig: nonGeometryData.editorConfig,
  };
}

function serializeProjectFloor(floor: EditorFloorState): SerializedProjectFloor {
  const serializedFloor = serializeFloor(floor);

  return {
    floorId: serializedFloor.id,
    floorName: serializedFloor.name,
    floorHeight: serializedFloor.height,
    referenceImage: serializedFloor.referenceImage,
    rooms: floor.rooms.map(serializeRoom),
    verticalConnectors: floor.verticalConnectors.map(
      serializeVerticalConnector,
    ),
  };
}

function restoreProjectFloor(floor: SerializedProjectFloor): EditorFloorState {
  const restoredFloor = deserializeFloor({
    id: floor.floorId,
    name: floor.floorName,
    height: floor.floorHeight,
    referenceImage: floor.referenceImage,
  });

  return {
    ...restoredFloor,
    rooms: floor.rooms.map(restoreRoom),
    verticalConnectors: floor.verticalConnectors.map(restoreVerticalConnector),
  };
}

function serializeRoom(room: EditorRoom): SerializedRoom {
  return {
    roomId: room.roomId,
    roomName: room.roomName,
    roomPolygon: serializeRoomPolygon({
      roomId: room.roomId,
      points: room.roomPolygon,
    }).points,
    sharedBoundaries: room.sharedBoundaries.map(serializeSharedBoundary),
    area: room.area,
    labelPosition: serializeLabelPosition(room.labelPosition),
    walls: room.walls.map(serializeWallSegment),
    openings: room.openings.map(serializeOpening),
  };
}

function restoreRoom(room: SerializedRoom): EditorRoom {
  return {
    roomId: room.roomId,
    roomName: room.roomName,
    roomPolygon: room.roomPolygon.map(restorePoint),
    sharedBoundaries: room.sharedBoundaries.map(restoreSharedBoundary),
    area: room.area,
    labelPosition: restoreLabelPosition(room.labelPosition),
    walls: room.walls.map(restoreWallSegment),
    openings: room.openings.map(restoreOpening),
  };
}

function serializeViewState(
  viewState: EditorViewState,
): SerializedProjectViewState {
  return {
    activeFloorId: viewState.activeFloorId,
    zoom: viewState.zoom,
    pan: serializePoint(viewState.pan),
    uploadedProjectName: viewState.uploadedProjectName,
  };
}

function restoreViewState(
  viewState: SerializedProjectViewState,
): EditorViewState {
  return {
    activeFloorId: viewState.activeFloorId,
    zoom: viewState.zoom,
    pan: restorePoint(viewState.pan),
    uploadedProjectName: viewState.uploadedProjectName,
  };
}

function serializeVerticalConnector(
  connector: EditorVerticalConnector,
): SerializedVerticalConnector {
  return {
    connectorId: connector.connectorId,
    connectorType: connector.connectorType,
    roomId: connector.roomId,
    targetFloorId: connector.targetFloorId,
    position: serializePoint(connector.position),
  };
}

function restoreVerticalConnector(
  connector: SerializedVerticalConnector,
): EditorVerticalConnector {
  return {
    connectorId: connector.connectorId,
    connectorType: connector.connectorType,
    roomId: connector.roomId,
    targetFloorId: connector.targetFloorId,
    position: restorePoint(connector.position),
  };
}

function serializeWallSegment(wall: EditorWallSegment): SerializedWallSegment {
  return {
    edgeId: wall.edgeId,
    start: serializePoint(wall.start),
    end: serializePoint(wall.end),
  };
}

function restoreWallSegment(wall: SerializedWallSegment): EditorWallSegment {
  return createValidatedWallSegment({
    edgeId: wall.edgeId,
    start: restorePoint(wall.start),
    end: restorePoint(wall.end),
  });
}

function serializeOpening(opening: EditorOpening): SerializedOpening {
  return {
    openingId: opening.openingId,
    openingType: opening.openingType,
    attachedEdgeId: opening.attachedEdgeId,
    edgeRelativePosition: opening.edgeRelativePosition,
  };
}

function restoreOpening(opening: SerializedOpening): EditorOpening {
  return createValidatedEditorOpening({
    openingId: opening.openingId,
    openingType: opening.openingType,
    attachedEdgeId: opening.attachedEdgeId,
    edgeRelativePosition: opening.edgeRelativePosition,
  });
}

function serializeSharedBoundary(
  boundary: EditorSharedBoundary,
): SerializedSharedBoundary {
  return {
    edgeId: boundary.edgeId,
    adjacentRoomId: boundary.adjacentRoomId,
    adjacentEdgeId: boundary.adjacentEdgeId,
  };
}

function restoreSharedBoundary(
  boundary: SerializedSharedBoundary,
): EditorSharedBoundary {
  return {
    edgeId: boundary.edgeId,
    adjacentRoomId: boundary.adjacentRoomId,
    adjacentEdgeId: boundary.adjacentEdgeId,
  };
}

function serializeLabelPosition(
  position: EditorLabelPosition,
): SerializedLabelPosition {
  return {
    x: position.x,
    y: position.y,
  };
}

function restoreLabelPosition(
  position: SerializedLabelPosition,
): EditorLabelPosition {
  return {
    x: position.x,
    y: position.y,
  };
}

function serializePoint(point: EditorPoint): SerializedPoint {
  return {
    x: point.x,
    y: point.y,
  };
}

function restorePoint(point: SerializedPoint): EditorPoint {
  return {
    x: point.x,
    y: point.y,
  };
}
