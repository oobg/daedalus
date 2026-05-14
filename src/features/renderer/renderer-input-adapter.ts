import { resolveFloorVerticalPlacements } from "../../domain/floor.ts";
import type {
  RendererSnapshotFloor,
  RendererSnapshotOpening,
  RendererSnapshotPoint,
  RendererSnapshotProject,
  RendererSnapshotRoom,
  RendererSnapshotVerticalConnector,
  RenderSceneBounds,
  RenderSceneData,
  RenderSceneFloor,
  RenderSceneOpening,
  RenderScenePoint,
  RenderSceneRoom,
  RenderSceneVerticalConnector,
  RenderSceneWallSegment,
} from "./renderer-contract.ts";
import { resolveRenderSceneRoomLayers } from "./render-scene-layering.ts";

export function adaptProjectSnapshotToRenderScene(
  project: RendererSnapshotProject,
): Readonly<RenderSceneData> {
  const placements = new Map(
    resolveFloorVerticalPlacements(
      project.floors.map((floor) => ({
        id: floor.floorId,
        name: floor.floorName,
        height: floor.floorHeight,
        referenceImage: floor.referenceImage,
      })),
    ).map((placement) => [placement.floorId, placement]),
  );

  const activeFloorId = resolveActiveFloorId(
    project.floors,
    project.viewState.activeFloorId,
  );

  const scene: RenderSceneData = {
    projectId: project.projectId,
    projectName: project.projectName,
    objectVersion: project.objectVersion,
    activeFloorId,
    selectedRoomId: project.viewState.selectedRoomId ?? null,
    floors: project.floors.map((floor) => {
      const placement = placements.get(floor.floorId);

      if (placement == null) {
        throw new Error(`Floor "${floor.floorId}" is missing vertical placement.`);
      }

      return {
        floorId: floor.floorId,
        floorName: floor.floorName,
        floorHeight: floor.floorHeight,
        verticalOffset: placement.offset,
        referenceImage: floor.referenceImage,
        isActive: floor.floorId === activeFloorId,
        rooms: floor.rooms.map(adaptRoomToScene),
        verticalConnectors: (floor.verticalConnectors ?? []).map(
          adaptVerticalConnectorToScene,
        ),
      };
    }),
  };

  return deepFreeze(scene);
}

function adaptRoomToScene(room: RendererSnapshotRoom): RenderSceneRoom {
  const polygon = room.roomPolygon.map(clonePoint);
  const walls = deriveWalls(room);
  const wallsByEdgeId = new Map(walls.map((wall) => [wall.edgeId, wall]));

  return {
    roomId: room.roomId,
    roomName: room.roomName,
    polygon,
    boundaries: room.sharedBoundaries.map((boundary) => ({
      edgeId: boundary.edgeId,
      adjacentRoomId: boundary.adjacentRoomId,
      adjacentEdgeId: boundary.adjacentEdgeId,
    })),
    area: room.area,
    labelPosition:
      room.labelPosition == null ? null : clonePoint(room.labelPosition),
    bounds: calculateBounds(polygon),
    layers: resolveRenderSceneRoomLayers(),
    walls,
    openings: (room.openings ?? []).map((opening) =>
      adaptOpeningToScene(opening, wallsByEdgeId),
    ),
  };
}

function adaptVerticalConnectorToScene(
  connector: RendererSnapshotVerticalConnector,
): RenderSceneVerticalConnector {
  return {
    connectorId: connector.connectorId,
    connectorType: connector.connectorType,
    roomId: connector.roomId,
    targetFloorId: connector.targetFloorId,
    position: clonePoint(connector.position),
  };
}

function adaptOpeningToScene(
  opening: RendererSnapshotOpening,
  wallsByEdgeId: ReadonlyMap<string, RenderSceneWallSegment>,
): RenderSceneOpening {
  const wall = wallsByEdgeId.get(opening.attachedEdgeId);

  return {
    openingId: opening.openingId,
    openingType: opening.openingType,
    attachedEdgeId: opening.attachedEdgeId,
    edgeRelativePosition: opening.edgeRelativePosition,
    anchor:
      wall == null
        ? null
        : interpolateAlongEdge(
            wall.start,
            wall.end,
            opening.edgeRelativePosition,
          ),
  };
}

function deriveWalls(room: RendererSnapshotRoom): RenderSceneWallSegment[] {
  if (room.walls != null && room.walls.length > 0) {
    return room.walls.map((wall) => ({
      edgeId: wall.edgeId,
      start: clonePoint(wall.start),
      end: clonePoint(wall.end),
    }));
  }

  if (room.roomPolygon.length < 2) {
    return [];
  }

  return room.roomPolygon.slice(0, -1).map((start, index) => {
    const end = room.roomPolygon[index + 1];

    return {
      edgeId: `${room.roomId}:edge:${index}`,
      start: clonePoint(start),
      end: clonePoint(end),
    };
  });
}

function calculateBounds(
  polygon: readonly RenderScenePoint[],
): RenderSceneBounds | null {
  if (polygon.length === 0) {
    return null;
  }

  let minX = polygon[0].x;
  let minY = polygon[0].y;
  let maxX = polygon[0].x;
  let maxY = polygon[0].y;

  for (let index = 1; index < polygon.length; index += 1) {
    const point = polygon[index];
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
  };
}

function interpolateAlongEdge(
  start: RenderScenePoint,
  end: RenderScenePoint,
  relativePosition: number,
): RenderScenePoint {
  return {
    x: start.x + (end.x - start.x) * relativePosition,
    y: start.y + (end.y - start.y) * relativePosition,
  };
}

function clonePoint(point: RendererSnapshotPoint): RenderScenePoint {
  return {
    x: point.x,
    y: point.y,
  };
}

function resolveActiveFloorId(
  floors: readonly RendererSnapshotFloor[],
  activeFloorId: string | null,
): string | null {
  if (activeFloorId == null) {
    return floors[0]?.floorId ?? null;
  }

  return floors.some((floor) => floor.floorId === activeFloorId)
    ? activeFloorId
    : floors[0]?.floorId ?? null;
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
