import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_SERIALIZED_PROJECT_EDITOR_CONFIG,
  restoreProjectNonGeometryData,
  serializeProjectNonGeometryData,
  type EditorProjectNonGeometryData,
  type SerializedProjectNonGeometryData,
} from "../src/features/project-export/project-non-geometry-serializer.ts";

test("serializeProjectNonGeometryData exports complete non-geometry project fields", () => {
  const data: EditorProjectNonGeometryData = {
    assets: [
      {
        assetId: "asset-floor-1-plan",
        assetType: "reference-image",
        floorId: "floor-1",
        fileName: "ground-floor.png",
        mimeType: "image/png",
        size: 2048,
        storageKey: "daedalus.floorPlanAsset:asset-floor-1-plan",
        assetRef: "floor-plan://project-alpha/floor-1/asset-floor-1-plan",
      },
    ],
    annotations: [
      {
        annotationId: "annotation-lobby-note",
        floorId: "floor-1",
        annotationType: "note",
        text: "Main reception desk",
        targetRoomId: "room-lobby",
        position: { x: 3, y: 2 },
        color: "#ff6b35",
        isVisible: true,
      },
    ],
    editorConfig: {
      selectedTool: "annotation",
      snapToGrid: true,
      gridSize: 24,
      showGrid: false,
      showReferenceImages: true,
      showRoomLabels: false,
    },
  };

  const serialized = serializeProjectNonGeometryData(data);

  assert.deepEqual(serialized, {
    assets: [
      {
        assetId: "asset-floor-1-plan",
        assetType: "reference-image",
        floorId: "floor-1",
        fileName: "ground-floor.png",
        mimeType: "image/png",
        size: 2048,
        storageKey: "daedalus.floorPlanAsset:asset-floor-1-plan",
        assetRef: "floor-plan://project-alpha/floor-1/asset-floor-1-plan",
      },
    ],
    annotations: [
      {
        annotationId: "annotation-lobby-note",
        floorId: "floor-1",
        annotationType: "note",
        text: "Main reception desk",
        targetRoomId: "room-lobby",
        position: { x: 3, y: 2 },
        color: "#ff6b35",
        isVisible: true,
      },
    ],
    editorConfig: {
      selectedTool: "annotation",
      snapToGrid: true,
      gridSize: 24,
      showGrid: false,
      showReferenceImages: true,
      showRoomLabels: false,
    },
  });
});

test("serializeProjectNonGeometryData clones mutable fields and applies editor config defaults", () => {
  const data: EditorProjectNonGeometryData = {
    assets: [
      {
        assetId: "asset-icon-exit",
        assetType: "icon",
        floorId: null,
        fileName: "exit.svg",
        mimeType: "image/svg+xml",
        size: 512,
        storageKey: "daedalus.asset:exit-icon",
        assetRef: "asset://project-alpha/icons/exit",
      },
    ],
    annotations: [
      {
        annotationId: "annotation-exit-arrow",
        floorId: "floor-2",
        annotationType: "arrow",
        text: "Exit route",
        targetRoomId: null,
        position: { x: 10, y: 4 },
        color: "#1f7a8c",
        isVisible: true,
      },
    ],
    editorConfig: {
      selectedTool: "select",
      showRoomLabels: false,
    },
  };

  const serialized = serializeProjectNonGeometryData(data);

  assert.notEqual(serialized.assets, data.assets);
  assert.notEqual(serialized.annotations, data.annotations);
  assert.notEqual(serialized.annotations[0].position, data.annotations[0].position);
  assert.deepEqual(serialized.editorConfig, {
    ...DEFAULT_SERIALIZED_PROJECT_EDITOR_CONFIG,
    selectedTool: "select",
    showRoomLabels: false,
  });

  data.annotations[0].position.x = 99;
  assert.deepEqual(serialized.annotations[0].position, { x: 10, y: 4 });
});

test("serializeProjectNonGeometryData produces JSON-compatible defaults when optional data is missing", () => {
  const serialized = serializeProjectNonGeometryData({});

  assert.deepEqual(serialized, {
    assets: [],
    annotations: [],
    editorConfig: DEFAULT_SERIALIZED_PROJECT_EDITOR_CONFIG,
  });
  assert.deepEqual(JSON.parse(JSON.stringify(serialized)), serialized);
});

test("restoreProjectNonGeometryData hydrates imported object records with floor and room placement metadata intact", () => {
  const serialized: SerializedProjectNonGeometryData = {
    assets: [
      {
        assetId: "asset-floor-2-reference",
        assetType: "reference-image",
        floorId: "floor-2",
        fileName: "second-floor.png",
        mimeType: "image/png",
        size: 4096,
        storageKey: "daedalus.floorPlanAsset:asset-floor-2-reference",
        assetRef: "floor-plan://project-alpha/floor-2/reference",
      },
      {
        assetId: "asset-global-exit-icon",
        assetType: "icon",
        floorId: null,
        fileName: "exit.svg",
        mimeType: "image/svg+xml",
        size: 512,
        storageKey: "daedalus.asset:exit-icon",
        assetRef: "asset://project-alpha/icons/exit",
      },
    ],
    annotations: [
      {
        annotationId: "annotation-lobby-label",
        floorId: "floor-1",
        annotationType: "label",
        text: "Main Lobby",
        targetRoomId: "room-lobby",
        position: { x: 6, y: 3 },
        color: "#123456",
        isVisible: true,
      },
      {
        annotationId: "annotation-wayfinding-note",
        floorId: "floor-2",
        annotationType: "note",
        text: "Check-in desk",
        targetRoomId: null,
        position: { x: 8, y: 5 },
        color: "#654321",
        isVisible: false,
      },
    ],
    editorConfig: {
      selectedTool: "annotation",
      snapToGrid: true,
      gridSize: 24,
      showGrid: false,
      showReferenceImages: true,
      showRoomLabels: false,
    },
  };

  const restored = restoreProjectNonGeometryData(serialized);

  assert.deepEqual(restored, {
    assets: [
      {
        assetId: "asset-floor-2-reference",
        assetType: "reference-image",
        floorId: "floor-2",
        fileName: "second-floor.png",
        mimeType: "image/png",
        size: 4096,
        storageKey: "daedalus.floorPlanAsset:asset-floor-2-reference",
        assetRef: "floor-plan://project-alpha/floor-2/reference",
      },
      {
        assetId: "asset-global-exit-icon",
        assetType: "icon",
        floorId: null,
        fileName: "exit.svg",
        mimeType: "image/svg+xml",
        size: 512,
        storageKey: "daedalus.asset:exit-icon",
        assetRef: "asset://project-alpha/icons/exit",
      },
    ],
    annotations: [
      {
        annotationId: "annotation-lobby-label",
        floorId: "floor-1",
        annotationType: "label",
        text: "Main Lobby",
        targetRoomId: "room-lobby",
        position: { x: 6, y: 3 },
        color: "#123456",
        isVisible: true,
      },
      {
        annotationId: "annotation-wayfinding-note",
        floorId: "floor-2",
        annotationType: "note",
        text: "Check-in desk",
        targetRoomId: null,
        position: { x: 8, y: 5 },
        color: "#654321",
        isVisible: false,
      },
    ],
    editorConfig: {
      selectedTool: "annotation",
      snapToGrid: true,
      gridSize: 24,
      showGrid: false,
      showReferenceImages: true,
      showRoomLabels: false,
    },
  });
});

test("restoreProjectNonGeometryData clones imported object records for mutable editor state", () => {
  const serialized: SerializedProjectNonGeometryData = {
    assets: [
      {
        assetId: "asset-floor-1-plan",
        assetType: "reference-image",
        floorId: "floor-1",
        fileName: "ground.png",
        mimeType: "image/png",
        size: 2048,
        storageKey: "daedalus.floorPlanAsset:asset-floor-1-plan",
        assetRef: "floor-plan://project-alpha/floor-1/ground.png",
      },
    ],
    annotations: [
      {
        annotationId: "annotation-lobby-note",
        floorId: "floor-1",
        annotationType: "note",
        text: "Desk",
        targetRoomId: "room-lobby",
        position: { x: 3, y: 2 },
        color: "#ff6b35",
        isVisible: true,
      },
    ],
    editorConfig: {
      selectedTool: "select",
      snapToGrid: false,
      gridSize: 16,
      showGrid: true,
      showReferenceImages: true,
      showRoomLabels: true,
    },
  };

  const restored = restoreProjectNonGeometryData(serialized);
  restored.assets[0].floorId = "floor-9";
  restored.annotations[0].targetRoomId = "room-updated";
  restored.annotations[0].position.x = 99;
  restored.editorConfig.selectedTool = "annotation";

  assert.equal(serialized.assets[0].floorId, "floor-1");
  assert.equal(serialized.annotations[0].targetRoomId, "room-lobby");
  assert.equal(serialized.annotations[0].position.x, 3);
  assert.equal(serialized.editorConfig.selectedTool, "select");
});
