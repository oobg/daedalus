import {
  DEFAULT_WALL_HEIGHT_SCALE,
  resolveViewer25DFloorRenderPlacements,
} from "../../components/viewer/viewer25dGeometry.ts";
import type {
  ReadonlyRendererSnapshotProject,
  RendererSnapshotFloor,
  RenderSceneData,
} from "./renderer-contract.ts";
import { adaptSnapshotFloorToRenderSceneFloor } from "./floor-render-primitives.ts";

export function adaptProjectSnapshotToRenderScene(
  project: ReadonlyRendererSnapshotProject,
): Readonly<RenderSceneData> {
  const placements = new Map(
    resolveViewer25DFloorRenderPlacements(
      project.floors.map((floor) => ({
        floorId: floor.floorId,
        floorHeight: floor.floorHeight,
      })),
      DEFAULT_WALL_HEIGHT_SCALE,
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
        ...adaptSnapshotFloorToRenderSceneFloor(floor, {
          verticalOffset: placement.verticalOffset,
          renderVerticalOffset: placement.renderVerticalOffset,
          isActive: floor.floorId === activeFloorId,
          heightScale: DEFAULT_WALL_HEIGHT_SCALE,
        }),
      };
    }),
  };

  return deepFreeze(scene);
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
