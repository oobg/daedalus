export {
  createViewerComposition,
  type LoadedViewerScene,
  type ViewerComposition,
} from "./viewer-composition.ts";
export {
  getWallShadingConfig,
  type WallShadingConfig,
  type WallShadingVariant,
} from "./wall-shading.ts";
export {
  createWallProfileOutline,
  createWallProfileShape,
  createWallSegmentGeometry,
  type WallProfileOptions,
  type WallProfilePoint,
} from "./wall-profile.ts";
export {
  getWallColorPalette,
  type WallColorPalette,
  type WallColorPaletteVariant,
} from "./wall-color-palette.ts";
export {
  assertViewerExportCompositionInput,
  validateViewerExportCompositionInput,
  type ValidateViewerExportCompositionInputResult,
  type ViewerExportCompositionValidationIssue,
} from "./viewer-export-composition-guard.ts";
