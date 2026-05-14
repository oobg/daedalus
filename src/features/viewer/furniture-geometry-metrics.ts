const DEFAULT_MAX_TRIANGLE_COUNT = 2_400;
const DEFAULT_MAX_COMPLEXITY_DELTA = 3;
const PROJECTED_AREA_EPSILON = 1e-8;
const QUANTIZATION_SCALE = 100_000;

export interface FurnitureAssetGeometryMesh {
  assetId: string;
  indices?: readonly number[];
  positions: readonly number[];
}

export interface FurnitureAssetGeometryMetricsOptions {
  maxTriangleCount?: number;
  maxSilhouetteComplexityDelta?: number;
}

export interface FurnitureAssetGeometryMetrics {
  assetId: string;
  projectedBounds: Readonly<{
    depth: number;
    width: number;
  }>;
  silhouetteArea: number;
  silhouettePerimeter: number;
  normalizedPolygonCount: number;
  normalizedSilhouetteComplexity: number;
  normalizedSilhouetteCoverage: number;
  triangleCount: number;
}

interface ProjectedPoint {
  x: number;
  z: number;
}

interface ProjectedTriangle {
  a: ProjectedPoint;
  b: ProjectedPoint;
  c: ProjectedPoint;
}

export function computeFurnitureAssetGeometryMetrics(
  mesh: FurnitureAssetGeometryMesh,
  options: FurnitureAssetGeometryMetricsOptions = {},
): FurnitureAssetGeometryMetrics {
  assertValidMesh(mesh);

  const triangleVertexIndices = readTriangleVertexIndices(mesh);
  const projectedVertices = readProjectedVertices(mesh.positions);
  const projectedTriangles = dedupeProjectedTriangles(
    projectedVertices,
    triangleVertexIndices,
  );

  const projectedBounds = measureProjectedBounds(projectedVertices);
  const silhouetteArea = measureProjectedArea(projectedTriangles);
  const silhouettePerimeter = measureProjectedPerimeter(projectedTriangles);
  const triangleCount = triangleVertexIndices.length / 3;
  const maxTriangleCount =
    options.maxTriangleCount ?? DEFAULT_MAX_TRIANGLE_COUNT;
  const normalizedPolygonCount =
    maxTriangleCount <= 0 ? 1 : triangleCount / maxTriangleCount;
  const boundingArea = projectedBounds.width * projectedBounds.depth;
  const normalizedSilhouetteCoverage =
    boundingArea <= PROJECTED_AREA_EPSILON
      ? 0
      : clamp01(silhouetteArea / boundingArea);
  const normalizedSilhouetteComplexity = normalizeComplexityDelta(
    measureComplexityDelta(silhouetteArea, silhouettePerimeter),
    options.maxSilhouetteComplexityDelta ?? DEFAULT_MAX_COMPLEXITY_DELTA,
  );

  return Object.freeze({
    assetId: mesh.assetId,
    projectedBounds: Object.freeze(projectedBounds),
    silhouetteArea,
    silhouettePerimeter,
    normalizedPolygonCount,
    normalizedSilhouetteComplexity,
    normalizedSilhouetteCoverage,
    triangleCount,
  });
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

function readTriangleVertexIndices(mesh: FurnitureAssetGeometryMesh): number[] {
  if (mesh.indices != null) {
    return [...mesh.indices];
  }

  return Array.from(
    { length: mesh.positions.length / 3 },
    (_, vertexIndex) => vertexIndex,
  );
}

function readProjectedVertices(positions: readonly number[]): ProjectedPoint[] {
  const projectedVertices: ProjectedPoint[] = [];

  for (let offset = 0; offset < positions.length; offset += 3) {
    projectedVertices.push({
      x: positions[offset],
      z: positions[offset + 2],
    });
  }

  return projectedVertices;
}

function dedupeProjectedTriangles(
  projectedVertices: readonly ProjectedPoint[],
  triangleVertexIndices: readonly number[],
): ProjectedTriangle[] {
  const projectedTriangles = new Map<string, ProjectedTriangle>();

  for (let offset = 0; offset < triangleVertexIndices.length; offset += 3) {
    const triangle: ProjectedTriangle = {
      a: projectedVertices[triangleVertexIndices[offset]],
      b: projectedVertices[triangleVertexIndices[offset + 1]],
      c: projectedVertices[triangleVertexIndices[offset + 2]],
    };

    if (Math.abs(measureSignedTriangleArea(triangle)) <= PROJECTED_AREA_EPSILON) {
      continue;
    }

    projectedTriangles.set(createTriangleKey(triangle), triangle);
  }

  return [...projectedTriangles.values()];
}

function measureProjectedBounds(
  projectedVertices: readonly ProjectedPoint[],
): { depth: number; width: number } {
  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let minZ = Number.POSITIVE_INFINITY;
  let maxZ = Number.NEGATIVE_INFINITY;

  for (const vertex of projectedVertices) {
    minX = Math.min(minX, vertex.x);
    maxX = Math.max(maxX, vertex.x);
    minZ = Math.min(minZ, vertex.z);
    maxZ = Math.max(maxZ, vertex.z);
  }

  return {
    depth: maxZ - minZ,
    width: maxX - minX,
  };
}

function measureProjectedArea(
  projectedTriangles: readonly ProjectedTriangle[],
): number {
  let area = 0;

  for (const triangle of projectedTriangles) {
    area += Math.abs(measureSignedTriangleArea(triangle));
  }

  return area;
}

function measureProjectedPerimeter(
  projectedTriangles: readonly ProjectedTriangle[],
): number {
  const edgeCounts = new Map<string, number>();
  const edgeLengths = new Map<string, number>();

  for (const triangle of projectedTriangles) {
    for (const [start, end] of [
      [triangle.a, triangle.b],
      [triangle.b, triangle.c],
      [triangle.c, triangle.a],
    ] as const) {
      const edgeKey = createEdgeKey(start, end);

      edgeCounts.set(edgeKey, (edgeCounts.get(edgeKey) ?? 0) + 1);
      edgeLengths.set(edgeKey, measureDistance(start, end));
    }
  }

  let perimeter = 0;

  for (const [edgeKey, edgeCount] of edgeCounts) {
    if (edgeCount === 1) {
      perimeter += edgeLengths.get(edgeKey) ?? 0;
    }
  }

  return perimeter;
}

function measureSignedTriangleArea(triangle: ProjectedTriangle): number {
  return (
    ((triangle.b.x - triangle.a.x) * (triangle.c.z - triangle.a.z) -
      (triangle.b.z - triangle.a.z) * (triangle.c.x - triangle.a.x)) / 2
  );
}

function measureComplexityDelta(area: number, perimeter: number): number {
  if (area <= PROJECTED_AREA_EPSILON || perimeter <= PROJECTED_AREA_EPSILON) {
    return 0;
  }

  return Math.max(0, perimeter ** 2 / (4 * Math.PI * area) - 1);
}

function normalizeComplexityDelta(
  complexityDelta: number,
  maxComplexityDelta: number,
): number {
  if (maxComplexityDelta <= 0) {
    return 1;
  }

  return clamp01(complexityDelta / maxComplexityDelta);
}

function createTriangleKey(triangle: ProjectedTriangle): string {
  return [triangle.a, triangle.b, triangle.c]
    .map((point) => quantizePoint(point))
    .sort()
    .join("|");
}

function createEdgeKey(start: ProjectedPoint, end: ProjectedPoint): string {
  return [quantizePoint(start), quantizePoint(end)].sort().join("|");
}

function quantizePoint(point: ProjectedPoint): string {
  return `${Math.round(point.x * QUANTIZATION_SCALE)}:${Math.round(
    point.z * QUANTIZATION_SCALE,
  )}`;
}

function measureDistance(left: ProjectedPoint, right: ProjectedPoint): number {
  return Math.hypot(right.x - left.x, right.z - left.z);
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}
