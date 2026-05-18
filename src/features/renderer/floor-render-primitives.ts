import {
  DEFAULT_WALL_HEIGHT_SCALE,
  resolveViewer25DFloorExtrusionDepth,
} from "../../components/viewer/viewer25dGeometry.ts";
import type {
  RendererSnapshotFloor,
  RendererSnapshotOpening,
  RendererSnapshotPoint,
  RendererSnapshotRoom,
  RendererSnapshotVerticalConnector,
  RenderSceneBounds,
  RenderSceneFloor,
  RenderSceneOpening,
  RenderScenePoint,
  RenderSceneRoom,
  RenderSceneVerticalConnector,
  RenderSceneWallSegment,
} from "./renderer-contract.ts";
import { resolveRenderSceneRoomLayers } from "./render-scene-layering.ts";

export interface RenderSceneFloorPrimitiveOptions {
  verticalOffset: number;
  renderVerticalOffset: number;
  isActive: boolean;
  heightScale?: number;
}

export function adaptSnapshotFloorToRenderSceneFloor(
  floor: RendererSnapshotFloor,
  options: RenderSceneFloorPrimitiveOptions,
): Readonly<RenderSceneFloor> {
  const renderHeight = resolveViewer25DFloorExtrusionDepth(
    floor.floorHeight,
    options.heightScale ?? DEFAULT_WALL_HEIGHT_SCALE,
  );

  return deepFreeze({
    floorId: floor.floorId,
    floorName: floor.floorName,
    floorHeight: floor.floorHeight,
    verticalOffset: options.verticalOffset,
    renderHeight,
    renderVerticalOffset: options.renderVerticalOffset,
    referenceImage: floor.referenceImage,
    isActive: options.isActive,
    rooms: floor.rooms.map(adaptRoomToScene),
    verticalConnectors: (floor.verticalConnectors ?? []).map(
      adaptVerticalConnectorToScene,
    ),
  });
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

function deepFreeze<T>(value: T): Readonly<T> {
  if (value == null || typeof value !== "object" || Object.isFrozen(value)) {
    return value as Readonly<T>;
  }

  for (const nestedValue of Object.values(value)) {
    deepFreeze(nestedValue);
  }

  return Object.freeze(value);
}
