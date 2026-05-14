import type { RenderSceneData } from "../renderer/renderer-contract.ts";
import {
  classifySceneElementMaterialTags,
  type SceneElementKind,
  type SceneElementMaterialAssignment,
  type SceneElementMaterialTag,
} from "./scene-element-material-tags.ts";
import {
  resolveSceneElementRenderMaterial,
  type ResolveSceneElementRenderMaterialOptions,
  type SceneElementRenderMaterial,
  type SceneElementRenderMaterialType,
} from "./scene-element-render-material.ts";

export interface AppliedSceneElementMaterialAssignment
  extends SceneElementMaterialAssignment {
  renderMaterial: SceneElementRenderMaterial;
}

export interface SceneMaterialSeparationSummary {
  totalAssignments: number;
  countsByMaterialTag: Readonly<Record<SceneElementMaterialTag, number>>;
  countsByMaterialType: Readonly<Record<SceneElementRenderMaterialType, number>>;
  elementKindsByMaterialTag: Readonly<
    Record<SceneElementMaterialTag, readonly SceneElementKind[]>
  >;
}

export interface AppliedSceneMaterialAssignments {
  projectId: string;
  objectVersion: number;
  assignments: readonly Readonly<AppliedSceneElementMaterialAssignment>[];
  separation: Readonly<SceneMaterialSeparationSummary>;
}

export interface SceneMaterialSeparationValidationIssue {
  materialTag: SceneElementMaterialTag;
  issue: "missing-assignment" | "shared-render-signature";
  detail: string;
}

export interface SceneMaterialSeparationValidationResult {
  ok: boolean;
  issues: readonly Readonly<SceneMaterialSeparationValidationIssue>[];
}

export function applySceneElementRenderMaterials(
  scene: Readonly<RenderSceneData>,
  options: ResolveSceneElementRenderMaterialOptions = {},
): Readonly<AppliedSceneMaterialAssignments> {
  const assignments = classifySceneElementMaterialTags(scene).map((assignment) =>
    deepFreeze({
      ...assignment,
      renderMaterial: resolveSceneElementRenderMaterial(
        assignment.materialTag,
        options,
      ),
    }),
  );

  return deepFreeze({
    projectId: scene.projectId,
    objectVersion: scene.objectVersion,
    assignments,
    separation: summarizeSceneMaterialSeparation(assignments),
  });
}

export function validateSceneMaterialSeparation(
  applied: Readonly<AppliedSceneMaterialAssignments>,
): SceneMaterialSeparationValidationResult {
  const issues: SceneMaterialSeparationValidationIssue[] = [];
  const tagsBySignature = new Map<string, Set<SceneElementMaterialTag>>();
  const countsByTag = applied.separation.countsByMaterialTag;

  for (const assignment of applied.assignments) {
    const signature = getRenderMaterialSignature(assignment.renderMaterial);
    const tags = tagsBySignature.get(signature) ?? new Set<SceneElementMaterialTag>();
    tags.add(assignment.materialTag);
    tagsBySignature.set(signature, tags);
  }

  for (const materialTag of MATERIAL_TAGS) {
    if (countsByTag[materialTag] === 0) {
      continue;
    }

    const matchingAssignment = applied.assignments.find(
      (assignment) => assignment.materialTag === materialTag,
    );

    if (matchingAssignment == null) {
      issues.push({
        materialTag,
        issue: "missing-assignment",
        detail: `Expected at least one ${materialTag} assignment in the applied scene output.`,
      });
      continue;
    }

    const signature = getRenderMaterialSignature(matchingAssignment.renderMaterial);
    const tagsForSignature = tagsBySignature.get(signature);

    if (tagsForSignature != null && tagsForSignature.size > 1) {
      issues.push({
        materialTag,
        issue: "shared-render-signature",
        detail: `Expected ${materialTag} elements to keep a distinct render-material signature.`,
      });
    }
  }

  return deepFreeze({
    ok: issues.length === 0,
    issues,
  });
}

function summarizeSceneMaterialSeparation(
  assignments: readonly Readonly<AppliedSceneElementMaterialAssignment>[],
): Readonly<SceneMaterialSeparationSummary> {
  const countsByMaterialTag: Record<SceneElementMaterialTag, number> = {
    wall: 0,
    "wood-accent": 0,
    glass: 0,
  };
  const countsByMaterialType: Record<SceneElementRenderMaterialType, number> = {
    standard: 0,
    physical: 0,
  };
  const kindsByTag = new Map<SceneElementMaterialTag, Set<SceneElementKind>>(
    MATERIAL_TAGS.map((materialTag) => [materialTag, new Set<SceneElementKind>()]),
  );

  for (const assignment of assignments) {
    countsByMaterialTag[assignment.materialTag] += 1;
    countsByMaterialType[assignment.renderMaterial.materialType] += 1;
    kindsByTag.get(assignment.materialTag)?.add(assignment.elementKind);
  }

  return deepFreeze({
    totalAssignments: assignments.length,
    countsByMaterialTag,
    countsByMaterialType,
    elementKindsByMaterialTag: {
      wall: freezeSortedKinds(kindsByTag.get("wall")),
      "wood-accent": freezeSortedKinds(kindsByTag.get("wood-accent")),
      glass: freezeSortedKinds(kindsByTag.get("glass")),
    },
  });
}

function freezeSortedKinds(
  kinds: Set<SceneElementKind> | undefined,
): readonly SceneElementKind[] {
  return Object.freeze([...(kinds ?? new Set<SceneElementKind>())].sort());
}

function getRenderMaterialSignature(material: SceneElementRenderMaterial): string {
  return JSON.stringify({
    materialTag: material.materialTag,
    materialType: material.materialType,
    config: Object.entries(material.config).sort(([left], [right]) =>
      left.localeCompare(right),
    ),
  });
}

function deepFreeze<T>(value: T): Readonly<T> {
  if (value == null || typeof value !== "object" || Object.isFrozen(value)) {
    return value as Readonly<T>;
  }

  for (const nestedValue of Object.values(value)) {
    deepFreeze(nestedValue);
  }

  return Object.freeze(value);
}

const MATERIAL_TAGS = Object.freeze<SceneElementMaterialTag[]>([
  "wall",
  "wood-accent",
  "glass",
]);
