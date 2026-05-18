import type { ReadonlyRenderSceneData } from "./renderer-contract.ts";

export type ViewerExportRenderModel = ReadonlyRenderSceneData;

export interface ViewerExportRendererInput<Output> {
  readonly render: (scene: ViewerExportRenderModel) => Output;
}

export function defineViewerExportRendererInput<Output>(
  renderer: ViewerExportRendererInput<Output>,
): ViewerExportRendererInput<Output> {
  return renderer;
}
