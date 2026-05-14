export type EditorStateOwnershipLayer =
  | "canonical-editor-data"
  | "derived-readonly-render-data"
  | "selection-state"
  | "transient-ui-interaction-state";

export interface EditorStateOwnershipBoundary {
  readonly layer: EditorStateOwnershipLayer;
  readonly owner: string;
  readonly description: string;
  readonly persistence: "project-json" | "derived-only" | "session-only";
  readonly mutability: "editable-source" | "readonly-derived" | "ui-controlled";
  readonly ownedPaths: readonly string[];
  readonly excludedPaths: readonly string[];
}

export const EDITOR_STATE_OWNERSHIP_BOUNDARIES = Object.freeze([
  {
    layer: "canonical-editor-data",
    owner: "EditorProject domain model",
    description:
      "The editable building-guide source of truth: project metadata, floors, room polygons, shared boundaries, openings, vertical connectors, reference images, and recalculated room metadata.",
    persistence: "project-json",
    mutability: "editable-source",
    ownedPaths: Object.freeze([
      "project.projectId",
      "project.projectName",
      "project.objectVersion",
      "project.floors",
      "project.floors[].floorId",
      "project.floors[].floorName",
      "project.floors[].floorHeight",
      "project.floors[].referenceImage",
      "project.floors[].rooms",
      "project.floors[].rooms[].roomId",
      "project.floors[].rooms[].roomName",
      "project.floors[].rooms[].roomPolygon",
      "project.floors[].rooms[].sharedBoundaries",
      "project.floors[].rooms[].area",
      "project.floors[].rooms[].labelPosition",
      "project.floors[].rooms[].openings",
      "project.floors[].rooms[].edgeOpenings",
      "project.floors[].verticalConnectors",
      "project.floors[].guideObjects",
      "project.exteriorPolygon",
      "project.metadata",
    ]),
    excludedPaths: Object.freeze([
      "project.viewState.activeFloorId",
      "project.viewState.selectedRoomId",
      "renderScene",
      "activeTool",
      "isDrawing",
      "draftPoints",
    ]),
  },
  {
    layer: "derived-readonly-render-data",
    owner: "Renderer adapter contract",
    description:
      "Render-ready data adapted from an editor project snapshot for viewer/export surfaces. It may derive walls, bounds, layers, anchors, active floor flags, and vertical offsets, but it must not become the editable source of truth.",
    persistence: "derived-only",
    mutability: "readonly-derived",
    ownedPaths: Object.freeze([
      "renderScene",
      "renderScene.projectId",
      "renderScene.projectName",
      "renderScene.objectVersion",
      "renderScene.activeFloorId",
      "renderScene.selectedRoomId",
      "renderScene.floors",
      "renderScene.floors[].verticalOffset",
      "renderScene.floors[].isActive",
      "renderScene.floors[].rooms[].polygon",
      "renderScene.floors[].rooms[].boundaries",
      "renderScene.floors[].rooms[].bounds",
      "renderScene.floors[].rooms[].layers",
      "renderScene.floors[].rooms[].walls",
      "renderScene.floors[].rooms[].openings",
      "renderScene.floors[].rooms[].openings[].anchor",
    ]),
    excludedPaths: Object.freeze([
      "project.floors[].rooms[].roomPolygon",
      "project.floors[].rooms[].sharedBoundaries",
      "activeTool",
      "isDrawing",
      "draftPoints",
    ]),
  },
  {
    layer: "selection-state",
    owner: "Editor view state",
    description:
      "Durable editor/viewer navigation state identifying the active floor and selected room without owning or mutating geometry.",
    persistence: "project-json",
    mutability: "ui-controlled",
    ownedPaths: Object.freeze([
      "project.viewState",
      "project.viewState.activeFloorId",
      "project.viewState.selectedRoomId",
    ]),
    excludedPaths: Object.freeze([
      "project.floors",
      "project.floors[].rooms",
      "project.floors[].rooms[].roomPolygon",
      "renderScene",
      "activeTool",
      "isDrawing",
      "draftPoints",
    ]),
  },
  {
    layer: "transient-ui-interaction-state",
    owner: "Zustand editor interaction store",
    description:
      "Ephemeral canvas interaction state used while editing, such as the active tool and unfinished draft polygon points. It is reset by UI actions and is not exported as project data.",
    persistence: "session-only",
    mutability: "ui-controlled",
    ownedPaths: Object.freeze([
      "activeTool",
      "isDrawing",
      "draftPoints",
      "cursorPosition",
      "shiftHeld",
      "hoveredObjectId",
    ]),
    excludedPaths: Object.freeze([
      "project.projectId",
      "project.floors",
      "project.floors[].rooms",
      "project.viewState.activeFloorId",
      "project.viewState.selectedRoomId",
      "renderScene",
    ]),
  },
] satisfies readonly EditorStateOwnershipBoundary[]);

const OWNERSHIP_BY_LAYER = new Map(
  EDITOR_STATE_OWNERSHIP_BOUNDARIES.map((boundary) => [
    boundary.layer,
    boundary,
  ]),
);

export function getEditorStateOwnershipBoundary(
  layer: EditorStateOwnershipLayer,
): EditorStateOwnershipBoundary {
  const boundary = OWNERSHIP_BY_LAYER.get(layer);

  if (boundary == null) {
    throw new Error(`Unknown editor state ownership layer: ${layer}`);
  }

  return boundary;
}

export function classifyEditorStatePath(
  path: string,
): EditorStateOwnershipLayer | null {
  const normalizedPath = normalizeIndexedPath(path);
  let matchingBoundary: EditorStateOwnershipBoundary | null = null;
  let matchingPathLength = -1;

  for (const boundary of EDITOR_STATE_OWNERSHIP_BOUNDARIES) {
    for (const ownedPath of boundary.ownedPaths) {
      if (!pathMatches(normalizedPath, ownedPath)) {
        continue;
      }

      if (ownedPath.length > matchingPathLength) {
        matchingBoundary = boundary;
        matchingPathLength = ownedPath.length;
      }
    }
  }

  return matchingBoundary?.layer ?? null;
}

export function assertEditorStatePathOwnership(
  path: string,
  expectedLayer: EditorStateOwnershipLayer,
): void {
  const actualLayer = classifyEditorStatePath(path);

  if (actualLayer !== expectedLayer) {
    throw new Error(
      `Expected "${path}" to be owned by "${expectedLayer}", but got "${actualLayer ?? "unowned"}".`,
    );
  }
}

function normalizeIndexedPath(path: string): string {
  return path.replace(/\[\d+\]/g, "[]");
}

function pathMatches(path: string, ownedPath: string): boolean {
  return (
    path === ownedPath ||
    path.startsWith(`${ownedPath}.`) ||
    path.startsWith(`${ownedPath}[].`)
  );
}
