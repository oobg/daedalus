import type {
  ReadonlyEditorStateProjection,
  ReadonlyRendererSnapshotProject,
  ReadonlyRenderAssetMapping,
  RenderAssetOpeningMetadata,
  RenderAssetProjectMetadata,
  RenderAssetRoomMetadata,
  RenderAssetVerticalConnectorMetadata,
  RenderSceneBounds,
  RenderSceneData,
  RenderScenePoint,
} from "./renderer-contract.ts";
import { adaptProjectSnapshotToRenderScene } from "./renderer-input-adapter.ts";

export function mapProjectSnapshotToRenderAssetMetadata(
  project: ReadonlyRendererSnapshotProject,
): Readonly<RenderAssetProjectMetadata> {
  const scene = adaptProjectSnapshotToRenderScene(project);
  return buildRenderAssetProjectMetadata(scene);
}

export function mapReadonlyEditorStateProjectionToRenderAssetMetadata(
  projection: ReadonlyEditorStateProjection,
): Readonly<ReadonlyRenderAssetMapping> {
  return deepFreeze({
    projectionVersion: projection.projectionVersion,
    projectedAt: projection.projectedAt,
    consumers: [...projection.consumers],
    project: mapProjectSnapshotToRenderAssetMetadata(projection.project),
  });
}

function buildRenderAssetProjectMetadata(
  scene: Readonly<RenderSceneData>,
): Readonly<RenderAssetProjectMetadata> {
  const rooms: RenderAssetRoomMetadata[] = [];
  const openings: RenderAssetOpeningMetadata[] = [];
  const verticalConnectors: RenderAssetVerticalConnectorMetadata[] = [];

  const floors = scene.floors.map((floor) => {
    const roomAssetIds: string[] = [];
    const openingAssetIds: string[] = [];
    const verticalConnectorAssetIds: string[] = [];

    for (const room of floor.rooms) {
      const roomAssetId = createRoomAssetId(floor.floorId, room.roomId);
      roomAssetIds.push(roomAssetId);

      const roomOpeningAssetIds = room.openings.map((opening) => {
        const assetId = createOpeningAssetId(
          floor.floorId,
          room.roomId,
          opening.openingId,
        );
        openingAssetIds.push(assetId);
        openings.push({
          assetId,
          floorId: floor.floorId,
          roomId: room.roomId,
          openingId: opening.openingId,
          openingType: opening.openingType,
          attachedEdgeId: opening.attachedEdgeId,
          edgeRelativePosition: opening.edgeRelativePosition,
          anchor:
            opening.anchor == null ? null : clonePoint(opening.anchor),
        });
        return assetId;
      });

      rooms.push({
        assetId: roomAssetId,
        floorId: floor.floorId,
        roomId: room.roomId,
        roomName: room.roomName,
        area: room.area,
        polygonVertexCount: room.polygon.length,
        sharedBoundaryCount: room.boundaries.length,
        wallEdgeIds: room.walls.map((wall) => wall.edgeId),
        openingAssetIds: roomOpeningAssetIds,
        bounds: room.bounds == null ? null : { ...room.bounds },
        label:
          room.labelPosition == null
            ? null
            : {
                text: room.roomName,
                position: clonePoint(room.labelPosition),
              },
      });
    }

    for (const connector of floor.verticalConnectors) {
      const assetId = createVerticalConnectorAssetId(
        floor.floorId,
        connector.connectorId,
      );
      verticalConnectorAssetIds.push(assetId);
      verticalConnectors.push({
        assetId,
        floorId: floor.floorId,
        connectorId: connector.connectorId,
        connectorType: connector.connectorType,
        roomId: connector.roomId,
        targetFloorId: connector.targetFloorId,
        position: clonePoint(connector.position),
      });
    }

    return {
      assetId: createFloorAssetId(floor.floorId),
      floorId: floor.floorId,
      floorName: floor.floorName,
      floorHeight: floor.floorHeight,
      referenceImage: floor.referenceImage,
      isActive: floor.isActive,
      verticalOffset: floor.verticalOffset,
      renderHeight: floor.renderHeight ?? null,
      renderVerticalOffset: floor.renderVerticalOffset ?? null,
      roomCount: floor.rooms.length,
      openingCount: openingAssetIds.length,
      verticalConnectorCount: verticalConnectorAssetIds.length,
      roomAssetIds,
      openingAssetIds,
      verticalConnectorAssetIds,
      bounds: calculateFloorBounds(floor.rooms.map((room) => room.bounds)),
    };
  });

  return deepFreeze({
    projectId: scene.projectId,
    projectName: scene.projectName,
    objectVersion: scene.objectVersion,
    defaultFloorId: scene.activeFloorId,
    floors,
    rooms,
    openings,
    verticalConnectors,
  });
}

function calculateFloorBounds(
  roomBounds: readonly (RenderSceneBounds | null)[],
): RenderSceneBounds | null {
  const validBounds = roomBounds.filter((bounds) => bounds != null);

  if (validBounds.length === 0) {
    return null;
  }

  return {
    minX: Math.min(...validBounds.map((bounds) => bounds.minX)),
    minY: Math.min(...validBounds.map((bounds) => bounds.minY)),
    maxX: Math.max(...validBounds.map((bounds) => bounds.maxX)),
    maxY: Math.max(...validBounds.map((bounds) => bounds.maxY)),
  };
}

function createFloorAssetId(floorId: string): string {
  return `floor:${floorId}`;
}

function createRoomAssetId(floorId: string, roomId: string): string {
  return `room:${floorId}:${roomId}`;
}

function createOpeningAssetId(
  floorId: string,
  roomId: string,
  openingId: string,
): string {
  return `opening:${floorId}:${roomId}:${openingId}`;
}

function createVerticalConnectorAssetId(
  floorId: string,
  connectorId: string,
): string {
  return `connector:${floorId}:${connectorId}`;
}

function clonePoint(point: RenderScenePoint): RenderScenePoint {
  return {
    x: point.x,
    y: point.y,
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
