import {
  resolveTopDownCameraConfiguration,
  type TopDownSceneBounds,
} from "./top-down-camera-configuration.ts";

export type ViewerCameraMode = "perspective" | "top-down-orthographic";

export type ViewerSceneBounds = TopDownSceneBounds;

export interface ViewerCameraModeConfig {
  orthographic: boolean;
  position: readonly [number, number, number];
  up: readonly [number, number, number];
  lookAt: readonly [number, number, number];
  near: number;
  far: number;
  fov?: number;
  zoom?: number;
  enableRotate: boolean;
  minPolarAngle?: number;
  maxPolarAngle?: number;
}

export interface ViewerViewportSceneGraph {
  readonly sceneGraphId: string;
}

export interface ViewerRendererSession<
  Renderer = object,
  RenderState = object,
> {
  renderer: Renderer;
  renderState: RenderState;
}

export interface ViewerViewportState {
  sceneGraph: ViewerViewportSceneGraph;
  cameraMode: ViewerCameraMode;
  camera: ViewerCameraModeConfig;
  rendererSession?: ViewerRendererSession;
}

export interface ViewerCameraTransformTarget {
  position: {
    set: (x: number, y: number, z: number) => void;
  };
  up: {
    set: (x: number, y: number, z: number) => void;
  };
  near: number;
  far: number;
  lookAt: (x: number, y: number, z: number) => void;
  updateProjectionMatrix: () => void;
  fov?: number;
  zoom?: number;
}

const DEFAULT_LOOK_AT: readonly [number, number, number] = Object.freeze([0, 0, 0]);
const PERSPECTIVE_UP: readonly [number, number, number] = Object.freeze([0, 1, 0]);

export function resolveViewerCameraModeConfig(input: {
  cameraMode: ViewerCameraMode;
  sceneBounds: ViewerSceneBounds;
  perspectivePosition: readonly [number, number, number];
  perspectiveFov: number;
  fixedPolarAngle: number;
}): ViewerCameraModeConfig {
  if (input.cameraMode === "top-down-orthographic") {
    return resolveTopDownCameraConfiguration(input.sceneBounds);
  }

  return Object.freeze({
    orthographic: false,
    position: [...input.perspectivePosition] as [number, number, number],
    up: PERSPECTIVE_UP,
    lookAt: DEFAULT_LOOK_AT,
    near: 0.1,
    far: 200,
    fov: input.perspectiveFov,
    enableRotate: true,
    minPolarAngle: input.fixedPolarAngle,
    maxPolarAngle: input.fixedPolarAngle,
  });
}

export function resolveViewerViewportState(input: {
  sceneGraph: ViewerViewportSceneGraph;
  cameraMode: ViewerCameraMode;
  sceneBounds: ViewerSceneBounds;
  perspectivePosition: readonly [number, number, number];
  perspectiveFov: number;
  fixedPolarAngle: number;
  rendererSession?: ViewerRendererSession;
}): ViewerViewportState {
  return Object.freeze({
    sceneGraph: input.sceneGraph,
    cameraMode: input.cameraMode,
    camera: resolveViewerCameraModeConfig({
      cameraMode: input.cameraMode,
      sceneBounds: input.sceneBounds,
      perspectivePosition: input.perspectivePosition,
      perspectiveFov: input.perspectiveFov,
      fixedPolarAngle: input.fixedPolarAngle,
    }),
    rendererSession: input.rendererSession,
  });
}

export function switchViewerCameraMode(input: {
  viewport: ViewerViewportState;
  nextCameraMode: ViewerCameraMode;
  sceneBounds: ViewerSceneBounds;
  perspectivePosition: readonly [number, number, number];
  perspectiveFov: number;
  fixedPolarAngle: number;
}): ViewerViewportState {
  return resolveViewerViewportState({
    sceneGraph: input.viewport.sceneGraph,
    cameraMode: input.nextCameraMode,
    sceneBounds: input.sceneBounds,
    perspectivePosition: input.perspectivePosition,
    perspectiveFov: input.perspectiveFov,
    fixedPolarAngle: input.fixedPolarAngle,
    rendererSession: input.viewport.rendererSession,
  });
}

export function applyViewerCameraModeConfig(
  camera: ViewerCameraTransformTarget,
  cameraModeConfig: ViewerCameraModeConfig,
): ViewerCameraTransformTarget {
  camera.position.set(...cameraModeConfig.position);
  camera.up.set(...cameraModeConfig.up);
  camera.near = cameraModeConfig.near;
  camera.far = cameraModeConfig.far;

  if (cameraModeConfig.fov != null && "fov" in camera) {
    camera.fov = cameraModeConfig.fov;
  }

  if (cameraModeConfig.zoom != null && "zoom" in camera) {
    camera.zoom = cameraModeConfig.zoom;
  }

  camera.lookAt(...cameraModeConfig.lookAt);
  camera.updateProjectionMatrix();

  return camera;
}
