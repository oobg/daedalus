import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  createEditorProject,
  type EditorFloor,
  type EditorProject,
  type EditorRoom,
} from "../src/domain/editor-state.ts";
import {
  adaptProjectSnapshotToRenderScene,
  type RendererSnapshotProject,
  type RenderSceneData,
} from "../src/features/renderer/index.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const rendererModuleRoot = path.resolve(
  projectRoot,
  "src/features/renderer",
);

const editorDomainEntrypoints = [
  path.resolve(projectRoot, "src/domain/editor-state.ts"),
  path.resolve(projectRoot, "src/domain/floor.ts"),
] as const;

const allowedRendererContractModules = new Set([
  path.resolve(projectRoot, "src/features/renderer/index.ts"),
  path.resolve(projectRoot, "src/features/renderer/renderer-contract.ts"),
]);

const disallowedRendererImplementationModules = new Set([
  path.resolve(projectRoot, "src/features/renderer/renderer-entrypoint.ts"),
  path.resolve(projectRoot, "src/features/renderer/renderer-input-adapter.ts"),
]);

const importSpecifierPattern =
  /(?:import|export)\s+(?:type\s+)?(?:[^"'`]*?\s+from\s+)?["'`]([^"'`]+)["'`]/g;
const namedBindingPattern =
  /(?:import|export)\s*{([^}]*)}\s*from\s*["'`]([^"'`]+)["'`]/g;
const namespaceBindingPattern =
  /import\s+\*\s+as\s+\w+\s+from\s+["'`]([^"'`]+)["'`]/g;
const forbiddenRendererMutationSymbols = new Set([
  "addEditorRoom",
  "updateEditorRoom",
  "removeEditorRoom",
  "createEditorRoomPolygonMutationService",
  "createRoomPolygonSource",
  "replaceRoomPolygonSource",
]);
const forbiddenRendererMutationModulePaths = new Set([
  path.resolve(projectRoot, "src/domain/editor-room-polygon-mutation-service.ts"),
]);

type RendererSceneAdapter = (
  project: RendererSnapshotProject,
) => Readonly<RenderSceneData>;

test("editor domain modules only see the stable renderer contract surface", () => {
  const visited = new Set<string>();

  for (const entrypoint of editorDomainEntrypoints) {
    assertRendererDependencyBoundary(entrypoint, visited);
  }
});

test("editor-facing projection code can swap renderer adapters without caller changes", () => {
  const project = createEditorProject({
    projectId: "project-boundary",
    projectName: "Boundary Tower",
    objectVersion: 7,
    floors: [
      {
        floorId: "floor-1",
        floorName: "Ground",
        floorHeight: 3,
        referenceImage: "floor-plan://boundary/ground.png",
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
            sharedBoundaries: [],
          },
        ],
      },
    ],
    viewState: {
      activeFloorId: "floor-1",
      selectedRoomId: "room-lobby",
    },
  });

  const renderWithAdapter = (
    sourceProject: EditorProject,
    adapter: RendererSceneAdapter,
  ): string => {
    const scene = adapter(asRendererSnapshotProject(sourceProject));
    return [
      scene.projectId,
      scene.activeFloorId ?? "none",
      scene.floors.length,
      scene.floors[0]?.rooms[0]?.area ?? 0,
    ].join(":");
  };

  const alternateAdapter: RendererSceneAdapter = (snapshot) =>
    deepFreeze({
      projectId: snapshot.projectId,
      projectName: snapshot.projectName,
      objectVersion: snapshot.objectVersion,
      activeFloorId: snapshot.viewState.activeFloorId,
      selectedRoomId: snapshot.viewState.selectedRoomId ?? null,
      floors: snapshot.floors.map((floor, floorIndex) => ({
        floorId: floor.floorId,
        floorName: `${floor.floorName}:alternate`,
        floorHeight: floor.floorHeight,
        verticalOffset: floorIndex * 100,
        referenceImage: floor.referenceImage,
        isActive: floor.floorId === snapshot.viewState.activeFloorId,
        rooms: floor.rooms.map((room) => ({
          roomId: room.roomId,
          roomName: room.roomName,
          polygon: room.roomPolygon.map((point) => ({
            x: point.x,
            y: point.y,
          })),
          boundaries: room.sharedBoundaries.map((boundary) => ({
            edgeId: boundary.edgeId,
            adjacentRoomId: boundary.adjacentRoomId,
            adjacentEdgeId: boundary.adjacentEdgeId,
          })),
          area: room.area,
          labelPosition:
            room.labelPosition == null
              ? null
              : {
                  x: room.labelPosition.x,
                  y: room.labelPosition.y,
                },
          bounds: null,
          layers: {
            floor: {
              elementClass: "floor",
              order: 0,
              baseElevation: 0,
            },
            furniture: {
              elementClass: "furniture",
              order: 1,
              baseElevation: 0,
            },
            wall: {
              elementClass: "wall",
              order: 2,
              baseElevation: 0,
            },
          },
          walls: [],
          openings: [],
        })),
        verticalConnectors: [],
      })),
    });

  assert.equal(
    renderWithAdapter(project, adaptProjectSnapshotToRenderScene),
    "project-boundary:floor-1:1:48",
  );
  assert.equal(
    renderWithAdapter(project, alternateAdapter),
    "project-boundary:floor-1:1:48",
  );
});

test("renderer modules cannot bypass editor-domain room polygon mutation boundaries", () => {
  const rendererModules = collectTypeScriptModules(rendererModuleRoot);

  for (const modulePath of rendererModules) {
    assertNoForbiddenRendererMutationImport(modulePath);
    assertNoForbiddenRendererMutationCall(modulePath);
  }
});

function assertRendererDependencyBoundary(
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

    if (
      resolvedModulePath.includes(
        `${path.sep}src${path.sep}features${path.sep}renderer${path.sep}`,
      )
    ) {
      assert.ok(
        allowedRendererContractModules.has(resolvedModulePath),
        `Editor domain module imported renderer implementation module: ${toProjectRelativePath(resolvedModulePath)}`,
      );
      assert.ok(
        !disallowedRendererImplementationModules.has(resolvedModulePath),
        `Editor domain module bypassed the stable renderer contract: ${toProjectRelativePath(resolvedModulePath)}`,
      );
      continue;
    }

    assertRendererDependencyBoundary(resolvedModulePath, visited);
  }
}

function readImportSpecifiers(source: string): string[] {
  return [...source.matchAll(importSpecifierPattern)].map((match) => match[1]);
}

function assertNoForbiddenRendererMutationImport(modulePath: string): void {
  const source = fs.readFileSync(modulePath, "utf8");

  for (const match of source.matchAll(namedBindingPattern)) {
    const [, namedBindingsSource, specifier] = match;

    if (!specifier.startsWith(".")) {
      continue;
    }

    const resolvedModulePath = resolveLocalModuleSpecifier(modulePath, specifier);
    const importedBindings = parseNamedBindings(namedBindingsSource);

    for (const binding of importedBindings) {
      assert.ok(
        !forbiddenRendererMutationSymbols.has(binding),
        `Renderer module imported editor mutation binding "${binding}" from ${toProjectRelativePath(resolvedModulePath)}`,
      );
    }
  }

  for (const match of source.matchAll(namespaceBindingPattern)) {
    const [, specifier] = match;

    if (!specifier.startsWith(".")) {
      continue;
    }

    const resolvedModulePath = resolveLocalModuleSpecifier(modulePath, specifier);

    assert.ok(
      !forbiddenRendererMutationModulePaths.has(resolvedModulePath),
      `Renderer module imported editor mutation service namespace from ${toProjectRelativePath(resolvedModulePath)}`,
    );
  }
}

function assertNoForbiddenRendererMutationCall(modulePath: string): void {
  const source = fs.readFileSync(modulePath, "utf8");

  for (const symbol of forbiddenRendererMutationSymbols) {
    const callPattern = new RegExp(`\\b${symbol}\\s*\\(`, "g");
    assert.equal(
      callPattern.test(source),
      false,
      `Renderer module called editor mutation function "${symbol}" in ${toProjectRelativePath(modulePath)}`,
    );
  }
}

function parseNamedBindings(namedBindingsSource: string): string[] {
  return namedBindingsSource
    .split(",")
    .map((binding) => binding.trim())
    .filter(Boolean)
    .map((binding) => binding.replace(/^type\s+/, ""))
    .map((binding) => binding.split(/\s+as\s+/)[0]?.trim() ?? "")
    .filter(Boolean);
}

function collectTypeScriptModules(directoryPath: string): string[] {
  const collectedModules: string[] = [];

  for (const dirent of fs.readdirSync(directoryPath, { withFileTypes: true })) {
    const entryPath = path.resolve(directoryPath, dirent.name);

    if (dirent.isDirectory()) {
      collectedModules.push(...collectTypeScriptModules(entryPath));
      continue;
    }

    if (dirent.isFile() && entryPath.endsWith(".ts")) {
      collectedModules.push(entryPath);
    }
  }

  return collectedModules.sort();
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

function asRendererSnapshotProject(
  project: EditorProject,
): RendererSnapshotProject {
  return {
    projectId: project.projectId,
    projectName: project.projectName,
    objectVersion: project.objectVersion,
    floors: project.floors.map(asRendererSnapshotFloor),
    viewState: {
      activeFloorId: project.viewState.activeFloorId,
      selectedRoomId: project.viewState.selectedRoomId,
    },
  };
}

function asRendererSnapshotFloor(floor: EditorFloor) {
  return {
    floorId: floor.floorId,
    floorName: floor.floorName,
    floorHeight: floor.floorHeight,
    referenceImage: floor.referenceImage,
    rooms: floor.rooms.map(asRendererSnapshotRoom),
  };
}

function asRendererSnapshotRoom(room: EditorRoom) {
  return {
    roomId: room.roomId,
    roomName: room.roomName,
    roomPolygon: room.roomPolygon.map((point) => ({
      x: point.x,
      y: point.y,
    })),
    sharedBoundaries: room.sharedBoundaries.map((boundary) => ({
      edgeId: boundary.edgeId,
      adjacentRoomId: boundary.adjacentRoomId,
      adjacentEdgeId: boundary.adjacentEdgeId,
    })),
    area: room.area,
    labelPosition:
      room.labelPosition == null
        ? null
        : {
            x: room.labelPosition.x,
            y: room.labelPosition.y,
          },
  };
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
