import type {
  EditorFloor,
  EditorPoint,
  EditorVerticalConnector,
  RoomOpening,
} from "@/domain/editor-state";
import type { ViewerCameraMode } from "@/features/viewer/viewer-camera-mode";

export interface Viewer25DRoomSceneNode {
  readonly nodeId: string;
  readonly floorId: string;
  readonly roomId: string;
  readonly roomName: string;
  readonly points: readonly EditorPoint[];
  readonly openings: readonly RoomOpening[];
  readonly floorHeight: number;
  readonly floorRenderY: number;
  readonly colorIndex: number;
  readonly isActive: boolean;
}

export interface Viewer25DExteriorSceneNode {
  readonly nodeId: string;
  readonly points: readonly EditorPoint[];
  readonly totalHeight: number;
}

export interface Viewer25DGuideObjectSceneNode {
  readonly nodeId: string;
  readonly floorId: string;
  readonly roomId: string | null;
  readonly guideObjectId: string;
  readonly name: string;
  readonly position: EditorPoint;
  readonly floorRenderY: number;
  readonly isActive: boolean;
}

export interface Viewer25DVerticalConnectorSceneNode {
  readonly nodeId: string;
  readonly floorId: string;
  readonly roomId: string;
  readonly connectorId: string;
  readonly connectorType: EditorVerticalConnector["connectorType"];
  readonly targetFloorId: string;
  readonly position: EditorPoint;
  readonly floorRenderY: number;
  readonly isActive: boolean;
}

export interface Viewer25DSceneGraph {
  readonly sceneGraphId: string;
  readonly roomNodes: readonly Viewer25DRoomSceneNode[];
  readonly exteriorNode: Viewer25DExteriorSceneNode | null;
  readonly exteriorOpeningNodes: readonly RoomOpening[];
  readonly guideObjectNodes: readonly Viewer25DGuideObjectSceneNode[];
  readonly verticalConnectorNodes: readonly Viewer25DVerticalConnectorSceneNode[];
}

export interface Viewer25DRenderPlan {
  readonly cameraMode: ViewerCameraMode;
  readonly sceneGraph: Viewer25DSceneGraph;
  readonly roomNodes: readonly Viewer25DRoomSceneNode[];
  readonly exteriorNode: Viewer25DExteriorSceneNode | null;
  readonly exteriorOpeningNodes: readonly RoomOpening[];
  readonly guideObjectNodes: readonly Viewer25DGuideObjectSceneNode[];
  readonly verticalConnectorNodes: readonly Viewer25DVerticalConnectorSceneNode[];
}

export interface Viewer25DSceneGeometrySource {
  readonly sceneGraph: Viewer25DSceneGraph;
  readonly roomNodes: readonly Viewer25DRoomSceneNode[];
  readonly exteriorNode: Viewer25DExteriorSceneNode | null;
  readonly exteriorOpeningNodes: readonly RoomOpening[];
  readonly guideObjectNodes: readonly Viewer25DGuideObjectSceneNode[];
  readonly verticalConnectorNodes: readonly Viewer25DVerticalConnectorSceneNode[];
}

export function createViewer25DSceneGraph(input: {
  floors: readonly EditorFloor[];
  activeFloorId: string | null;
  exteriorPolygon?: readonly EditorPoint[] | null;
  exteriorEdgeOpenings?: readonly RoomOpening[] | null;
  floorRenderOffsets: readonly number[];
}): Viewer25DSceneGraph {
  const totalHeight = input.floors.reduce((sum, floor) => sum + floor.floorHeight, 0);
  const roomNodes = input.floors.flatMap((floor, colorIndex) =>
    floor.rooms.map((room) =>
      Object.freeze({
        nodeId: `${floor.floorId}:${room.roomId}`,
        floorId: floor.floorId,
        roomId: room.roomId,
        roomName: room.roomName,
        points: room.roomPolygon,
        openings: room.openings ?? [],
        floorHeight: floor.floorHeight,
        floorRenderY: input.floorRenderOffsets[colorIndex] ?? 0,
        colorIndex,
        isActive: input.activeFloorId == null || floor.floorId === input.activeFloorId,
      }),
    ),
  );
  const guideObjectNodes = input.floors.flatMap((floor, floorIndex) =>
    createGuideObjectSceneNodes(
      floor,
      input.floorRenderOffsets[floorIndex] ?? 0,
      input.activeFloorId,
    ),
  );
  const verticalConnectorNodes = input.floors.flatMap((floor, floorIndex) =>
    createVerticalConnectorSceneNodes(
      floor,
      input.floorRenderOffsets[floorIndex] ?? 0,
      input.activeFloorId,
    ),
  );
  const exteriorNode =
    input.exteriorPolygon != null && input.exteriorPolygon.length >= 3
      ? Object.freeze({
          nodeId: "exterior-envelope",
          points: input.exteriorPolygon,
          totalHeight,
        })
      : null;

  return Object.freeze({
    sceneGraphId: "viewer25d-shared-scene",
    roomNodes: Object.freeze(roomNodes),
    exteriorNode,
    exteriorOpeningNodes: Object.freeze(input.exteriorEdgeOpenings ?? []),
    guideObjectNodes: Object.freeze(guideObjectNodes),
    verticalConnectorNodes: Object.freeze(verticalConnectorNodes),
  });
}

export function resolveViewer25DRenderPlan(input: {
  sceneGraph: Viewer25DSceneGraph;
  cameraMode: ViewerCameraMode;
}): Viewer25DRenderPlan {
  const geometrySource = resolveViewer25DSceneGeometrySource(input);

  return Object.freeze({
    cameraMode: input.cameraMode,
    sceneGraph: geometrySource.sceneGraph,
    roomNodes: geometrySource.roomNodes,
    exteriorNode: geometrySource.exteriorNode,
    exteriorOpeningNodes: geometrySource.exteriorOpeningNodes,
    guideObjectNodes: geometrySource.guideObjectNodes,
    verticalConnectorNodes: geometrySource.verticalConnectorNodes,
  });
}

export function resolveViewer25DSceneGeometrySource(input: {
  sceneGraph: Viewer25DSceneGraph;
  cameraMode: ViewerCameraMode;
}): Viewer25DSceneGeometrySource {
  if (input.cameraMode === "top-down-orthographic") {
    return createSharedSceneGeometrySource(input.sceneGraph);
  }

  return createSharedSceneGeometrySource(input.sceneGraph);
}

function createGuideObjectSceneNodes(
  floor: EditorFloor,
  floorRenderY: number,
  activeFloorId: string | null,
): readonly Viewer25DGuideObjectSceneNode[] {
  return (floor.guideObjects ?? []).map((guideObject) =>
    Object.freeze({
      nodeId: `${floor.floorId}:guide-object:${guideObject.guideObjectId}`,
      floorId: floor.floorId,
      roomId: guideObject.roomId ?? null,
      guideObjectId: guideObject.guideObjectId,
      name: guideObject.name,
      position: guideObject.position,
      floorRenderY,
      isActive: activeFloorId == null || floor.floorId === activeFloorId,
    }),
  );
}

function createVerticalConnectorSceneNodes(
  floor: EditorFloor,
  floorRenderY: number,
  activeFloorId: string | null,
): readonly Viewer25DVerticalConnectorSceneNode[] {
  return (floor.verticalConnectors ?? []).map((connector) =>
    Object.freeze({
      nodeId: `${floor.floorId}:vertical-connector:${connector.connectorId}`,
      floorId: floor.floorId,
      roomId: connector.roomId,
      connectorId: connector.connectorId,
      connectorType: connector.connectorType,
      targetFloorId: connector.targetFloorId,
      position: connector.position,
      floorRenderY,
      isActive: activeFloorId == null || floor.floorId === activeFloorId,
    }),
  );
}

function createSharedSceneGeometrySource(
  sceneGraph: Viewer25DSceneGraph,
): Viewer25DSceneGeometrySource {
  return Object.freeze({
    sceneGraph,
    roomNodes: sceneGraph.roomNodes,
    exteriorNode: sceneGraph.exteriorNode,
    exteriorOpeningNodes: sceneGraph.exteriorOpeningNodes,
    guideObjectNodes: sceneGraph.guideObjectNodes,
    verticalConnectorNodes: sceneGraph.verticalConnectorNodes,
  });
}
