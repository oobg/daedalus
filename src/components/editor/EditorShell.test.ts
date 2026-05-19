import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { fileURLToPath } from "node:url";

import { EditorShell } from "./EditorShell.ts";
import { createEditorProject } from "../../domain/editor-state.ts";
import {
  DEFAULT_WALL_HEIGHT_SCALE,
  resolveViewer25DFloorRenderPlacements,
} from "../viewer/viewer25dGeometry.ts";
import { createViewer25DTopDownHandleOverlayScene } from "../viewer/viewer25dTopDownHandleOverlayScene.ts";
import {
  createViewer25DSceneGraph,
  resolveViewer25DSceneGeometrySource,
} from "../viewer/viewer25dSceneGraph.ts";
import { collectWorldSpaceHtmlHandleElements } from "../viewer/worldSpaceEditHandles.ts";
import { resolveEditorSceneRootLifecycleState } from "./editorSceneRootLifecycle.ts";

type HtmlHandleProps = { children?: React.ReactElement };
type ButtonProps = Record<string, unknown>;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const editorPagePath = path.resolve(__dirname, "../../app/page.tsx");
const packageManifestPath = path.resolve(__dirname, "../../../package.json");

function createSharedSceneViewerSurfaceMarkup() {
  const project = createEditorProject({
    projectId: "project-editor-shell-top-down-overlay",
    floors: [
      {
        floorId: "floor-ground",
        floorName: "Ground",
        floorHeight: 3.2,
        rooms: [
          {
            roomId: "room-lobby",
            roomName: "Lobby",
            roomPolygon: [
              { x: 0, y: 0 },
              { x: 400, y: 0 },
              { x: 400, y: 300 },
              { x: 0, y: 300 },
            ],
            openings: [
              {
                id: "opening-window-east",
                type: "window",
                x: 400,
                y: 120,
                angle: Math.PI / 2,
              },
            ],
          },
        ],
        guideObjects: [
          {
            guideObjectId: "guide-desk",
            guideObjectType: "furniture",
            floorId: "floor-ground",
            roomId: "room-lobby",
            name: "Desk",
            position: { x: 180, y: 140 },
          },
        ],
        verticalConnectors: [
          {
            connectorId: "connector-core",
            connectorType: "stair",
            roomId: "room-lobby",
            targetFloorId: "floor-upper",
            position: { x: 260, y: 160 },
          },
        ],
      },
    ],
    exteriorPolygon: [
      { x: -100, y: -100 },
      { x: 500, y: -100 },
      { x: 500, y: 400 },
    ],
    viewState: {
      activeFloorId: "floor-ground",
      selectedRoomId: "room-lobby",
    },
  });
  const floorPlacements = resolveViewer25DFloorRenderPlacements(
    project.floors,
    DEFAULT_WALL_HEIGHT_SCALE,
  );
  const overlayScene = createViewer25DTopDownHandleOverlayScene({
    geometrySource: resolveViewer25DSceneGeometrySource({
      sceneGraph: createViewer25DSceneGraph({
        floors: project.floors,
        activeFloorId: project.viewState.activeFloorId,
        exteriorPolygon: project.exteriorPolygon,
        exteriorEdgeOpenings: project.exteriorEdgeOpenings,
        floorRenderOffsets: floorPlacements.map(
          (placement) => placement.renderVerticalOffset ?? 0,
        ),
      }),
      cameraMode: "top-down-orthographic",
    }),
    cameraMode: "top-down-orthographic",
  });
  const overlayHandleElements = collectWorldSpaceHtmlHandleElements(overlayScene);

  return createElement(
    "div",
    {
      "data-editor-surface": "viewer-25d-shared-scene-overlay",
    },
    overlayHandleElements.map((htmlHandle) => {
      const button = (htmlHandle.props as HtmlHandleProps).children;
      const bp = (button?.props ?? {}) as ButtonProps;

      return createElement(
        "button",
        {
          key: bp["data-world-handle-id"] as string,
          type: "button",
          "data-world-handle-id": bp["data-world-handle-id"],
          "data-world-x": bp["data-world-x"],
          "data-world-y": bp["data-world-y"],
          "data-world-z": bp["data-world-z"],
          "aria-label": bp["aria-label"],
        },
        button ? (button.props as ButtonProps)["children"] as React.ReactNode : null,
      );
    }),
  );
}

test("EditorShell renders shared-scene top-down edit handles in the full editor surface without any Konva stage or layer DOM", () => {
  const markup = renderToStaticMarkup(
    createElement(EditorShell, {
      toolbar: createElement("div", { "data-editor-toolbar": "true" }, "Toolbar"),
      floorSidebar: createElement("aside", { "data-floor-sidebar": "true" }, "Floors"),
      propertyPanel: createElement("section", { "data-property-panel": "true" }, "Properties"),
      viewerSurface: createSharedSceneViewerSurfaceMarkup(),
      viewMode: "edit",
      onViewModeChange: () => undefined,
      onExportSvg: () => undefined,
      onShare: () => undefined,
    }),
  );

  assert.match(markup, /data-editor-surface="viewer-25d-shared-scene-overlay"/);
  assert.match(markup, /data-world-handle-id="floor-ground:room-lobby:vertex:0"/);
  assert.match(markup, /data-world-handle-id="floor-ground:room-lobby:opening:opening-window-east"/);
  assert.match(markup, /data-world-handle-id="floor-ground:guide-object:guide-desk"/);
  assert.match(markup, /data-world-handle-id="floor-ground:vertical-connector:connector-core"/);
  assert.match(markup, /data-world-handle-id="exterior:vertex:0"/);
  assert.doesNotMatch(markup, /konvajs-content/);
  assert.doesNotMatch(markup, /<stage/i);
  assert.doesNotMatch(markup, /<layer/i);
  assert.doesNotMatch(markup, /data-editor-surface="canvas-2d"/);
  assert.doesNotMatch(markup, /<canvas/i);
});

test("EditorPage composes the editor surface without importing the removed Canvas2D Konva overlay module", () => {
  const source = fs.readFileSync(editorPagePath, "utf8");
  const packageManifest = fs.readFileSync(packageManifestPath, "utf8");

  assert.match(source, /Viewer25D/);
  assert.doesNotMatch(source, /Canvas2D/);
  assert.doesNotMatch(source, /react-konva/);
  assert.doesNotMatch(source, /\bkonva\b/);
  assert.doesNotMatch(packageManifest, /"react-konva"/);
  assert.doesNotMatch(packageManifest, /"konva"/);
});

test("EditorPage preserves one shared Viewer25D scene root while switching camera modes between edit and preview", () => {
  const editSceneRoot = resolveEditorSceneRootLifecycleState("edit");
  const previewSceneRoot = resolveEditorSceneRootLifecycleState("preview");
  const source = fs.readFileSync(editorPagePath, "utf8");

  assert.equal(editSceneRoot.sceneRootKey, "viewer25d-shared-scene-root");
  assert.equal(previewSceneRoot.sceneRootKey, editSceneRoot.sceneRootKey);
  assert.equal(editSceneRoot.cameraMode, "top-down-orthographic");
  assert.equal(previewSceneRoot.cameraMode, "perspective");
  assert.equal(
    editSceneRoot.sceneReuseStrategy,
    "reuse-loaded-viewer25d-scene",
  );
  assert.equal(
    previewSceneRoot.sceneReuseStrategy,
    editSceneRoot.sceneReuseStrategy,
  );
  assert.equal(editSceneRoot.shouldLoadSeparate2DScene, false);
  assert.equal(previewSceneRoot.shouldLoadSeparate2DScene, false);
  assert.equal(editSceneRoot.shouldBuildSeparate2DScene, false);
  assert.equal(previewSceneRoot.shouldBuildSeparate2DScene, false);
  assert.match(source, /resolveEditorSceneRootLifecycleState\(viewMode\)/);
  assert.match(source, /key=\{viewerSceneRoot\.sceneRootKey\}/);
  assert.match(source, /cameraMode=\{viewerSceneRoot\.cameraMode\}/);
});

test("EditorPage camera mode switching does not invoke scene-loading or asset reload code paths", () => {
  const source = fs.readFileSync(editorPagePath, "utf8");

  assert.match(source, /const \[viewMode, setViewMode\] = useState<EditorViewMode>\("edit"\)/);
  assert.match(source, /const viewerSceneRoot = resolveEditorSceneRootLifecycleState\(viewMode\)/);
  assert.match(source, /useEffect\(\(\) => \{ loadFromLocalStorage\(\); \}, \[loadFromLocalStorage\]\);/);
  assert.doesNotMatch(source, /useEffect\(\(\) => \{ loadFromLocalStorage\(\); \}, \[viewMode/);
  assert.doesNotMatch(source, /useEffect\(\(\) => \{ loadFromLocalStorage\(\); \}, \[[^\]]*viewerSceneRoot/);
  assert.doesNotMatch(source, /loadFloorReferenceImage/);
  assert.doesNotMatch(source, /resolveFloorReferenceImage/);
  assert.doesNotMatch(source, /loadStoredFloorPlanImage/);
  assert.equal(source.match(/loadFromLocalStorage\(/g)?.length, 1);
});
