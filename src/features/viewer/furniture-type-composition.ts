import {
  SUPPORTED_FURNITURE_TYPES,
  resolveFurnitureDescriptor,
  type FurnitureDescriptorDimensions,
  type FurnitureDescriptorMaterialTag,
  type HandcraftedModelFurnitureDescriptor,
  type PrimitiveFurnitureDescriptor,
  type SupportedFurnitureType,
} from "./furniture-descriptor-mapping.ts";
import {
  buildFurniturePrimitives,
  type BuiltFurniturePrimitive,
  type FurniturePrimitiveBuildLimits,
} from "./furniture-primitive-builder.ts";

export interface FurnitureTypeCompositionMesh
  extends BuiltFurniturePrimitive {
  materialTag: FurnitureDescriptorMaterialTag;
  meshId: string;
}

export interface FurnitureTypeComposition {
  descriptorType: "handcrafted-model" | "primitive-composition";
  furnitureType: SupportedFurnitureType;
  groupId: string;
  materialTag: FurnitureDescriptorMaterialTag;
  meshes: readonly FurnitureTypeCompositionMesh[];
  normalizedDimensions: Readonly<FurnitureDescriptorDimensions>;
  silhouette: "beveled" | "rounded" | "soft-rectilinear";
  source: "low-detail-primitive-group";
  sourceAssetId: string | null;
}

export function createFurnitureTypeComposition(
  furnitureType: SupportedFurnitureType,
  limits: FurniturePrimitiveBuildLimits = {},
): FurnitureTypeComposition {
  const descriptor = resolveFurnitureDescriptor(furnitureType);
  const primitiveDescriptor =
    descriptor.descriptorType === "primitive-composition"
      ? descriptor
      : createFallbackPrimitiveDescriptor(furnitureType, descriptor);

  const meshes = buildFurniturePrimitives(primitiveDescriptor, limits).map(
    (primitive) =>
      freezeCompositionMesh({
        ...primitive,
        materialTag: descriptor.materialTag,
        meshId: `${furnitureType}:${primitive.partId}`,
      }),
  );

  return Object.freeze({
    descriptorType: descriptor.descriptorType,
    furnitureType,
    groupId: `furniture:${furnitureType}`,
    materialTag: descriptor.materialTag,
    meshes: Object.freeze(meshes),
    normalizedDimensions: Object.freeze({ ...descriptor.footprint }),
    silhouette: descriptor.silhouette,
    source: "low-detail-primitive-group",
    sourceAssetId:
      descriptor.descriptorType === "handcrafted-model"
        ? descriptor.modelAssetId
        : null,
  });
}

export function createFurnitureTypeCompositions(
  furnitureTypes: readonly SupportedFurnitureType[] = SUPPORTED_FURNITURE_TYPES,
  limits: FurniturePrimitiveBuildLimits = {},
): FurnitureTypeComposition[] {
  return furnitureTypes.map((furnitureType) =>
    createFurnitureTypeComposition(furnitureType, limits),
  );
}

function createFallbackPrimitiveDescriptor(
  furnitureType: SupportedFurnitureType,
  descriptor: HandcraftedModelFurnitureDescriptor,
): PrimitiveFurnitureDescriptor {
  switch (furnitureType) {
    case "sofa":
      return freezePrimitiveDescriptor({
        descriptorType: "primitive-composition",
        footprint: { ...descriptor.footprint },
        materialTag: descriptor.materialTag,
        silhouette: descriptor.silhouette,
        parts: [
          {
            partId: "base",
            primitive: "rounded-box",
            dimensions: { width: 2.2, depth: 0.96, height: 0.2 },
            position: { x: 0, y: 0.1, z: 0 },
            cornerRadius: 0.08,
          },
          {
            partId: "seat",
            primitive: "rounded-box",
            dimensions: { width: 1.96, depth: 0.6, height: 0.18 },
            position: { x: 0, y: 0.31, z: 0.09 },
            cornerRadius: 0.08,
          },
          {
            partId: "backrest",
            primitive: "rounded-box",
            dimensions: { width: 1.96, depth: 0.22, height: 0.52 },
            position: { x: 0, y: 0.56, z: -0.3 },
            cornerRadius: 0.08,
          },
          {
            partId: "arm-left",
            primitive: "rounded-box",
            dimensions: { width: 0.14, depth: 0.86, height: 0.58 },
            position: { x: -1.03, y: 0.39, z: 0.01 },
            cornerRadius: 0.06,
          },
          {
            partId: "arm-right",
            primitive: "rounded-box",
            dimensions: { width: 0.14, depth: 0.86, height: 0.58 },
            position: { x: 1.03, y: 0.39, z: 0.01 },
            cornerRadius: 0.06,
          },
        ],
      });
    case "storage":
      return freezePrimitiveDescriptor({
        descriptorType: "primitive-composition",
        footprint: { ...descriptor.footprint },
        materialTag: descriptor.materialTag,
        silhouette: descriptor.silhouette,
        parts: [
          {
            partId: "plinth",
            primitive: "rounded-box",
            dimensions: { width: 1.08, depth: 0.36, height: 0.08 },
            position: { x: 0, y: 0.04, z: 0 },
            cornerRadius: 0.02,
          },
          {
            partId: "body",
            primitive: "rounded-box",
            dimensions: { width: 1.18, depth: 0.46, height: 1.24 },
            position: { x: 0, y: 0.7, z: 0 },
            cornerRadius: 0.025,
          },
          {
            partId: "top",
            primitive: "rounded-box",
            dimensions: { width: 1.18, depth: 0.46, height: 0.08 },
            position: { x: 0, y: 1.44, z: 0 },
            cornerRadius: 0.025,
          },
        ],
      });
  }
}

function freezePrimitiveDescriptor(
  descriptor: PrimitiveFurnitureDescriptor,
): PrimitiveFurnitureDescriptor {
  return Object.freeze({
    ...descriptor,
    footprint: Object.freeze({ ...descriptor.footprint }),
    parts: Object.freeze(
      descriptor.parts.map((part) =>
        Object.freeze({
          ...part,
          dimensions: Object.freeze({ ...part.dimensions }),
          position: Object.freeze({ ...part.position }),
        }),
      ),
    ),
  });
}

function freezeCompositionMesh(
  mesh: FurnitureTypeCompositionMesh,
): FurnitureTypeCompositionMesh {
  return Object.freeze({
    ...mesh,
    dimensions: Object.freeze({ ...mesh.dimensions }),
    geometryArgs: Object.freeze([...mesh.geometryArgs]) as typeof mesh.geometryArgs,
    position: Object.freeze({ ...mesh.position }),
  });
}
