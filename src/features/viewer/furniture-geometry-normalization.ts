import { ShapeUtils, Vector2 } from "three";

const DEFAULT_MAX_TRIANGLE_COUNT = 24;
const DEFAULT_QUANTIZATION_SCALE = 100_000;
const MIN_FOOTPRINT_VERTEX_COUNT = 3;
const MIN_HEIGHT = 0.08;

export interface FurnitureGeometryNormalizationOptions {
  maxTriangleCount?: number;
  quantizationScale?: number;
}

export interface FurnitureAssetGeometryMesh {
  assetId: string;
  indices?: readonly number[];
  positions: readonly number[];
}

export interface NormalizedFurnitureGeometryMesh
  extends FurnitureAssetGeometryMesh {
  footprintVertexCount: number;
  normalizedFromTriangleCount: number;
  normalizedTriangleCount: number;
  source: "miniature-extruded-footprint";
}

interface ProjectedPoint {
  x: number;
  z: number;
}

interface QuantizedProjectedPoint extends ProjectedPoint {
  key: string;
}

interface ProjectedTriangle {
  a: QuantizedProjectedPoint;
  b: QuantizedProjectedPoint;
  c: QuantizedProjectedPoint;
}

interface BoundaryLoopPoint extends QuantizedProjectedPoint {
  links: Set<string>;
}

export function normalizeFurnitureGeometryMesh(
  mesh: FurnitureAssetGeometryMesh,
  options: FurnitureGeometryNormalizationOptions = {},
): NormalizedFurnitureGeometryMesh {
  assertValidMesh(mesh);

  const quantizationScale =
    options.quantizationScale ?? DEFAULT_QUANTIZATION_SCALE;
  const projectedTriangles = readProjectedTriangles(mesh, quantizationScale);
  const boundaryLoop = readDominantBoundaryLoop(projectedTriangles);
  const maxTriangleCount =
    options.maxTriangleCount ?? DEFAULT_MAX_TRIANGLE_COUNT;
  const maxFootprintVertexCount = resolveMaxFootprintVertexCount(
    maxTriangleCount,
  );
  const normalizedFootprint = simplifyBoundaryLoop(
    boundaryLoop,
    maxFootprintVertexCount,
  );
  const height = readMeshHeight(mesh.positions);
  const extrudedMesh = createExtrudedFootprintMesh(
    mesh.assetId,
    normalizedFootprint,
    height,
  );

  return Object.freeze({
    ...extrudedMesh,
    footprintVertexCount: normalizedFootprint.length,
    normalizedFromTriangleCount: readTriangleCount(mesh),
    normalizedTriangleCount: readTriangleCount(extrudedMesh),
    source: "miniature-extruded-footprint",
  });
}

export function normalizeFurnitureGeometryMeshes(
  meshes: readonly FurnitureAssetGeometryMesh[],
  options: FurnitureGeometryNormalizationOptions = {},
): NormalizedFurnitureGeometryMesh[] {
  return meshes.map((mesh) => normalizeFurnitureGeometryMesh(mesh, options));
}

function assertValidMesh(mesh: FurnitureAssetGeometryMesh): void {
  if (mesh.positions.length === 0 || mesh.positions.length % 3 !== 0) {
    throw new Error(
      `Furniture asset "${mesh.assetId}" must provide positions as XYZ triplets.`,
    );
  }

  if (mesh.indices != null && mesh.indices.length % 3 !== 0) {
    throw new Error(
      `Furniture asset "${mesh.assetId}" must provide indices in triangle triplets.`,
    );
  }
}

function readProjectedTriangles(
  mesh: FurnitureAssetGeometryMesh,
  quantizationScale: number,
): ProjectedTriangle[] {
  const projectedVertices = readProjectedVertices(mesh.positions, quantizationScale);
  const triangleVertexIndices =
    mesh.indices != null
      ? [...mesh.indices]
      : Array.from(
          { length: mesh.positions.length / 3 },
          (_, vertexIndex) => vertexIndex,
        );
  const projectedTriangles = new Map<string, ProjectedTriangle>();

  for (let offset = 0; offset < triangleVertexIndices.length; offset += 3) {
    const triangle: ProjectedTriangle = {
      a: projectedVertices[triangleVertexIndices[offset]],
      b: projectedVertices[triangleVertexIndices[offset + 1]],
      c: projectedVertices[triangleVertexIndices[offset + 2]],
    };

    if (Math.abs(measureSignedTriangleArea(triangle)) <= Number.EPSILON) {
      continue;
    }

    projectedTriangles.set(createTriangleKey(triangle), triangle);
  }

  return [...projectedTriangles.values()];
}

function readProjectedVertices(
  positions: readonly number[],
  quantizationScale: number,
): QuantizedProjectedPoint[] {
  const projectedVertices: QuantizedProjectedPoint[] = [];

  for (let offset = 0; offset < positions.length; offset += 3) {
    const x = positions[offset];
    const z = positions[offset + 2];

    projectedVertices.push({
      x,
      z,
      key: quantizePoint({ x, z }, quantizationScale),
    });
  }

  return projectedVertices;
}

function readDominantBoundaryLoop(
  projectedTriangles: readonly ProjectedTriangle[],
): ProjectedPoint[] {
  const boundaryPoints = new Map<string, BoundaryLoopPoint>();
  const edgeCounts = new Map<string, number>();
  const directedEdges = new Map<string, readonly [string, string]>();

  for (const triangle of projectedTriangles) {
    for (const [start, end] of [
      [triangle.a, triangle.b],
      [triangle.b, triangle.c],
      [triangle.c, triangle.a],
    ] as const) {
      const edgeKey = createUndirectedEdgeKey(start.key, end.key);
      edgeCounts.set(edgeKey, (edgeCounts.get(edgeKey) ?? 0) + 1);
      directedEdges.set(`${start.key}->${end.key}`, [start.key, end.key]);

      if (!boundaryPoints.has(start.key)) {
        boundaryPoints.set(start.key, { ...start, links: new Set() });
      }

      if (!boundaryPoints.has(end.key)) {
        boundaryPoints.set(end.key, { ...end, links: new Set() });
      }
    }
  }

  for (const edgeCountEntry of directedEdges.values()) {
    const [startKey, endKey] = edgeCountEntry;
    const undirectedKey = createUndirectedEdgeKey(startKey, endKey);

    if ((edgeCounts.get(undirectedKey) ?? 0) !== 1) {
      continue;
    }

    boundaryPoints.get(startKey)?.links.add(endKey);
    boundaryPoints.get(endKey)?.links.add(startKey);
  }

  const visitedEdges = new Set<string>();
  const loops: ProjectedPoint[][] = [];

  for (const point of boundaryPoints.values()) {
    for (const nextKey of point.links) {
      const edgeKey = createUndirectedEdgeKey(point.key, nextKey);

      if (visitedEdges.has(edgeKey)) {
        continue;
      }

      const loop = traceBoundaryLoop(point.key, nextKey, boundaryPoints, visitedEdges);
      if (loop.length >= MIN_FOOTPRINT_VERTEX_COUNT) {
        loops.push(loop);
      }
    }
  }

  if (loops.length === 0) {
    throw new Error("Expected a projected furniture boundary loop to normalize.");
  }

  return loops.reduce((largestLoop, candidateLoop) =>
    Math.abs(measurePolygonArea(candidateLoop)) >
    Math.abs(measurePolygonArea(largestLoop))
      ? candidateLoop
      : largestLoop,
  );
}

function traceBoundaryLoop(
  startKey: string,
  nextKey: string,
  boundaryPoints: ReadonlyMap<string, BoundaryLoopPoint>,
  visitedEdges: Set<string>,
): ProjectedPoint[] {
  const loop: ProjectedPoint[] = [];
  let previousKey = startKey;
  let currentKey = nextKey;

  loop.push(readLoopPoint(boundaryPoints, startKey));

  while (true) {
    visitedEdges.add(createUndirectedEdgeKey(previousKey, currentKey));
    loop.push(readLoopPoint(boundaryPoints, currentKey));

    const currentPoint = boundaryPoints.get(currentKey);
    if (currentPoint == null) {
      break;
    }

    const nextCandidates = [...currentPoint.links].filter(
      (candidateKey) => candidateKey !== previousKey,
    );

    if (currentKey === startKey || nextCandidates.length === 0) {
      break;
    }

    const nextBoundaryKey =
      nextCandidates.length === 1
        ? nextCandidates[0]
        : nextCandidates.sort((leftKey, rightKey) =>
            readTurnScore(
              boundaryPoints.get(previousKey)!,
              currentPoint,
              boundaryPoints.get(leftKey)!,
            ) -
            readTurnScore(
              boundaryPoints.get(previousKey)!,
              currentPoint,
              boundaryPoints.get(rightKey)!,
            ),
          )[0];

    previousKey = currentKey;
    currentKey = nextBoundaryKey;

    if (currentKey === startKey) {
      visitedEdges.add(createUndirectedEdgeKey(previousKey, currentKey));
      break;
    }
  }

  return dedupeClosingLoopPoint(loop);
}

function readLoopPoint(
  boundaryPoints: ReadonlyMap<string, BoundaryLoopPoint>,
  key: string,
): ProjectedPoint {
  const point = boundaryPoints.get(key);

  if (point == null) {
    throw new Error(`Missing boundary point "${key}" while tracing furniture loop.`);
  }

  return { x: point.x, z: point.z };
}

function readTurnScore(
  previous: ProjectedPoint,
  current: ProjectedPoint,
  next: ProjectedPoint,
): number {
  const incomingX = current.x - previous.x;
  const incomingZ = current.z - previous.z;
  const outgoingX = next.x - current.x;
  const outgoingZ = next.z - current.z;

  return Math.atan2(
    incomingX * outgoingZ - incomingZ * outgoingX,
    incomingX * outgoingX + incomingZ * outgoingZ,
  );
}

function dedupeClosingLoopPoint(loop: readonly ProjectedPoint[]): ProjectedPoint[] {
  if (loop.length < 2) {
    return [...loop];
  }

  const firstPoint = loop[0];
  const lastPoint = loop[loop.length - 1];

  if (firstPoint.x === lastPoint.x && firstPoint.z === lastPoint.z) {
    return loop.slice(0, -1);
  }

  return [...loop];
}

function simplifyBoundaryLoop(
  points: readonly ProjectedPoint[],
  targetVertexCount: number,
): ProjectedPoint[] {
  if (points.length <= targetVertexCount) {
    return ensureClockwise([...points]);
  }

  const simplified = [...points];

  while (simplified.length > targetVertexCount) {
    let smallestAreaIndex = -1;
    let smallestArea = Number.POSITIVE_INFINITY;

    for (let index = 0; index < simplified.length; index += 1) {
      const previous = simplified[(index - 1 + simplified.length) % simplified.length];
      const current = simplified[index];
      const next = simplified[(index + 1) % simplified.length];
      const area = Math.abs(
        measureSignedTriangleArea({
          a: { ...previous, key: "" },
          b: { ...current, key: "" },
          c: { ...next, key: "" },
        }),
      );

      if (area < smallestArea) {
        smallestArea = area;
        smallestAreaIndex = index;
      }
    }

    if (smallestAreaIndex < 0) {
      break;
    }

    simplified.splice(smallestAreaIndex, 1);
  }

  return ensureClockwise(simplified);
}

function ensureClockwise(points: readonly ProjectedPoint[]): ProjectedPoint[] {
  return measurePolygonArea(points) < 0 ? [...points] : [...points].reverse();
}

function createExtrudedFootprintMesh(
  assetId: string,
  footprint: readonly ProjectedPoint[],
  height: number,
): FurnitureAssetGeometryMesh {
  const positions: number[] = [];
  const indices: number[] = [];

  for (const point of footprint) {
    positions.push(point.x, 0, point.z);
  }

  for (const point of footprint) {
    positions.push(point.x, height, point.z);
  }

  const topSurfaceTriangles = ShapeUtils.triangulateShape(
    footprint.map((point) => new Vector2(point.x, point.z)),
    [],
  );
  const topOffset = footprint.length;

  for (const [a, b, c] of topSurfaceTriangles) {
    indices.push(topOffset + a, topOffset + b, topOffset + c);
    indices.push(c, b, a);
  }

  for (let index = 0; index < footprint.length; index += 1) {
    const nextIndex = (index + 1) % footprint.length;
    const baseLeft = index;
    const baseRight = nextIndex;
    const topLeft = topOffset + index;
    const topRight = topOffset + nextIndex;

    indices.push(baseLeft, baseRight, topRight);
    indices.push(baseLeft, topRight, topLeft);
  }

  return Object.freeze({
    assetId,
    indices: Object.freeze(indices),
    positions: Object.freeze(positions),
  });
}

function readMeshHeight(positions: readonly number[]): number {
  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (let offset = 1; offset < positions.length; offset += 3) {
    minY = Math.min(minY, positions[offset]);
    maxY = Math.max(maxY, positions[offset]);
  }

  return Math.max(maxY - minY, MIN_HEIGHT);
}

function resolveMaxFootprintVertexCount(maxTriangleCount: number): number {
  if (maxTriangleCount < 8) {
    return MIN_FOOTPRINT_VERTEX_COUNT;
  }

  return Math.max(
    MIN_FOOTPRINT_VERTEX_COUNT,
    Math.floor((maxTriangleCount + 4) / 4),
  );
}

function readTriangleCount(mesh: FurnitureAssetGeometryMesh): number {
  return (mesh.indices?.length ?? mesh.positions.length / 3) / 3;
}

function measureSignedTriangleArea(triangle: ProjectedTriangle): number {
  return (
    ((triangle.b.x - triangle.a.x) * (triangle.c.z - triangle.a.z) -
      (triangle.b.z - triangle.a.z) * (triangle.c.x - triangle.a.x)) / 2
  );
}

function measurePolygonArea(points: readonly ProjectedPoint[]): number {
  let area = 0;

  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    area += current.x * next.z - next.x * current.z;
  }

  return area / 2;
}

function createTriangleKey(triangle: ProjectedTriangle): string {
  return [triangle.a.key, triangle.b.key, triangle.c.key].sort().join("|");
}

function createUndirectedEdgeKey(leftKey: string, rightKey: string): string {
  return [leftKey, rightKey].sort().join("|");
}

function quantizePoint(
  point: ProjectedPoint,
  quantizationScale: number,
): string {
  return `${Math.round(point.x * quantizationScale)}:${Math.round(
    point.z * quantizationScale,
  )}`;
}
