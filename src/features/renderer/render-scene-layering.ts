import { resolveRoomLayerElevations } from "../../components/viewer/viewer25dGeometry.ts";
import { resolveFurnitureBaseElevation } from "../viewer/furniture-base-elevation.ts";
import type { RenderSceneRoomLayers } from "./renderer-contract.ts";

const ROOM_LAYER_ELEVATIONS = resolveRoomLayerElevations();
const FLOOR_BASE_ELEVATION = roundElevation(ROOM_LAYER_ELEVATIONS.floorBaseOffset);
const FURNITURE_BASE_ELEVATION = roundElevation(
  resolveFurnitureBaseElevation(FLOOR_BASE_ELEVATION),
);
const WALL_BASE_ELEVATION = roundElevation(ROOM_LAYER_ELEVATIONS.wallBaseOffset);

export function resolveRenderSceneRoomLayers(): Readonly<RenderSceneRoomLayers> {
  const orderedLayers = [
    { elementClass: "floor" as const, baseElevation: FLOOR_BASE_ELEVATION },
    {
      elementClass: "furniture" as const,
      baseElevation: FURNITURE_BASE_ELEVATION,
    },
    { elementClass: "wall" as const, baseElevation: WALL_BASE_ELEVATION },
  ].sort((left, right) => left.baseElevation - right.baseElevation);

  return deepFreeze({
    floor: {
      elementClass: "floor",
      order: orderedLayers.findIndex((layer) => layer.elementClass === "floor"),
      baseElevation: FLOOR_BASE_ELEVATION,
    },
    furniture: {
      elementClass: "furniture",
      order: orderedLayers.findIndex(
        (layer) => layer.elementClass === "furniture",
      ),
      baseElevation: FURNITURE_BASE_ELEVATION,
    },
    wall: {
      elementClass: "wall",
      order: orderedLayers.findIndex((layer) => layer.elementClass === "wall"),
      baseElevation: WALL_BASE_ELEVATION,
    },
  });
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

function roundElevation(value: number): number {
  return Math.round(value * 1e6) / 1e6;
}
