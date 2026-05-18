import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const storeEntrypoints = [
  path.resolve(projectRoot, "src/store/createEditorStore.ts"),
  path.resolve(projectRoot, "src/store/editorStore.ts"),
] as const;

const forbiddenLocalDependencyRoots = [
  path.resolve(projectRoot, "src/features/renderer"),
  path.resolve(projectRoot, "src/features/viewer"),
  path.resolve(projectRoot, "src/components/viewer"),
] as const;

const forbiddenExternalDependencyPatterns = [
  /^three$/,
  /^@react-three\//,
  /^react-konva$/,
  /^konva(?:\/|$)/,
] as const;

const importSpecifierPattern =
  /(?:import|export)\s+(?:type\s+)?(?:[^"'`]*?\s+from\s+)?["'`]([^"'`]+)["'`]/g;

test("editor state package remains renderer-independent", () => {
  const visited = new Set<string>();

  for (const entrypoint of storeEntrypoints) {
    assertRendererIndependentModule(entrypoint, visited);
  }
});

function assertRendererIndependentModule(
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

    const forbiddenExternalPattern = forbiddenExternalDependencyPatterns.find((pattern) =>
      pattern.test(specifier),
    );

    assert.equal(
      forbiddenExternalPattern,
      undefined,
      `Store package imported renderer dependency "${specifier}" from ${toProjectRelativePath(modulePath)}`,
    );

    if (!specifier.startsWith(".")) {
      continue;
    }

    const resolvedModulePath = resolveLocalModuleSpecifier(modulePath, specifier);

    for (const root of forbiddenLocalDependencyRoots) {
      assert.equal(
        resolvedModulePath.startsWith(root),
        false,
        `Store package imported renderer implementation ${toProjectRelativePath(resolvedModulePath)} from ${toProjectRelativePath(modulePath)}`,
      );
    }

    assertRendererIndependentModule(resolvedModulePath, visited);
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
