export {
  getViewerLightingConfiguration,
  type AmbientViewerLightConfiguration,
  type DirectionalViewerLightConfiguration,
  type ViewerLightingConfiguration,
  type ViewerLightingConfigurationVariant,
} from "./lighting-configuration.ts";
export {
  getAmbientLightingPreset,
  type AmbientLightingPreset,
  type AmbientLightingPresetVariant,
} from "./ambient-lighting.ts";
export {
  getAmbientOcclusionPreset,
  getAmbientOcclusionSoftnessBounds,
  isAmbientOcclusionSoftProfile,
  resolveAmbientOcclusionSettings,
  type AmbientOcclusionCapabilityInput,
  type AmbientOcclusionSettings,
  type AmbientOcclusionSoftnessBounds,
  type AmbientOcclusionPresetVariant,
} from "./ambient-occlusion.ts";
export {
  applyContactShadowActivation,
  getContactShadowActivationPreset,
  resolveContactShadowActivationSettings,
  type ContactShadowActivationSettings,
  type ContactShadowActivationVariant,
  type ContactShadowCapabilityInput,
  type ContactShadowElementKind,
} from "./contact-shadow-activation.ts";
export {
  createContactShadowFootprint,
  resolveContactShadowPlacement,
  type ContactShadowFootprint,
  type ContactShadowFootprintPoint,
  type ContactShadowPlacement,
  type ContactShadowPlacementOptions,
} from "./contact-shadow-placement.ts";
export {
  configureContactShadowSoftness,
  getContactShadowSoftnessPreset,
  resolveContactShadowRenderState,
  type ContactShadowRenderState,
  type ContactShadowSoftnessSettings,
} from "./contact-shadow-softness.ts";
export {
  createViewerComposition,
  type LoadedViewerScene,
  type ViewerComposition,
} from "./viewer-composition.ts";
export {
  createExteriorWallMeshAssembly,
  getExteriorWallMeshOptions,
  type ExteriorWallMeshInput,
} from "./exterior-wall-mesh.ts";
export {
  getWallShadingConfig,
  type WallShadingConfig,
  type WallShadingVariant,
} from "./wall-shading.ts";
export {
  createStraightWallSegmentMeshes,
  type StraightWallSegmentMesh,
  type StraightWallSegmentMeshOptions,
  type StraightWallSegmentPoint,
} from "./wall-segment-mesh.ts";
export {
  createWallMeshAssembly,
  type AssembledWallMesh,
  type WallMeshAssembly,
  type WallMeshAssemblyOptions,
} from "./wall-mesh-assembly.ts";
export {
  getWallColorPalette,
  type WallColorPalette,
  type WallColorPaletteVariant,
} from "./wall-color-palette.ts";
export {
  getWoodAccentShadingConfig,
  type WoodAccentShadingConfig,
  type WoodAccentShadingVariant,
} from "./wood-accent-shading.ts";
export {
  evaluateGlassMaterialRead,
  getGlassMaterialConfig,
  type GlassMaterialConfig,
  type GlassMaterialReadProfile,
  type GlassMaterialVariant,
} from "./glass-material.ts";
export {
  classifySceneElementMaterialTags,
  type SceneElementKind,
  type SceneElementMaterialAssignment,
  type SceneElementMaterialTag,
} from "./scene-element-material-tags.ts";
export {
  applySceneElementRenderMaterials,
  validateSceneMaterialSeparation,
  type AppliedSceneElementMaterialAssignment,
  type AppliedSceneMaterialAssignments,
  type SceneMaterialSeparationSummary,
  type SceneMaterialSeparationValidationIssue,
  type SceneMaterialSeparationValidationResult,
} from "./scene-material-assignment.ts";
export {
  assertViewerExportCompositionInput,
  validateViewerExportCompositionInput,
  type ValidateViewerExportCompositionInputResult,
  type ViewerExportCompositionValidationIssue,
} from "./viewer-export-composition-guard.ts";
export { type RenderSceneData } from "../renderer/renderer-contract.ts";
export { type RendererPort } from "../renderer/renderer-entrypoint.ts";
export {
  assertFurnitureAssetReference,
  validateFurnitureAssetReference,
  type FurnitureAssetReferenceValidationIssue,
  type FurnitureAssetReferenceValidationResult,
} from "./furniture-asset-reference-guard.ts";
export {
  MAX_APPROVED_FURNITURE_TEXTURE_SET_COUNT,
  MAX_APPROVED_FURNITURE_TRIANGLE_COUNT,
  validateFurnitureAssetMetadata,
  type FurnitureAssetClassificationReason,
  type FurnitureAssetClassificationReasonCode,
  type FurnitureAssetMetadata,
  type FurnitureAssetMetadataValidationResult,
} from "./furniture-asset-metadata.ts";
export {
  resolveApprovedFurnitureAsset,
  type ApprovedFurnitureAssetSelection,
  type FurnitureAssetCatalogEntry,
  type FurnitureAssetLookupRequest,
  type FurnitureAssetSelectionResult,
} from "./furniture-asset-selection.ts";
export {
  computeFurnitureAssetGeometryMetrics,
  type FurnitureAssetGeometryMesh,
  type FurnitureAssetGeometryMetrics,
  type FurnitureAssetGeometryMetricsOptions,
} from "./furniture-geometry-metrics.ts";
export {
  DEFAULT_FURNITURE_LAYER_OFFSET,
  resolveFurnitureBaseElevation,
  resolveFurnitureVerticalPlacement,
  type FurnitureBaseElevationOptions,
  type FurnitureVerticalPlacement,
  type FurnitureVerticalPlacementOptions,
} from "./furniture-base-elevation.ts";
export {
  SUPPORTED_FURNITURE_TYPES,
  isNormalizedFurnitureDescriptor,
  resolveFurnitureDescriptor,
  type FurnitureDescriptorDimensions,
  type FurnitureDescriptorMaterialTag,
  type FurnitureDescriptorPrimitiveKind,
  type FurnitureDescriptorPrimitivePart,
  type HandcraftedModelFurnitureDescriptor,
  type NormalizedFurnitureDescriptor,
  type PrimitiveFurnitureDescriptor,
  type SupportedFurnitureType,
} from "./furniture-descriptor-mapping.ts";
export {
  getViewerPresentationPreset,
  type ViewerPresentationPreset,
  type ViewerPresentationPresetVariant,
} from "./viewer-presentation.ts";
