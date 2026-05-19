import type {
  EditorFloor,
  EditorPoint,
  EditorProject,
} from "@/domain/editor-state";

export interface TopDownSceneBounds {
  readonly minX: number;
  readonly maxX: number;
  readonly minZ: number;
  readonly maxZ: number;
  readonly width: number;
  readonly depth: number;
  readonly centerX: number;
  readonly centerZ: number;
}

export interface TopDownCameraConfiguration {
  readonly orthographic: true;
  readonly position: readonly [number, number, number];
  readonly up: readonly [number, number, number];
  readonly lookAt: readonly [number, number, number];
  readonly near: number;
  readonly far: number;
  readonly zoom: number;
  readonly enableRotate: false;
}

const MIN_SCENE_SPAN = 2;
const MIN_ZOOM = 32;
const CAMERA_PADDING = 4;
const DEFAULT_BOUNDS: TopDownSceneBounds = Object.freeze({
  minX: -1,
  maxX: 1,
  minZ: -1,
  maxZ: 1,
  width: MIN_SCENE_SPAN,
  depth: MIN_SCENE_SPAN,
  centerX: 0,
  centerZ: 0,
});
const TOP_DOWN_UP: readonly [number, number, number] = Object.freeze([0, 0, -1]);

export function resolveTopDownSceneBoundsFromProject(
  project: Pick<EditorProject, "floors" | "exteriorPolygon">,
): TopDownSceneBounds {
  return resolveTopDownSceneBounds({
    floors: project.floors,
    exteriorPolygon: project.exteriorPolygon,
  });
}

export function resolveTopDownSceneBounds(input: {
  floors: readonly EditorFloor[];
  exteriorPolygon?: readonly EditorPoint[] | null;
}): TopDownSceneBounds {
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;

  const trackPoint = (point: EditorPoint) => {
    const worldX = point.x / 100;
    const worldZ = point.y / 100;
    minX = Math.min(minX, worldX);
    maxX = Math.max(maxX, worldX);
    minZ = Math.min(minZ, worldZ);
    maxZ = Math.max(maxZ, worldZ);
  };

  for (const floor of input.floors) {
    for (const room of floor.rooms) {
      for (const point of room.roomPolygon) {
        trackPoint(point);
      }
    }
  }

  for (const point of input.exteriorPolygon ?? []) {
    trackPoint(point);
  }

  if (!isFinite(minX) || !isFinite(minZ)) {
    return DEFAULT_BOUNDS;
  }

  const width = Math.max(maxX - minX, MIN_SCENE_SPAN);
  const depth = Math.max(maxZ - minZ, MIN_SCENE_SPAN);

  return Object.freeze({
    minX,
    maxX,
    minZ,
    maxZ,
    width,
    depth,
    centerX: (minX + maxX) / 2,
    centerZ: (minZ + maxZ) / 2,
  });
}

export function resolveTopDownCameraConfiguration(
  sceneBounds: TopDownSceneBounds,
): TopDownCameraConfiguration {
  const maxSpan = Math.max(sceneBounds.width, sceneBounds.depth, MIN_SCENE_SPAN);

  return Object.freeze({
    orthographic: true,
    position: [
      sceneBounds.centerX,
      maxSpan * 2 + CAMERA_PADDING,
      sceneBounds.centerZ + 0.001,
    ] as const,
    up: TOP_DOWN_UP,
    lookAt: [sceneBounds.centerX, 0, sceneBounds.centerZ] as const,
    near: 0.1,
    far: Math.max(maxSpan * 8, 64),
    zoom: Math.max(MIN_ZOOM, 240 / maxSpan),
    enableRotate: false,
  });
}
