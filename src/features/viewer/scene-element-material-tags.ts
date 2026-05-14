import type { RenderSceneData } from "../renderer/renderer-contract.ts";

export type SceneElementMaterialTag = "wall" | "wood-accent" | "glass";

export type SceneElementKind =
  | "room-floor"
  | "wall-segment"
  | "opening"
  | "vertical-connector";

export interface SceneElementMaterialAssignment {
  elementId: string;
  elementKind: SceneElementKind;
  floorId: string;
  roomId: string | null;
  sourceId: string;
  materialTag: SceneElementMaterialTag;
}

export function classifySceneElementMaterialTags(
  scene: RenderSceneData,
): readonly Readonly<SceneElementMaterialAssignment>[] {
  const assignments: SceneElementMaterialAssignment[] = [];

  for (const floor of scene.floors) {
    for (const room of floor.rooms) {
      assignments.push({
        elementId: `${floor.floorId}:${room.roomId}:floor`,
        elementKind: "room-floor",
        floorId: floor.floorId,
        roomId: room.roomId,
        sourceId: room.roomId,
        materialTag: "wood-accent",
      });

      for (const wall of room.walls) {
        assignments.push({
          elementId: `${floor.floorId}:${room.roomId}:wall:${wall.edgeId}`,
          elementKind: "wall-segment",
          floorId: floor.floorId,
          roomId: room.roomId,
          sourceId: wall.edgeId,
          materialTag: "wall",
        });
      }

      for (const opening of room.openings) {
        assignments.push({
          elementId: `${floor.floorId}:${room.roomId}:opening:${opening.openingId}`,
          elementKind: "opening",
          floorId: floor.floorId,
          roomId: room.roomId,
          sourceId: opening.openingId,
          materialTag: classifyOpeningMaterialTag(opening.openingType),
        });
      }
    }

    for (const connector of floor.verticalConnectors) {
      assignments.push({
        elementId: `${floor.floorId}:connector:${connector.connectorId}`,
        elementKind: "vertical-connector",
        floorId: floor.floorId,
        roomId: connector.roomId,
        sourceId: connector.connectorId,
        materialTag: "wood-accent",
      });
    }
  }

  return deepFreeze(assignments);
}

function classifyOpeningMaterialTag(
  openingType: string,
): SceneElementMaterialTag {
  return normalizeTypeToken(openingType) === "window" ? "glass" : "wood-accent";
}

function normalizeTypeToken(value: string): string {
  return value.trim().toLowerCase();
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
