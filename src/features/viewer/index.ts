export {
  getAmbientLightingPreset,
  type AmbientLightingPreset,
  type AmbientLightingPresetVariant,
} from "./ambient-lighting.ts";
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
  getGlassMaterialConfig,
  type GlassMaterialConfig,
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
  getViewerPresentationPreset,
  type ViewerPresentationPreset,
  type ViewerPresentationPresetVariant,
} from "./viewer-presentation.ts";
