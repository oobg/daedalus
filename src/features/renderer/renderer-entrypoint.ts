import type {
  ReadonlyRenderSceneData,
  ReadonlyRendererSnapshotProject,
} from "./renderer-contract.ts";
import type { ViewerExportRendererInput } from "./viewer-export-renderer-input-contract.ts";
import { adaptProjectSnapshotToRenderScene } from "./renderer-input-adapter.ts";

export type RendererPort<Output> = ViewerExportRendererInput<Output>;

export interface RendererEntrypoint<Output> {
  renderScene(scene: ReadonlyRenderSceneData): Output;
  renderProjectSnapshot(project: ReadonlyRendererSnapshotProject): Output;
}

export function createRendererEntrypoint<Output>(
  renderer: RendererPort<Output>,
): RendererEntrypoint<Output> {
  return {
    renderScene(scene) {
      return renderer.render(scene);
    },
    renderProjectSnapshot(project) {
      return renderer.render(adaptProjectSnapshotToRenderScene(project));
    },
  };
}

export function renderProjectSnapshot<Output>(
  project: ReadonlyRendererSnapshotProject,
  renderer: RendererPort<Output>,
): Output {
  return createRendererEntrypoint(renderer).renderProjectSnapshot(project);
}
