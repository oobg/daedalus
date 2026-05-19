import type { EditorPoint, RoomOpening } from "../../domain/editor-state.ts";
import type { ViewerCameraMode } from "../../features/viewer/viewer-camera-mode.ts";
import type {
  Viewer25DGuideObjectSceneNode,
  Viewer25DRoomSceneNode,
  Viewer25DSceneGeometrySource,
  Viewer25DVerticalConnectorSceneNode,
} from "./viewer25dSceneGraph.ts";
import type { WorldSpaceEditHandleDefinition } from "./worldSpaceEditHandles.ts";

const WORLD_UNITS_PER_EDITOR_UNIT = 100;
const TOP_DOWN_HANDLE_ELEVATION = 0.02;

export type TopDownHandleEntityKind =
  | "room-vertex"
  | "exterior-vertex"
  | "room-opening"
  | "guide-object"
  | "vertical-connector";

export interface TopDownHandleOverlayDescriptor
  extends WorldSpaceEditHandleDefinition {
  readonly entityKind: TopDownHandleEntityKind;
  readonly floorId: string | null;
  readonly roomId: string | null;
}

export interface TopDownHandleOverlaySceneAdapterInput {
  readonly geometrySource: Viewer25DSceneGeometrySource;
  readonly cameraMode: ViewerCameraMode;
}

export function resolveTopDownHandleOverlayDescriptors(
  input: TopDownHandleOverlaySceneAdapterInput,
): readonly TopDownHandleOverlayDescriptor[] {
  if (input.cameraMode !== "top-down-orthographic") {
    return Object.freeze([]);
  }

  return Object.freeze([
    ...createRoomVertexHandles(input.geometrySource.roomNodes),
    ...createRoomOpeningHandles(input.geometrySource.roomNodes),
    ...createGuideObjectHandles(input.geometrySource.guideObjectNodes),
    ...createVerticalConnectorHandles(input.geometrySource.verticalConnectorNodes),
    ...createExteriorVertexHandles(input.geometrySource.exteriorNode?.points ?? null, 0),
  ]);
}

function createRoomVertexHandles(
  roomNodes: readonly Viewer25DRoomSceneNode[],
): TopDownHandleOverlayDescriptor[] {
  return roomNodes.flatMap((roomNode) =>
    roomNode.isActive
      ? roomNode.points.map((point, vertexIndex) =>
      createHandleDescriptor({
        id: `${roomNode.floorId}:${roomNode.roomId}:vertex:${vertexIndex}`,
        label: `${roomNode.roomName} vertex ${vertexIndex + 1}`,
        entityKind: "room-vertex",
        floorId: roomNode.floorId,
        roomId: roomNode.roomId,
        point,
        worldY: roomNode.floorRenderY + TOP_DOWN_HANDLE_ELEVATION,
      }),
    )
      : [],
  );
}

function createRoomOpeningHandles(
  roomNodes: readonly Viewer25DRoomSceneNode[],
): TopDownHandleOverlayDescriptor[] {
  return roomNodes.flatMap((roomNode) =>
    roomNode.isActive
      ? roomNode.openings.map((opening) =>
      createOpeningHandleDescriptor(
        roomNode.floorId,
        roomNode.roomId,
        opening,
        roomNode.floorRenderY + TOP_DOWN_HANDLE_ELEVATION,
      ),
    )
      : [],
  );
}

function createGuideObjectHandles(
  guideObjectNodes: readonly Viewer25DGuideObjectSceneNode[],
): TopDownHandleOverlayDescriptor[] {
  return guideObjectNodes.flatMap((guideObjectNode) =>
    guideObjectNode.isActive
      ? [
          createHandleDescriptor({
            id: guideObjectNode.nodeId,
            label: guideObjectNode.name,
            entityKind: "guide-object",
            floorId: guideObjectNode.floorId,
            roomId: guideObjectNode.roomId,
            point: guideObjectNode.position,
            worldY: guideObjectNode.floorRenderY + TOP_DOWN_HANDLE_ELEVATION,
          }),
        ]
      : [],
  );
}

function createVerticalConnectorHandles(
  verticalConnectorNodes: readonly Viewer25DVerticalConnectorSceneNode[],
): TopDownHandleOverlayDescriptor[] {
  return verticalConnectorNodes.flatMap((connectorNode) =>
    connectorNode.isActive
      ? [
          createHandleDescriptor({
            id: connectorNode.nodeId,
            label: `${connectorNode.connectorType} to ${connectorNode.targetFloorId}`,
            entityKind: "vertical-connector",
            floorId: connectorNode.floorId,
            roomId: connectorNode.roomId,
            point: connectorNode.position,
            worldY: connectorNode.floorRenderY + TOP_DOWN_HANDLE_ELEVATION,
          }),
        ]
      : [],
  );
}

function createExteriorVertexHandles(
  exteriorPolygon: readonly EditorPoint[] | null,
  worldY: number,
): TopDownHandleOverlayDescriptor[] {
  return (exteriorPolygon ?? []).map((point, vertexIndex) =>
    createHandleDescriptor({
      id: `exterior:vertex:${vertexIndex}`,
      label: `Exterior vertex ${vertexIndex + 1}`,
      entityKind: "exterior-vertex",
      floorId: null,
      roomId: null,
      point,
      worldY,
    }),
  );
}

function createOpeningHandleDescriptor(
  floorId: string,
  roomId: string,
  opening: RoomOpening,
  worldY: number,
): TopDownHandleOverlayDescriptor {
  return createHandleDescriptor({
    id: `${floorId}:${roomId}:opening:${opening.id}`,
    label: `${opening.type} marker`,
    entityKind: "room-opening",
    floorId,
    roomId,
    point: {
      x: opening.x,
      y: opening.y,
    },
    worldY,
  });
}

function createHandleDescriptor(input: {
  id: string;
  label: string;
  entityKind: TopDownHandleEntityKind;
  floorId: string | null;
  roomId: string | null;
  point: EditorPoint;
  worldY: number;
}): TopDownHandleOverlayDescriptor {
  return Object.freeze({
    id: input.id,
    label: input.label,
    entityKind: input.entityKind,
    floorId: input.floorId,
    roomId: input.roomId,
    worldPosition: {
      x: input.point.x / WORLD_UNITS_PER_EDITOR_UNIT,
      y: input.worldY,
      z: input.point.y / WORLD_UNITS_PER_EDITOR_UNIT,
    },
  });
}
