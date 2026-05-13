import type { RendererPort } from "../renderer/renderer-entrypoint.ts";

export interface ViewerExportCompositionValidationIssue {
  path: string;
  message: string;
}

export type ValidateViewerExportCompositionInputResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      issues: readonly ViewerExportCompositionValidationIssue[];
    };

const CALLBACK_NAME_PATTERN = /(?:^|\.)(?:on[A-Z_]|handle[A-Z_]|callback|listener)/;
const MUTATION_NAME_PATTERN =
  /(?:^|\.)(?:add|append|attach|assign|clear|create|delete|detach|edit|insert|link|move|mutate|patch|recalculate|remove|replace|save|select|set|sync|toggle|unlink|update)[A-Z_]/;

export function validateViewerExportCompositionInput(
  renderer: unknown,
): ValidateViewerExportCompositionInputResult {
  const issues: ViewerExportCompositionValidationIssue[] = [];

  if (renderer == null || typeof renderer !== "object") {
    return {
      ok: false,
      issues: [
        {
          path: "<root>",
          message:
            "Viewer/export composition requires a renderer object with a render(scene) function.",
        },
      ],
    };
  }

  const renderValue = (renderer as Record<string, unknown>).render;

  if (typeof renderValue !== "function") {
    issues.push({
      path: "render",
      message:
        "Viewer/export composition requires a render(scene) function and cannot compose editor-only collaborators.",
    });
  }

  const visited = new WeakSet<object>();
  collectDisallowedCallableIssues(renderer, "<root>", visited, issues);

  return issues.length === 0
    ? { ok: true }
    : {
        ok: false,
        issues,
      };
}

export function assertViewerExportCompositionInput<Output>(
  renderer: RendererPort<Output>,
): RendererPort<Output> {
  const result = validateViewerExportCompositionInput(renderer);

  if (result.ok) {
    return renderer;
  }

  throw new TypeError(
    result.issues.map((issue) => issue.message).join(" "),
  );
}

function collectDisallowedCallableIssues(
  value: unknown,
  path: string,
  visited: WeakSet<object>,
  issues: ViewerExportCompositionValidationIssue[],
): void {
  if (value == null || typeof value !== "object") {
    return;
  }

  if (visited.has(value)) {
    return;
  }

  visited.add(value);

  for (const [key, nestedValue] of Object.entries(value)) {
    const propertyPath = path === "<root>" ? key : `${path}.${key}`;

    if (typeof nestedValue === "function") {
      if (propertyPath === "render") {
        continue;
      }

      issues.push({
        path: propertyPath,
        message: describeDisallowedCallable(propertyPath),
      });
      continue;
    }

    collectDisallowedCallableIssues(nestedValue, propertyPath, visited, issues);
  }
}

function describeDisallowedCallable(path: string): string {
  if (CALLBACK_NAME_PATTERN.test(path)) {
    return `Viewer/export composition rejected mutating callback "${path}".`;
  }

  if (MUTATION_NAME_PATTERN.test(path)) {
    return `Viewer/export composition rejected editor-only mutation capability "${path}".`;
  }

  return `Viewer/export composition rejected unexpected callable "${path}". Only render(scene) is allowed across the read-only boundary.`;
}
