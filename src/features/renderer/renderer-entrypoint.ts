import type {
  ReadonlyRendererSnapshotProject,
  RenderSceneData,
} from "./renderer-contract.ts";
import { adaptProjectSnapshotToRenderScene } from "./renderer-input-adapter.ts";

export interface RendererPort<Output> {
  render(scene: Readonly<RenderSceneData>): Output;
}

export interface RendererEntrypoint<Output> {
  renderScene(scene: Readonly<RenderSceneData>): Output;
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
