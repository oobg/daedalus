import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const viewerEntrypoints = [
  path.resolve(projectRoot, "src/features/viewer/index.ts"),
  path.resolve(projectRoot, "src/features/viewer/viewer-capability-boundary.ts"),
  path.resolve(projectRoot, "src/features/viewer/viewer-composition.ts"),
] as const;

const importSpecifierPattern =
  /(?:import|export)\s+(?:type\s+)?(?:[^"'`]*?\s+from\s+)?["'`]([^"'`]+)["'`]/g;

test("viewer composition modules stay decoupled from editor state modules", () => {
  const visited = new Set<string>();

  for (const entrypoint of viewerEntrypoints) {
    assertNoEditorStateDependency(entrypoint, visited);
  }
});

function assertNoEditorStateDependency(
  modulePath: string,
  visited: Set<string>,
): void {
  if (visited.has(modulePath)) {
    return;
  }

  visited.add(modulePath);

  const source = fs.readFileSync(modulePath, "utf8");

  for (const specifier of readImportSpecifiers(source)) {
    if (specifier.startsWith("node:")) {
      continue;
    }

    if (!specifier.startsWith(".")) {
      continue;
    }

    const resolvedModulePath = resolveLocalModuleSpecifier(modulePath, specifier);

    assert.ok(
      !resolvedModulePath.includes(
        `${path.sep}src${path.sep}domain${path.sep}editor-state.ts`,
      ),
      `Viewer module imported editor state dependency: ${toProjectRelativePath(resolvedModulePath)}`,
    );

    assertNoEditorStateDependency(resolvedModulePath, visited);
  }
}

function readImportSpecifiers(source: string): string[] {
  return [...source.matchAll(importSpecifierPattern)].map((match) => match[1]);
}

function resolveLocalModuleSpecifier(
  modulePath: string,
  specifier: string,
): string {
  const resolvedPath = path.resolve(path.dirname(modulePath), specifier);

  if (fs.existsSync(resolvedPath)) {
    return resolvedPath;
  }

  const withTsExtension = `${resolvedPath}.ts`;

  if (fs.existsSync(withTsExtension)) {
    return withTsExtension;
  }

  throw new Error(
    `Unable to resolve "${specifier}" from ${toProjectRelativePath(modulePath)}`,
  );
}

function toProjectRelativePath(modulePath: string): string {
  return path.relative(projectRoot, modulePath);
}
