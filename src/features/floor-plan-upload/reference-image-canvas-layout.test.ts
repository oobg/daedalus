import test from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_EDITOR_FLOOR_SPACE,
  LOCKED_REFERENCE_IMAGE_LAYER_POLICY,
  calculateReferenceImageCanvasLayout,
} from "./reference-image-canvas-layout.ts";

test("fits a wide reference image within the editor floor coordinate space without distortion", () => {
  assert.deepEqual(
    calculateReferenceImageCanvasLayout({
      floorSpaceWidth: 800,
      floorSpaceHeight: 600,
      imageWidth: 1600,
      imageHeight: 800,
    }),
    {
      x: 0,
      y: 100,
      width: 800,
      height: 400,
    },
  );
});

test("fits a tall reference image within the editor floor coordinate space without distortion", () => {
  assert.deepEqual(
    calculateReferenceImageCanvasLayout({
      floorSpaceWidth: 800,
      floorSpaceHeight: 600,
      imageWidth: 600,
      imageHeight: 1200,
    }),
    {
      x: 250,
      y: 0,
      width: 300,
      height: 600,
    },
  );
});

test("returns null when layout inputs cannot produce a visible reference layer", () => {
  assert.equal(
    calculateReferenceImageCanvasLayout({
      floorSpaceWidth: 800,
      floorSpaceHeight: 600,
      imageWidth: 0,
      imageHeight: 1200,
    }),
    null,
  );
});

test("uses a stable editor floor coordinate space for reference image alignment", () => {
  assert.deepEqual(DEFAULT_EDITOR_FLOOR_SPACE, {
    width: 800,
    height: 600,
  });
  assert.deepEqual(
    calculateReferenceImageCanvasLayout({
      floorSpaceWidth: DEFAULT_EDITOR_FLOOR_SPACE.width,
      floorSpaceHeight: DEFAULT_EDITOR_FLOOR_SPACE.height,
      imageWidth: 400,
      imageHeight: 400,
    }),
    {
      x: 100,
      y: 0,
      width: 600,
      height: 600,
    },
  );
});

test("locks the reference image layer out of editor interactions and editable exports", () => {
  assert.deepEqual(LOCKED_REFERENCE_IMAGE_LAYER_POLICY, {
    layerListening: false,
    imageListening: false,
    imageDraggable: false,
    editable: false,
    selectable: false,
    movable: false,
    interceptsPointerEvents: false,
    editableObjectExport: false,
  });
});

test("keeps the plan image from becoming a room editing hit target", () => {
  assert.equal(
    LOCKED_REFERENCE_IMAGE_LAYER_POLICY.layerListening ||
      LOCKED_REFERENCE_IMAGE_LAYER_POLICY.imageListening ||
      LOCKED_REFERENCE_IMAGE_LAYER_POLICY.interceptsPointerEvents,
    false,
  );
  assert.equal(LOCKED_REFERENCE_IMAGE_LAYER_POLICY.editable, false);
  assert.equal(LOCKED_REFERENCE_IMAGE_LAYER_POLICY.selectable, false);
  assert.equal(LOCKED_REFERENCE_IMAGE_LAYER_POLICY.imageDraggable, false);
});
