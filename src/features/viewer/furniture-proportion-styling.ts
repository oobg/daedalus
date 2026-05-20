import type { SupportedFurnitureType } from "./furniture-descriptor-mapping.ts";
import type { BuiltFurniturePrimitive } from "./furniture-primitive-builder.ts";

interface FurnitureScaleAdjustment {
  width?: number;
  depth?: number;
  height?: number;
}

const DEFAULT_SCALE_ADJUSTMENT = Object.freeze({
  width: 1,
  depth: 1,
  height: 1,
} satisfies Required<FurnitureScaleAdjustment>);

const FURNITURE_PROPORTION_ADJUSTMENTS = Object.freeze({
  bed: Object.freeze({
    base: Object.freeze({ height: 0.92 }),
    mattress: Object.freeze({ width: 0.98, depth: 0.98, height: 1.16 }),
    headboard: Object.freeze({ width: 0.96, depth: 1.08, height: 1.12 }),
  }),
  chair: Object.freeze({
    seat: Object.freeze({ width: 1.04, depth: 1.04, height: 1.22 }),
    backrest: Object.freeze({ width: 0.96, depth: 0.92, height: 1.12 }),
    pedestal: Object.freeze({ width: 0.82, depth: 0.82, height: 1.06 }),
  }),
  desk: Object.freeze({
    top: Object.freeze({ width: 1.02, depth: 1.02, height: 1.18 }),
    "drawer-block": Object.freeze({ width: 1.05, depth: 1.02, height: 0.98 }),
    "leg-frame": Object.freeze({ width: 0.88, depth: 0.94, height: 1.02 }),
  }),
  sofa: Object.freeze({
    base: Object.freeze({ depth: 1.02, height: 1.08 }),
    seat: Object.freeze({ width: 0.98, depth: 1.06, height: 1.18 }),
    backrest: Object.freeze({ width: 0.98, depth: 0.96, height: 1.08 }),
    "arm-left": Object.freeze({ width: 1.08, depth: 0.98, height: 1.06 }),
    "arm-right": Object.freeze({ width: 1.08, depth: 0.98, height: 1.06 }),
  }),
  storage: Object.freeze({
    plinth: Object.freeze({ width: 0.96, depth: 0.9, height: 0.88 }),
    body: Object.freeze({ width: 1.02, depth: 0.98, height: 1.03 }),
    top: Object.freeze({ width: 1.02, depth: 0.98, height: 1.1 }),
  }),
  table: Object.freeze({
    top: Object.freeze({ width: 1.03, depth: 1.03, height: 1.14 }),
    column: Object.freeze({ width: 0.88, depth: 0.88, height: 1.04 }),
    base: Object.freeze({ width: 0.9, depth: 0.9, height: 1.08 }),
  }),
} satisfies Record<
  SupportedFurnitureType,
  Readonly<Record<string, Readonly<FurnitureScaleAdjustment>>>
>);

export interface FurnitureProportionStylingResult {
  adjustedMeshCount: number;
  meshes: readonly BuiltFurniturePrimitive[];
}

export function normalizeFurnitureProportionStyling(
  furnitureType: SupportedFurnitureType,
  meshes: readonly BuiltFurniturePrimitive[],
): FurnitureProportionStylingResult {
  const adjustmentsByPart = FURNITURE_PROPORTION_ADJUSTMENTS[furnitureType];
  let adjustedMeshCount = 0;

  const styledMeshes = meshes.map((mesh) => {
    const adjustment = (adjustmentsByPart as Record<string, Readonly<FurnitureScaleAdjustment> | undefined>)[mesh.partId];

    if (adjustment == null) {
      return mesh;
    }

    adjustedMeshCount += 1;
    return applyScaleAdjustment(mesh, adjustment);
  });

  return Object.freeze({
    adjustedMeshCount,
    meshes: Object.freeze(styledMeshes),
  });
}

function applyScaleAdjustment(
  mesh: BuiltFurniturePrimitive,
  adjustment: FurnitureScaleAdjustment,
): BuiltFurniturePrimitive {
  const scale = {
    width: adjustment.width ?? DEFAULT_SCALE_ADJUSTMENT.width,
    depth: adjustment.depth ?? DEFAULT_SCALE_ADJUSTMENT.depth,
    height: adjustment.height ?? DEFAULT_SCALE_ADJUSTMENT.height,
  };
  const dimensions = {
    width: roundDimension(mesh.dimensions.width * scale.width),
    depth: roundDimension(mesh.dimensions.depth * scale.depth),
    height: roundDimension(mesh.dimensions.height * scale.height),
  };
  const baseY = mesh.position.y - mesh.dimensions.height / 2;
  const position = {
    ...mesh.position,
    y: roundDimension(baseY + dimensions.height / 2),
  };

  switch (mesh.primitive) {
    case "box":
      return {
        ...mesh,
        dimensions,
        position,
        geometryArgs: [dimensions.width, dimensions.height, dimensions.depth],
      };
    case "cylinder": {
      const radius = roundDimension(Math.min(dimensions.width, dimensions.depth) / 2);

      return {
        ...mesh,
        dimensions,
        position,
        geometryArgs: [radius, radius, dimensions.height, mesh.radialSegments],
      };
    }
    case "rounded-box": {
      const radiusScale = Math.min(scale.width, scale.depth, scale.height);
      const cornerRadius = roundDimension(mesh.cornerRadius * radiusScale);

      return {
        ...mesh,
        dimensions,
        position,
        cornerRadius,
        geometryArgs: [
          dimensions.width,
          dimensions.height,
          dimensions.depth,
          mesh.segmentCount,
          cornerRadius,
        ],
      };
    }
  }
}

function roundDimension(value: number): number {
  return Math.round(value * 100_000) / 100_000;
}
