import assert from "node:assert/strict";
import test from "node:test";

import {
  adaptProjectSnapshotToRenderScene,
  createRendererEntrypoint,
  createRendererExtensionRegistry,
  type RendererFeatureHandler,
  type RendererOutputHandler,
  type RendererSnapshotProject,
} from "../src/features/renderer/index.ts";

test("future feature handlers and output handlers can register through the renderer extension registry without changing core renderer modules", () => {
  const project = createSnapshotProject();
  const scene = adaptProjectSnapshotToRenderScene(project);
  const registry = createRendererExtensionRegistry();

  const boundarySummaryHandler: RendererFeatureHandler<number> = {
    extensionId: "feature.shared-boundary-summary",
    kind: "feature-handler",
    featureKey: "shared-boundary-summary",
    execute(context) {
      return context.scene.floors.reduce(
        (count, floor) =>
          count +
          floor.rooms.reduce(
            (roomCount, room) => roomCount + room.boundaries.length,
            0,
          ),
        0,
      );
    },
  };
  const markdownOutputHandler: RendererOutputHandler<string> = {
    extensionId: "output.markdown-guide-summary",
    kind: "output-type",
    outputType: "markdown-guide-summary",
    execute(context) {
      return [
        `# ${context.project.projectName}`,
        `floors:${context.scene.floors.length}`,
        `active:${context.scene.activeFloorId ?? "none"}`,
      ].join("\n");
    },
  };

  registry.registerFeatureHandler(boundarySummaryHandler);
  registry.registerOutputHandler(markdownOutputHandler);

  assert.equal(
    registry.getFeatureHandler("shared-boundary-summary")?.execute({
      project,
      scene,
    }),
    1,
  );
  assert.equal(
    registry.getOutputHandler("markdown-guide-summary")?.execute({
      project,
      scene,
    }),
    ["# Extension Tower", "floors:1", "active:floor-1"].join("\n"),
  );
  assert.deepEqual(
    registry.listFeatureHandlers().map((handler) => handler.featureKey),
    ["shared-boundary-summary"],
  );
  assert.deepEqual(
    registry.listOutputHandlers().map((handler) => handler.outputType),
    ["markdown-guide-summary"],
  );
});

test("renderer extension registry snapshots stay immutable and preserve registration order", () => {
  const registry = createRendererExtensionRegistry();

  registry.registerFeatureHandler({
    extensionId: "feature.room-area-bands",
    kind: "feature-handler",
    featureKey: "room-area-bands",
    execute() {
      return "bands";
    },
  });
  registry.registerOutputHandler({
    extensionId: "output.svg-annotation-layer",
    kind: "output-type",
    outputType: "svg-annotation-layer",
    execute() {
      return "<svg />";
    },
  });

  const snapshot = registry.snapshot();

  assert.ok(Object.isFrozen(snapshot));
  assert.ok(Object.isFrozen(snapshot.featureHandlers));
  assert.ok(Object.isFrozen(snapshot.outputHandlers));
  assert.deepEqual(
    snapshot.featureHandlers.map((handler) => handler.extensionId),
    ["feature.room-area-bands"],
  );
  assert.deepEqual(
    snapshot.outputHandlers.map((handler) => handler.extensionId),
    ["output.svg-annotation-layer"],
  );
});

test("renderer extension registry rejects duplicate extension identifiers and registration keys", () => {
  const registry = createRendererExtensionRegistry();
  const duplicateIdHandler: RendererFeatureHandler<string> = {
    extensionId: "feature.duplicate",
    kind: "feature-handler",
    featureKey: "first-feature",
    execute() {
      return "first";
    },
  };

  registry.registerFeatureHandler(duplicateIdHandler);

  assert.throws(
    () =>
      registry.registerFeatureHandler({
        extensionId: "feature.duplicate",
        kind: "feature-handler",
        featureKey: "second-feature",
        execute() {
          return "second";
        },
      }),
    /already registered/,
  );
  registry.registerOutputHandler({
    extensionId: "output.duplicate-key",
    kind: "output-type",
    outputType: "png-export",
    execute() {
      return "png";
    },
  });
  assert.throws(
    () =>
      registry.registerOutputHandler({
        extensionId: "output.other-id",
        kind: "output-type",
        outputType: "png-export",
        execute() {
          return "png-other";
        },
      }),
    /already registered/,
  );
});

test("extension registries compose with the stable renderer entrypoint instead of replacing it", () => {
  const project = createSnapshotProject();
  const scene = adaptProjectSnapshotToRenderScene(project);
  const entrypoint = createRendererEntrypoint({
    render(inputScene) {
      return `${inputScene.projectId}:${inputScene.floors.length}`;
    },
  });
  const registry = createRendererExtensionRegistry({
    outputHandlers: [
      {
        extensionId: "output.scene-signature",
        kind: "output-type",
        outputType: "scene-signature",
        execute(context) {
          return entrypoint.renderScene(context.scene);
        },
      },
    ],
  });

  assert.equal(entrypoint.renderProjectSnapshot(project), "project-extension:1");
  assert.equal(
    registry.getOutputHandler("scene-signature")?.execute({ project, scene }),
    "project-extension:1",
  );
});

function createSnapshotProject(): RendererSnapshotProject {
  return {
    projectId: "project-extension",
    projectName: "Extension Tower",
    objectVersion: 5,
    floors: [
      {
        floorId: "floor-1",
        floorName: "Ground",
        floorHeight: 3.2,
        referenceImage: "floor-plan://extension/floor-1.png",
        rooms: [
          {
            roomId: "room-lobby",
            roomName: "Lobby",
            roomPolygon: [
              { x: 0, y: 0 },
              { x: 8, y: 0 },
              { x: 8, y: 6 },
              { x: 0, y: 6 },
              { x: 0, y: 0 },
            ],
            sharedBoundaries: [
              {
                edgeId: "edge-lobby-east",
                adjacentRoomId: "room-office",
                adjacentEdgeId: "edge-office-west",
              },
            ],
            area: 48,
            labelPosition: { x: 4, y: 3 },
            openings: [
              {
                openingId: "opening-lobby-door",
                openingType: "door",
                attachedEdgeId: "edge-lobby-east",
                edgeRelativePosition: 0.5,
              },
            ],
          },
        ],
        verticalConnectors: [
          {
            connectorId: "connector-stair-1",
            connectorType: "stair",
            roomId: "room-lobby",
            targetFloorId: "floor-2",
            position: { x: 2, y: 1 },
          },
        ],
      },
    ],
    viewState: {
      activeFloorId: "floor-1",
      selectedRoomId: "room-lobby",
    },
  };
}
