import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const editorDomainEntrypoints = [
  path.resolve(projectRoot, "src/domain/editor-state.ts"),
  path.resolve(projectRoot, "src/domain/floor.ts"),
] as const;

const allowedLocalModulePrefixes = [
  path.resolve(projectRoot, "src/domain"),
  path.resolve(projectRoot, "src/features/editor/model"),
] as const;

const importSpecifierPattern =
  /(?:import|export)\s+(?:type\s+)?(?:[^"'`]*?\s+from\s+)?["'`]([^"'`]+)["'`]/g;

test("editor domain entrypoints stay isolated from rendering implementations", () => {
  const visited = new Set<string>();
  const importedModules = new Set<string>();

  for (const entrypoint of editorDomainEntrypoints) {
    collectImportedModules(entrypoint, visited, importedModules);
  }

  const importedProjectModules = [...importedModules]
    .filter((modulePath) => modulePath.startsWith(projectRoot))
    .sort();

  for (const modulePath of importedProjectModules) {
    assert.ok(
      allowedLocalModulePrefixes.some((prefix) => modulePath.startsWith(prefix)),
      `Editor domain API imported non-domain module: ${toProjectRelativePath(modulePath)}`,
    );
  }
});

function collectImportedModules(
  modulePath: string,
  visited: Set<string>,
  importedModules: Set<string>,
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
      assert.fail(
        `Editor domain API imported external module "${specifier}" from ${toProjectRelativePath(modulePath)}`,
      );
    }

    const resolvedModulePath = resolveLocalModuleSpecifier(modulePath, specifier);
    importedModules.add(resolvedModulePath);
    collectImportedModules(resolvedModulePath, visited, importedModules);
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
