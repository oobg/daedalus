import React from "react";

import type { EditorProject } from "../../domain/editor-state.ts";
import type { ViewerCameraMode } from "../../features/viewer/viewer-camera-mode.ts";
import {
  resolveTopDownHandleOverlayDescriptors,
  type TopDownHandleOverlayDescriptor,
} from "./topDownHandleOverlaySceneAdapter.ts";
import {
  createViewer25DSceneGraph,
  resolveViewer25DSceneGeometrySource,
  type Viewer25DSceneGeometrySource,
} from "./viewer25dSceneGraph.ts";
import { createWorldSpaceEditHandleElements } from "./worldSpaceEditHandles.ts";

export interface Viewer25DTopDownHandleOverlaySceneInput {
  readonly geometrySource: Viewer25DSceneGeometrySource;
  readonly cameraMode: ViewerCameraMode;
}

export interface Viewer25DTopDownHandleOverlaySceneStoreState {
  readonly project: EditorProject;
}

export interface Viewer25DTopDownHandleOverlaySceneStore {
  getState(): Viewer25DTopDownHandleOverlaySceneStoreState;
  subscribe(
    listener: (
      state: Viewer25DTopDownHandleOverlaySceneStoreState,
      prevState: Viewer25DTopDownHandleOverlaySceneStoreState,
    ) => void,
  ): () => void;
}

export interface MountedViewer25DTopDownHandleOverlayScene {
  getScene(): React.ReactElement;
  dispose(): void;
}

export interface MountViewer25DTopDownHandleOverlaySceneInput {
  readonly store: Viewer25DTopDownHandleOverlaySceneStore;
  readonly cameraMode: ViewerCameraMode;
  readonly floorRenderOffsets: readonly number[];
  readonly onSceneChange?: (scene: React.ReactElement) => void;
}

export function createViewer25DTopDownHandleOverlayScene(
  input: Viewer25DTopDownHandleOverlaySceneInput,
): React.ReactElement {
  const handles = resolveTopDownHandleOverlayDescriptors({
    geometrySource: input.geometrySource,
    cameraMode: input.cameraMode,
  });

  return React.createElement(
    React.Fragment,
    null,
    ...createWorldSpaceEditHandleElements({ handles }),
  );
}

export function mountViewer25DTopDownHandleOverlayScene(
  input: MountViewer25DTopDownHandleOverlaySceneInput,
): MountedViewer25DTopDownHandleOverlayScene {
  const resolveGeometrySource = (
    state: Viewer25DTopDownHandleOverlaySceneStoreState,
  ): Viewer25DSceneGeometrySource =>
    resolveViewer25DSceneGeometrySource({
      sceneGraph: createViewer25DSceneGraph({
        floors: state.project.floors,
        activeFloorId: state.project.viewState.activeFloorId,
        exteriorPolygon: state.project.exteriorPolygon,
        exteriorEdgeOpenings: state.project.exteriorEdgeOpenings,
        floorRenderOffsets: input.floorRenderOffsets,
      }),
      cameraMode: input.cameraMode,
    });
  let currentDescriptors = resolveTopDownHandleOverlayDescriptors({
    geometrySource: resolveGeometrySource(input.store.getState()),
    cameraMode: input.cameraMode,
  });
  let currentScene = createViewer25DTopDownHandleOverlayScene({
    geometrySource: resolveGeometrySource(input.store.getState()),
    cameraMode: input.cameraMode,
  });

  input.onSceneChange?.(currentScene);

  const unsubscribe = input.store.subscribe((state) => {
    const nextDescriptors = resolveTopDownHandleOverlayDescriptors({
      geometrySource: resolveGeometrySource(state),
      cameraMode: input.cameraMode,
    });

    if (topDownHandleOverlayDescriptorsEqual(currentDescriptors, nextDescriptors)) {
      return;
    }

    currentDescriptors = nextDescriptors;
    currentScene = createViewer25DTopDownHandleOverlayScene({
      geometrySource: resolveGeometrySource(state),
      cameraMode: input.cameraMode,
    });
    input.onSceneChange?.(currentScene);
  });

  return {
    getScene: () => currentScene,
    dispose: unsubscribe,
  };
}

function topDownHandleOverlayDescriptorsEqual(
  previous: readonly TopDownHandleOverlayDescriptor[],
  next: readonly TopDownHandleOverlayDescriptor[],
): boolean {
  if (previous === next) {
    return true;
  }

  if (previous.length !== next.length) {
    return false;
  }

  for (let index = 0; index < previous.length; index += 1) {
    const previousHandle = previous[index];
    const nextHandle = next[index];

    if (
      previousHandle.id !== nextHandle.id ||
      previousHandle.label !== nextHandle.label ||
      previousHandle.entityKind !== nextHandle.entityKind ||
      previousHandle.floorId !== nextHandle.floorId ||
      previousHandle.roomId !== nextHandle.roomId ||
      previousHandle.worldPosition.x !== nextHandle.worldPosition.x ||
      previousHandle.worldPosition.y !== nextHandle.worldPosition.y ||
      previousHandle.worldPosition.z !== nextHandle.worldPosition.z
    ) {
      return false;
    }
  }

  return true;
}
