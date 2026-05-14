export interface RendererSnapshotPoint {
  x: number;
  y: number;
}

export interface RendererSnapshotLabelPosition {
  x: number;
  y: number;
}

export interface RendererSnapshotSharedBoundary {
  edgeId: string;
  adjacentRoomId: string;
  adjacentEdgeId: string;
}

export interface RendererSnapshotOpening {
  openingId: string;
  openingType: string;
  attachedEdgeId: string;
  edgeRelativePosition: number;
}

export interface RendererSnapshotWallSegment {
  edgeId: string;
  start: RendererSnapshotPoint;
  end: RendererSnapshotPoint;
}

export interface RendererSnapshotRoom {
  roomId: string;
  roomName: string;
  roomPolygon: readonly RendererSnapshotPoint[];
  sharedBoundaries: readonly RendererSnapshotSharedBoundary[];
  area: number;
  labelPosition: RendererSnapshotLabelPosition | null;
  walls?: readonly RendererSnapshotWallSegment[];
  openings?: readonly RendererSnapshotOpening[];
}

export interface RendererSnapshotVerticalConnector {
  connectorId: string;
  connectorType: string;
  roomId: string;
  targetFloorId: string;
  position: RendererSnapshotPoint;
}

export interface RendererSnapshotFloor {
  floorId: string;
  floorName: string;
  floorHeight: number;
  referenceImage: string | null;
  rooms: readonly RendererSnapshotRoom[];
  verticalConnectors?: readonly RendererSnapshotVerticalConnector[];
}

export interface RendererSnapshotViewState {
  activeFloorId: string | null;
  selectedRoomId?: string | null;
}

export interface RendererSnapshotProject {
  projectId: string;
  projectName: string;
  objectVersion: number;
  floors: readonly RendererSnapshotFloor[];
  viewState: RendererSnapshotViewState;
}

export interface RenderScenePoint {
  x: number;
  y: number;
}

export interface RenderSceneBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface RenderSceneBoundary {
  edgeId: string;
  adjacentRoomId: string;
  adjacentEdgeId: string;
}

export interface RenderSceneWallSegment {
  edgeId: string;
  start: RenderScenePoint;
  end: RenderScenePoint;
}

export interface RenderSceneOpening {
  openingId: string;
  openingType: string;
  attachedEdgeId: string;
  edgeRelativePosition: number;
  anchor: RenderScenePoint | null;
}

export type RenderSceneLayerElementClass = "floor" | "furniture" | "wall";

export interface RenderSceneRoomLayer {
  elementClass: RenderSceneLayerElementClass;
  order: number;
  baseElevation: number;
}

export interface RenderSceneRoomLayers {
  floor: RenderSceneRoomLayer;
  furniture: RenderSceneRoomLayer;
  wall: RenderSceneRoomLayer;
}

export interface RenderSceneRoom {
  roomId: string;
  roomName: string;
  polygon: readonly RenderScenePoint[];
  boundaries: readonly RenderSceneBoundary[];
  area: number;
  labelPosition: RenderScenePoint | null;
  bounds: RenderSceneBounds | null;
  layers: RenderSceneRoomLayers;
  walls: readonly RenderSceneWallSegment[];
  openings: readonly RenderSceneOpening[];
}

export interface RenderSceneVerticalConnector {
  connectorId: string;
  connectorType: string;
  roomId: string;
  targetFloorId: string;
  position: RenderScenePoint;
}

export interface RenderSceneFloor {
  floorId: string;
  floorName: string;
  floorHeight: number;
  verticalOffset: number;
  referenceImage: string | null;
  isActive: boolean;
  rooms: readonly RenderSceneRoom[];
  verticalConnectors: readonly RenderSceneVerticalConnector[];
}

export interface RenderSceneData {
  projectId: string;
  projectName: string;
  objectVersion: number;
  activeFloorId: string | null;
  selectedRoomId: string | null;
  floors: readonly RenderSceneFloor[];
}

export const RENDERER_CONTRACT_FIELDS = Object.freeze({
  snapshotProject: Object.freeze([
    "projectId",
    "projectName",
    "objectVersion",
    "floors",
    "viewState",
  ]),
  snapshotFloor: Object.freeze([
    "floorId",
    "floorName",
    "floorHeight",
    "referenceImage",
    "rooms",
  ]),
  snapshotRoom: Object.freeze([
    "roomId",
    "roomName",
    "roomPolygon",
    "sharedBoundaries",
    "area",
    "labelPosition",
  ]),
  snapshotOpening: Object.freeze([
    "openingId",
    "openingType",
    "attachedEdgeId",
    "edgeRelativePosition",
  ]),
  sceneData: Object.freeze([
    "projectId",
    "projectName",
    "objectVersion",
    "activeFloorId",
    "selectedRoomId",
    "floors",
  ]),
  sceneFloor: Object.freeze([
    "floorId",
    "floorName",
    "floorHeight",
    "verticalOffset",
    "referenceImage",
    "isActive",
    "rooms",
    "verticalConnectors",
  ]),
  sceneRoom: Object.freeze([
    "roomId",
    "roomName",
    "polygon",
    "boundaries",
    "area",
    "labelPosition",
    "bounds",
    "layers",
    "walls",
    "openings",
  ]),
  sceneOpening: Object.freeze([
    "openingId",
    "openingType",
    "attachedEdgeId",
    "edgeRelativePosition",
    "anchor",
  ]),
});
