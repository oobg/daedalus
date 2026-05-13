import assert from "node:assert/strict";
import test from "node:test";

import {
  assertViewerExportCompositionInput,
  createViewerComposition,
  validateViewerExportCompositionInput,
  type RendererPort,
  type RenderSceneData,
} from "../src/features/viewer/index.ts";

test("validateViewerExportCompositionInput accepts a pure render-only composition input", () => {
  const renderer: RendererPort<string> = {
    render(scene) {
      return scene.projectId;
    },
  };

  assert.deepEqual(validateViewerExportCompositionInput(renderer), {
    ok: true,
  });
  assert.equal(assertViewerExportCompositionInput(renderer), renderer);
});

test("validateViewerExportCompositionInput rejects editor-only mutation capabilities on the composition input", () => {
  const renderer = {
    render(scene: Readonly<RenderSceneData>) {
      return scene.projectId;
    },
    updateRoomPolygon() {
      return "mutated";
    },
  };

  const result = validateViewerExportCompositionInput(renderer);

  assert.equal(result.ok, false);
  if (result.ok) {
    return;
  }

  assert.deepEqual(result.issues, [
    {
      path: "updateRoomPolygon",
      message:
        'Viewer/export composition rejected editor-only mutation capability "updateRoomPolygon".',
    },
  ]);
});

test("validateViewerExportCompositionInput rejects nested mutating callbacks on the composition input", () => {
  const renderer = {
    render(scene: Readonly<RenderSceneData>) {
      return scene.projectName;
    },
    callbacks: {
      onRoomPolygonChange() {
        return "changed";
      },
    },
  };

  const result = validateViewerExportCompositionInput(renderer);

  assert.equal(result.ok, false);
  if (result.ok) {
    return;
  }

  assert.deepEqual(result.issues, [
    {
      path: "callbacks.onRoomPolygonChange",
      message:
        'Viewer/export composition rejected mutating callback "callbacks.onRoomPolygonChange".',
    },
  ]);
});

test("createViewerComposition fails fast when viewer/export composition receives mutation callables", () => {
  assert.throws(
    () =>
      createViewerComposition({
        render(scene) {
          return scene.projectId;
        },
        onRoomPolygonChange() {
          return "changed";
        },
      } as RendererPort<string> & {
        onRoomPolygonChange(): string;
      }),
    {
      name: "TypeError",
      message:
        'Viewer/export composition rejected mutating callback "onRoomPolygonChange".',
    },
  );
});
