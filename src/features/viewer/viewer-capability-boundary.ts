import type { RenderSceneData } from "../renderer/renderer-contract.ts";
import type { RendererPort } from "../renderer/renderer-entrypoint.ts";
import { assertViewerExportCompositionInput } from "./viewer-export-composition-guard.ts";

export interface LoadedViewerScene<Output> {
  getScene(): Readonly<RenderSceneData>;
  render(): Output;
}

export interface ViewerComposition<Output> {
  createLoadedSceneViewer(
    scene: Readonly<RenderSceneData>,
  ): LoadedViewerScene<Output>;
  renderScene(scene: Readonly<RenderSceneData>): Output;
}

export function createViewerComposition<Output>(
  renderer: RendererPort<Output>,
): ViewerComposition<Output> {
  const guardedRenderer = assertViewerExportCompositionInput(renderer);

  return {
    createLoadedSceneViewer(scene) {
      const loadedScene = cloneRenderScene(scene);

      return {
        getScene() {
          return loadedScene;
        },
        render() {
          return guardedRenderer.render(loadedScene);
        },
      };
    },
    renderScene(scene) {
      return guardedRenderer.render(cloneRenderScene(scene));
    },
  };
}

function cloneRenderScene(
  scene: Readonly<RenderSceneData>,
): Readonly<RenderSceneData> {
  return deepFreeze({
    projectId: scene.projectId,
    projectName: scene.projectName,
    objectVersion: scene.objectVersion,
    activeFloorId: scene.activeFloorId,
    selectedRoomId: scene.selectedRoomId,
    floors: scene.floors.map((floor) => ({
      floorId: floor.floorId,
      floorName: floor.floorName,
      floorHeight: floor.floorHeight,
      verticalOffset: floor.verticalOffset,
      referenceImage: floor.referenceImage,
      isActive: floor.isActive,
      rooms: floor.rooms.map((room) => ({
        roomId: room.roomId,
        roomName: room.roomName,
        polygon: room.polygon.map(clonePoint),
        boundaries: room.boundaries.map((boundary) => ({
          edgeId: boundary.edgeId,
          adjacentRoomId: boundary.adjacentRoomId,
          adjacentEdgeId: boundary.adjacentEdgeId,
        })),
        area: room.area,
        labelPosition:
          room.labelPosition == null ? null : clonePoint(room.labelPosition),
        bounds:
          room.bounds == null
            ? null
            : {
                minX: room.bounds.minX,
                minY: room.bounds.minY,
                maxX: room.bounds.maxX,
                maxY: room.bounds.maxY,
              },
        layers: {
          floor: {
            elementClass: room.layers.floor.elementClass,
            order: room.layers.floor.order,
            baseElevation: room.layers.floor.baseElevation,
          },
          furniture: {
            elementClass: room.layers.furniture.elementClass,
            order: room.layers.furniture.order,
            baseElevation: room.layers.furniture.baseElevation,
          },
          wall: {
            elementClass: room.layers.wall.elementClass,
            order: room.layers.wall.order,
            baseElevation: room.layers.wall.baseElevation,
          },
        },
        walls: room.walls.map((wall) => ({
          edgeId: wall.edgeId,
          start: clonePoint(wall.start),
          end: clonePoint(wall.end),
        })),
        openings: room.openings.map((opening) => ({
          openingId: opening.openingId,
          openingType: opening.openingType,
          attachedEdgeId: opening.attachedEdgeId,
          edgeRelativePosition: opening.edgeRelativePosition,
          anchor: opening.anchor == null ? null : clonePoint(opening.anchor),
        })),
      })),
      verticalConnectors: floor.verticalConnectors.map((connector) => ({
        connectorId: connector.connectorId,
        connectorType: connector.connectorType,
        roomId: connector.roomId,
        targetFloorId: connector.targetFloorId,
        position: clonePoint(connector.position),
      })),
    })),
  });
}

function clonePoint(point: { x: number; y: number }) {
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
