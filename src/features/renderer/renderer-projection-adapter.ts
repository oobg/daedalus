import type {
  ReadonlyEditorStateProjection,
  RenderSceneData,
} from "./renderer-contract.ts";
import { adaptProjectSnapshotToRenderScene } from "./renderer-input-adapter.ts";

export function adaptReadonlyEditorStateProjectionToRenderScene(
  projection: ReadonlyEditorStateProjection,
): Readonly<RenderSceneData> {
  return adaptProjectSnapshotToRenderScene(projection.project);
}
