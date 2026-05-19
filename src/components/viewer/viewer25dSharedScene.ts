import * as THREE from "three";

const SHARED_VIEWER25D_SCENE_NAME = "viewer25d-shared-scene";

export function resolveViewer25DSharedSceneInstance(
  existingScene?: THREE.Scene,
): THREE.Scene {
  if (existingScene != null) {
    return existingScene;
  }

  const scene = new THREE.Scene();
  scene.name = SHARED_VIEWER25D_SCENE_NAME;
  return scene;
}
