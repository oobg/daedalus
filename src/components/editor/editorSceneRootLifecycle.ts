import type { ViewerCameraMode } from "@/features/viewer/viewer-camera-mode";

import type { EditorViewMode } from "./EditorShell.ts";

export interface EditorSceneRootLifecycleState {
  readonly sceneRootKey: "viewer25d-shared-scene-root";
  readonly cameraMode: ViewerCameraMode;
  readonly sceneReuseStrategy: "reuse-loaded-viewer25d-scene";
  readonly shouldLoadSeparate2DScene: false;
  readonly shouldBuildSeparate2DScene: false;
}

const SHARED_SCENE_ROOT_KEY = "viewer25d-shared-scene-root" as const;

export function resolveEditorSceneRootLifecycleState(
  viewMode: EditorViewMode,
): EditorSceneRootLifecycleState {
  return Object.freeze({
    sceneRootKey: SHARED_SCENE_ROOT_KEY,
    cameraMode:
      viewMode === "edit" ? "top-down-orthographic" : "perspective",
    sceneReuseStrategy: "reuse-loaded-viewer25d-scene",
    shouldLoadSeparate2DScene: false,
    shouldBuildSeparate2DScene: false,
  });
}
