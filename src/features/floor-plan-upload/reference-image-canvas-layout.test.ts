import test from "node:test";
import assert from "node:assert/strict";

import {
  LOCKED_REFERENCE_IMAGE_LAYER_POLICY,
  calculateReferenceImageCanvasLayout,
} from "./reference-image-canvas-layout.ts";

test("fits a wide reference image within the editor canvas without distortion", () => {
  assert.deepEqual(
    calculateReferenceImageCanvasLayout({
      canvasWidth: 800,
      canvasHeight: 600,
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

test("fits a tall reference image within the editor canvas without distortion", () => {
  assert.deepEqual(
    calculateReferenceImageCanvasLayout({
      canvasWidth: 800,
      canvasHeight: 600,
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
      canvasWidth: 800,
      canvasHeight: 600,
      imageWidth: 0,
      imageHeight: 1200,
    }),
    null,
  );
});

test("locks the reference image layer out of editor interactions and editable exports", () => {
  assert.deepEqual(LOCKED_REFERENCE_IMAGE_LAYER_POLICY, {
    layerListening: false,
    imageListening: false,
    imageDraggable: false,
    selectable: false,
    movable: false,
    editableObjectExport: false,
  });
});
