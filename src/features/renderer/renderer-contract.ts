export type DeepReadonly<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends readonly (infer Item)[]
    ? readonly DeepReadonly<Item>[]
    : T extends object
      ? { readonly [Key in keyof T]: DeepReadonly<T[Key]> }
      : T;

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

export type ReadonlyRendererSnapshotPoint = DeepReadonly<RendererSnapshotPoint>;
export type ReadonlyRendererSnapshotLabelPosition =
  DeepReadonly<RendererSnapshotLabelPosition>;
export type ReadonlyRendererSnapshotSharedBoundary =
  DeepReadonly<RendererSnapshotSharedBoundary>;
export type ReadonlyRendererSnapshotOpening =
  DeepReadonly<RendererSnapshotOpening>;
export type ReadonlyRendererSnapshotWallSegment =
  DeepReadonly<RendererSnapshotWallSegment>;
export type ReadonlyRendererSnapshotRoom = DeepReadonly<RendererSnapshotRoom>;
export type ReadonlyRendererSnapshotVerticalConnector =
  DeepReadonly<RendererSnapshotVerticalConnector>;
export type ReadonlyRendererSnapshotFloor = DeepReadonly<RendererSnapshotFloor>;
export type ReadonlyRendererSnapshotViewState =
  DeepReadonly<RendererSnapshotViewState>;
export type ReadonlyRendererSnapshotProject =
  DeepReadonly<RendererSnapshotProject>;

export const EDITOR_STATE_PROJECTION_VERSION = 1;

export type RendererConsumer = "renderer" | "viewer";

export interface ReadonlyEditorStateProjection {
  projectionVersion: typeof EDITOR_STATE_PROJECTION_VERSION;
  projectedAt: string;
  consumers: readonly RendererConsumer[];
  project: ReadonlyRendererSnapshotProject;
}

export interface SerializedEditorStateProjection {
  projectionVersion: typeof EDITOR_STATE_PROJECTION_VERSION;
  projectedAt: string;
  consumers: RendererConsumer[];
  project: RendererSnapshotProject;
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
  renderHeight?: number;
  renderVerticalOffset?: number;
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

export interface RenderAssetLabelMetadata {
  text: string;
  position: RenderScenePoint;
}

export interface RenderAssetRoomMetadata {
  assetId: string;
  floorId: string;
  roomId: string;
  roomName: string;
  area: number;
  polygonVertexCount: number;
  sharedBoundaryCount: number;
  wallEdgeIds: readonly string[];
  openingAssetIds: readonly string[];
  bounds: RenderSceneBounds | null;
  label: RenderAssetLabelMetadata | null;
}

export interface RenderAssetOpeningMetadata {
  assetId: string;
  floorId: string;
  roomId: string;
  openingId: string;
  openingType: string;
  attachedEdgeId: string;
  edgeRelativePosition: number;
  anchor: RenderScenePoint | null;
}

export interface RenderAssetVerticalConnectorMetadata {
  assetId: string;
  floorId: string;
  connectorId: string;
  connectorType: string;
  roomId: string;
  targetFloorId: string;
  position: RenderScenePoint;
}

export interface RenderAssetFloorMetadata {
  assetId: string;
  floorId: string;
  floorName: string;
  floorHeight: number;
  referenceImage: string | null;
  isActive: boolean;
  verticalOffset: number;
  renderHeight: number | null;
  renderVerticalOffset: number | null;
  roomCount: number;
  openingCount: number;
  verticalConnectorCount: number;
  roomAssetIds: readonly string[];
  openingAssetIds: readonly string[];
  verticalConnectorAssetIds: readonly string[];
  bounds: RenderSceneBounds | null;
}

export interface RenderAssetProjectMetadata {
  projectId: string;
  projectName: string;
  objectVersion: number;
  defaultFloorId: string | null;
  floors: readonly RenderAssetFloorMetadata[];
  rooms: readonly RenderAssetRoomMetadata[];
  openings: readonly RenderAssetOpeningMetadata[];
  verticalConnectors: readonly RenderAssetVerticalConnectorMetadata[];
}

export interface ReadonlyRenderAssetMapping {
  projectionVersion: number;
  projectedAt: string;
  consumers: readonly RendererConsumer[];
  project: RenderAssetProjectMetadata;
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
    "renderHeight",
    "renderVerticalOffset",
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
  assetMapping: Object.freeze([
    "projectionVersion",
    "projectedAt",
    "consumers",
    "project",
  ]),
  assetProject: Object.freeze([
    "projectId",
    "projectName",
    "objectVersion",
    "defaultFloorId",
    "floors",
    "rooms",
    "openings",
    "verticalConnectors",
  ]),
  assetFloor: Object.freeze([
    "assetId",
    "floorId",
    "floorName",
    "floorHeight",
    "referenceImage",
    "isActive",
    "verticalOffset",
    "renderHeight",
    "renderVerticalOffset",
    "roomCount",
    "openingCount",
    "verticalConnectorCount",
    "roomAssetIds",
    "openingAssetIds",
    "verticalConnectorAssetIds",
    "bounds",
  ]),
  assetRoom: Object.freeze([
    "assetId",
    "floorId",
    "roomId",
    "roomName",
    "area",
    "polygonVertexCount",
    "sharedBoundaryCount",
    "wallEdgeIds",
    "openingAssetIds",
    "bounds",
    "label",
  ]),
  assetOpening: Object.freeze([
    "assetId",
    "floorId",
    "roomId",
    "openingId",
    "openingType",
    "attachedEdgeId",
    "edgeRelativePosition",
    "anchor",
  ]),
  assetVerticalConnector: Object.freeze([
    "assetId",
    "floorId",
    "connectorId",
    "connectorType",
    "roomId",
    "targetFloorId",
    "position",
  ]),
  editorStateProjection: Object.freeze([
    "projectionVersion",
    "projectedAt",
    "consumers",
    "project",
  ]),
});
