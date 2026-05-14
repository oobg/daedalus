import type {
  FurnitureDescriptorMaterialTag,
  SupportedFurnitureType,
} from "./furniture-descriptor-mapping.ts";

export type FurnitureRenderMaterialType = "standard";

export type FurnitureMaterialPresetId =
  | "linen-oat"
  | "boucle-sand"
  | "oiled-oak"
  | "chalk-painted-ash";

export interface FurnitureMaterialShadingConfig {
  color: string;
  emissive: string;
  roughness: number;
  metalness: number;
  envMapIntensity: number;
  emissiveIntensity: number;
}

export interface FurnitureRenderMaterial {
  materialTag: FurnitureDescriptorMaterialTag;
  materialType: FurnitureRenderMaterialType;
  presetId: FurnitureMaterialPresetId;
  config: Readonly<FurnitureMaterialShadingConfig>;
}

const OILED_OAK_CONFIG = Object.freeze<FurnitureMaterialShadingConfig>({
  color: "#B88D63",
  emissive: "#7F5B3C",
  roughness: 0.8,
  metalness: 0.03,
  envMapIntensity: 0.22,
  emissiveIntensity: 0.013,
});

const DEFAULT_FURNITURE_RENDER_MATERIALS = Object.freeze<
  Record<SupportedFurnitureType, Readonly<FurnitureRenderMaterial>>
>({
  bed: freezeRenderMaterial({
    materialTag: "upholstery",
    materialType: "standard",
    presetId: "linen-oat",
    config: {
      color: "#C9B8A3",
      emissive: "#8F755E",
      roughness: 0.94,
      metalness: 0.01,
      envMapIntensity: 0.08,
      emissiveIntensity: 0.012,
    },
  }),
  chair: freezeRenderMaterial({
    materialTag: "warm-wood",
    materialType: "standard",
    presetId: "oiled-oak",
    config: OILED_OAK_CONFIG,
  }),
  desk: freezeRenderMaterial({
    materialTag: "warm-wood",
    materialType: "standard",
    presetId: "oiled-oak",
    config: OILED_OAK_CONFIG,
  }),
  sofa: freezeRenderMaterial({
    materialTag: "upholstery",
    materialType: "standard",
    presetId: "boucle-sand",
    config: {
      color: "#CBB49A",
      emissive: "#93745B",
      roughness: 0.95,
      metalness: 0.01,
      envMapIntensity: 0.07,
      emissiveIntensity: 0.011,
    },
  }),
  storage: freezeRenderMaterial({
    materialTag: "painted-wood",
    materialType: "standard",
    presetId: "chalk-painted-ash",
    config: {
      color: "#D7CCBC",
      emissive: "#9A8570",
      roughness: 0.91,
      metalness: 0.015,
      envMapIntensity: 0.12,
      emissiveIntensity: 0.011,
    },
  }),
  table: freezeRenderMaterial({
    materialTag: "warm-wood",
    materialType: "standard",
    presetId: "oiled-oak",
    config: OILED_OAK_CONFIG,
  }),
});

export function resolveFurnitureRenderMaterial(
  furnitureType: SupportedFurnitureType,
  materialTag: FurnitureDescriptorMaterialTag,
): Readonly<FurnitureRenderMaterial> {
  const renderMaterial = DEFAULT_FURNITURE_RENDER_MATERIALS[furnitureType];

  if (renderMaterial.materialTag !== materialTag) {
    throw new TypeError(
      `Furniture type "${furnitureType}" requires material tag "${renderMaterial.materialTag}", received "${materialTag}".`,
    );
  }

  return renderMaterial;
}

function freezeRenderMaterial(
  material: FurnitureRenderMaterial,
): Readonly<FurnitureRenderMaterial> {
  return Object.freeze({
    ...material,
    config: Object.freeze({ ...material.config }),
  });
}
