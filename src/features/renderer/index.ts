export {
  EDITOR_STATE_PROJECTION_VERSION,
  type DeepReadonly,
  RENDERER_CONTRACT_FIELDS,
  type ReadonlyEditorStateProjection,
  type RendererConsumer,
  type ReadonlyRendererSnapshotFloor,
  type ReadonlyRendererSnapshotLabelPosition,
  type ReadonlyRendererSnapshotOpening,
  type ReadonlyRendererSnapshotPoint,
  type ReadonlyRendererSnapshotProject,
  type ReadonlyRendererSnapshotRoom,
  type ReadonlyRendererSnapshotSharedBoundary,
  type ReadonlyRendererSnapshotVerticalConnector,
  type ReadonlyRendererSnapshotViewState,
  type ReadonlyRendererSnapshotWallSegment,
  type RendererSnapshotFloor,
  type RendererSnapshotLabelPosition,
  type RendererSnapshotOpening,
  type RendererSnapshotPoint,
  type RendererSnapshotProject,
  type RendererSnapshotRoom,
  type RendererSnapshotSharedBoundary,
  type RendererSnapshotVerticalConnector,
  type RendererSnapshotViewState,
  type RendererSnapshotWallSegment,
  type RenderSceneBoundary,
  type RenderSceneBounds,
  type RenderSceneData,
  type RenderSceneFloor,
  type RenderSceneOpening,
  type RenderScenePoint,
  type RenderSceneRoom,
  type ReadonlyRenderAssetMapping,
  type RenderAssetFloorMetadata,
  type RenderAssetOpeningMetadata,
  type RenderAssetProjectMetadata,
  type RenderAssetRoomMetadata,
  type RenderAssetVerticalConnectorMetadata,
  type RenderSceneVerticalConnector,
  type RenderSceneWallSegment,
  type SerializedEditorStateProjection,
} from "./renderer-contract.ts";
export {
  createRendererEntrypoint,
  renderProjectSnapshot,
  type RendererEntrypoint,
  type RendererPort,
} from "./renderer-entrypoint.ts";
export {
  createRendererExtensionRegistry,
  type RendererExtensionContext,
  type RendererExtensionRegistry,
  type RendererExtensionRegistrySnapshot,
  type RendererFeatureHandler,
  type RendererOutputHandler,
} from "./renderer-extension-registry.ts";
export { resolveRenderSceneRoomLayers } from "./render-scene-layering.ts";
export { adaptProjectSnapshotToRenderScene } from "./renderer-input-adapter.ts";
export {
  adaptSnapshotFloorToRenderSceneFloor,
  type RenderSceneFloorPrimitiveOptions,
} from "./floor-render-primitives.ts";
export {
  createReadonlyEditorStateProjection,
  mapEditorFloorToRendererSnapshotFloor,
  mapEditorRoomToRendererSnapshotRoom,
  projectEditorStateForRenderer,
  serializeEditorStateProjection,
  type EditorStateProjectionOptions,
} from "./editor-state-projection.ts";
export { adaptReadonlyEditorStateProjectionToRenderScene } from "./renderer-projection-adapter.ts";
export {
  mapProjectSnapshotToRenderAssetMetadata,
  mapReadonlyEditorStateProjectionToRenderAssetMetadata,
} from "./render-asset-mapping.ts";
