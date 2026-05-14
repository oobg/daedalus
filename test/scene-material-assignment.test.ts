import assert from "node:assert/strict";
import test from "node:test";

import {
  applySceneElementRenderMaterials,
  getGlassMaterialConfig,
  getWallShadingConfig,
  getWoodAccentShadingConfig,
  validateSceneMaterialSeparation,
  type AppliedSceneMaterialAssignments,
} from "../src/features/viewer/index.ts";
import { type RenderSceneData } from "../src/features/renderer/index.ts";

test("applySceneElementRenderMaterials resolves classified scene elements into immutable scene-level material assignments", () => {
  const applied = applySceneElementRenderMaterials(createRenderScene());

  assert.equal(applied.projectId, "project-material-application");
  assert.equal(applied.objectVersion, 7);
  assert.equal(applied.assignments.length, 7);
  assert.ok(Object.isFrozen(applied));
  assert.ok(Object.isFrozen(applied.assignments));
  assert.ok(Object.isFrozen(applied.assignments[0]));

  assert.deepEqual(applied.assignments[0], {
    elementId: "floor-1:room-lobby:floor",
    elementKind: "room-floor",
    floorId: "floor-1",
    roomId: "room-lobby",
    sourceId: "room-lobby",
    materialTag: "wood-accent",
    renderMaterial: {
      materialTag: "wood-accent",
      materialType: "standard",
      config: getWoodAccentShadingConfig("flooring"),
    },
  });

  assert.deepEqual(applied.assignments[1], {
    elementId: "floor-1:room-lobby:wall:edge-lobby-north",
    elementKind: "wall-segment",
    floorId: "floor-1",
    roomId: "room-lobby",
    sourceId: "edge-lobby-north",
    materialTag: "wall",
    renderMaterial: {
      materialTag: "wall",
      materialType: "standard",
      config: getWallShadingConfig("interior"),
    },
  });

  assert.deepEqual(applied.assignments[4], {
    elementId: "floor-1:room-lobby:opening:opening-lobby-window",
    elementKind: "opening",
    floorId: "floor-1",
    roomId: "room-lobby",
    sourceId: "opening-lobby-window",
    materialTag: "glass",
    renderMaterial: {
      materialTag: "glass",
      materialType: "physical",
      config: getGlassMaterialConfig("windowPane"),
    },
  });

  assert.deepEqual(applied.separation, {
    totalAssignments: 7,
    countsByMaterialTag: {
      wall: 2,
      "wood-accent": 4,
      glass: 1,
    },
    countsByMaterialType: {
      standard: 6,
      physical: 1,
    },
    elementKindsByMaterialTag: {
      wall: ["wall-segment"],
      "wood-accent": ["opening", "room-floor", "vertical-connector"],
      glass: ["opening"],
    },
  });
});

test("validateSceneMaterialSeparation passes when the applied scene output keeps wall, wood, and glass materially distinct", () => {
  const applied = applySceneElementRenderMaterials(createRenderScene(), {
    glassVariant: "windowPaneFallback",
    wallVariant: "exterior",
    woodAccentVariant: "trim",
  });

  const validation = validateSceneMaterialSeparation(applied);

  assert.deepEqual(validation, {
    ok: true,
    issues: [],
  });
  assert.ok(Object.isFrozen(validation));
  assert.equal(
    applied.assignments.find((assignment) => assignment.materialTag === "glass")
      ?.renderMaterial.config,
    getGlassMaterialConfig("windowPaneFallback"),
  );
});

test("validateSceneMaterialSeparation flags when different scene-element tags collapse into the same final render-material signature", () => {
  const applied = applySceneElementRenderMaterials(createRenderScene());
  const collapsed = createCollapsedMaterialOutput(applied);

  const validation = validateSceneMaterialSeparation(collapsed);

  assert.equal(validation.ok, false);
  assert.deepEqual(validation.issues, [
    {
      materialTag: "wall",
      issue: "shared-render-signature",
      detail:
        "Expected wall elements to keep a distinct render-material signature.",
    },
    {
      materialTag: "wood-accent",
      issue: "shared-render-signature",
      detail:
        "Expected wood-accent elements to keep a distinct render-material signature.",
    },
    {
      materialTag: "glass",
      issue: "shared-render-signature",
      detail:
        "Expected glass elements to keep a distinct render-material signature.",
    },
  ]);
});

function createCollapsedMaterialOutput(
  applied: Readonly<AppliedSceneMaterialAssignments>,
): Readonly<AppliedSceneMaterialAssignments> {
  const wallRenderMaterial = applied.assignments.find(
    (assignment) => assignment.materialTag === "wall",
  )?.renderMaterial;

  assert.ok(wallRenderMaterial != null);

  const assignments = applied.assignments.map((assignment) =>
    assignment.materialTag === "wall"
      ? assignment
      : {
          ...assignment,
          renderMaterial: wallRenderMaterial,
        },
  );

  return Object.freeze({
    ...applied,
    assignments: Object.freeze(assignments),
  });
}

function createRenderScene(): RenderSceneData {
  return {
    projectId: "project-material-application",
    projectName: "Material Application",
    objectVersion: 7,
    activeFloorId: "floor-1",
    selectedRoomId: "room-lobby",
    floors: [
      {
        floorId: "floor-1",
        floorName: "Ground",
        floorHeight: 3.5,
        verticalOffset: 0,
        referenceImage: null,
        isActive: true,
        rooms: [
          {
            roomId: "room-lobby",
            roomName: "Lobby",
            polygon: [],
            boundaries: [],
            area: 48,
            labelPosition: { x: 4, y: 3 },
            bounds: null,
            walls: [
              {
                edgeId: "edge-lobby-north",
                start: { x: 0, y: 0 },
                end: { x: 8, y: 0 },
              },
              {
                edgeId: "edge-lobby-east",
                start: { x: 8, y: 0 },
                end: { x: 8, y: 6 },
              },
            ],
            openings: [
              {
                openingId: "opening-lobby-door",
                openingType: "door",
                attachedEdgeId: "edge-lobby-east",
                edgeRelativePosition: 0.5,
                anchor: { x: 8, y: 3 },
              },
              {
                openingId: "opening-lobby-window",
                openingType: "window",
                attachedEdgeId: "edge-lobby-north",
                edgeRelativePosition: 0.25,
                anchor: { x: 2, y: 0 },
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
          {
            connectorId: "connector-elevator-1",
            connectorType: "elevator",
            roomId: "room-lobby",
            targetFloorId: "floor-2",
            position: { x: 6, y: 2 },
          },
        ],
      },
    ],
  };
}
