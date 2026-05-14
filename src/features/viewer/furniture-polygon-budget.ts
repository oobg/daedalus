import {
  resolveFurnitureDescriptor,
  type HandcraftedModelFurnitureDescriptor,
  type PrimitiveFurnitureDescriptor,
  type SupportedFurnitureType,
} from "./furniture-descriptor-mapping.ts";
import {
  buildFurniturePrimitives,
  type BuiltFurniturePrimitive,
  type FurniturePrimitiveBuildLimits,
} from "./furniture-primitive-builder.ts";

export interface FurniturePolygonBudget {
  maxMeshCount: number;
  maxPrimitiveSegmentCount: number;
  maxPrimitiveTriangleCount: number;
  maxTotalSegmentCount: number;
  maxTotalTriangleCount: number;
  maxTotalVertexCount: number;
}

export interface FurniturePolygonBudgetMetrics {
  furnitureType: SupportedFurnitureType;
  maxPrimitiveSegmentCount: number;
  maxPrimitiveTriangleCount: number;
  meshCount: number;
  totalSegmentCount: number;
  totalTriangleCount: number;
  totalVertexCount: number;
}

export interface FurniturePolygonBudgetValidationIssue {
  actual: number;
  maxAllowed: number;
  message: string;
  metric:
    | "maxPrimitiveSegmentCount"
    | "maxPrimitiveTriangleCount"
    | "meshCount"
    | "totalSegmentCount"
    | "totalTriangleCount"
    | "totalVertexCount";
}

export interface FurniturePolygonBudgetValidationResult {
  budget: Readonly<FurniturePolygonBudget>;
  issues: readonly FurniturePolygonBudgetValidationIssue[];
  metrics: Readonly<FurniturePolygonBudgetMetrics>;
  ok: boolean;
}

const DEFAULT_FURNITURE_POLYGON_BUDGETS: Readonly<
  Record<SupportedFurnitureType, Readonly<FurniturePolygonBudget>>
> = Object.freeze({
  bed: freezeBudget({
    maxMeshCount: 3,
    maxPrimitiveSegmentCount: 4,
    maxPrimitiveTriangleCount: 112,
    maxTotalSegmentCount: 10,
    maxTotalTriangleCount: 280,
    maxTotalVertexCount: 176,
  }),
  chair: freezeBudget({
    maxMeshCount: 3,
    maxPrimitiveSegmentCount: 6,
    maxPrimitiveTriangleCount: 64,
    maxTotalSegmentCount: 10,
    maxTotalTriangleCount: 152,
    maxTotalVertexCount: 96,
  }),
  desk: freezeBudget({
    maxMeshCount: 3,
    maxPrimitiveSegmentCount: 2,
    maxPrimitiveTriangleCount: 64,
    maxTotalSegmentCount: 6,
    maxTotalTriangleCount: 144,
    maxTotalVertexCount: 96,
  }),
  sofa: freezeBudget({
    maxMeshCount: 5,
    maxPrimitiveSegmentCount: 3,
    maxPrimitiveTriangleCount: 96,
    maxTotalSegmentCount: 14,
    maxTotalTriangleCount: 384,
    maxTotalVertexCount: 256,
  }),
  storage: freezeBudget({
    maxMeshCount: 3,
    maxPrimitiveSegmentCount: 2,
    maxPrimitiveTriangleCount: 64,
    maxTotalSegmentCount: 6,
    maxTotalTriangleCount: 192,
    maxTotalVertexCount: 128,
  }),
  table: freezeBudget({
    maxMeshCount: 3,
    maxPrimitiveSegmentCount: 12,
    maxPrimitiveTriangleCount: 64,
    maxTotalSegmentCount: 20,
    maxTotalTriangleCount: 136,
    maxTotalVertexCount: 96,
  }),
});

export function resolveFurniturePolygonBudget(
  furnitureType: SupportedFurnitureType,
  overrides: Partial<FurniturePolygonBudget> = {},
): Readonly<FurniturePolygonBudget> {
  return freezeBudget({
    ...DEFAULT_FURNITURE_POLYGON_BUDGETS[furnitureType],
    ...overrides,
  });
}

export function buildFurnitureBudgetPrimitivesForType(
  furnitureType: SupportedFurnitureType,
  limits: FurniturePrimitiveBuildLimits = {},
): BuiltFurniturePrimitive[] {
  const descriptor = resolveFurnitureDescriptor(furnitureType);
  const primitiveDescriptor =
    descriptor.descriptorType === "primitive-composition"
      ? descriptor
      : createBudgetFallbackPrimitiveDescriptor(furnitureType, descriptor);

  return buildFurniturePrimitives(primitiveDescriptor, limits);
}

export function measureFurniturePolygonBudget(
  furnitureType: SupportedFurnitureType,
  primitives: readonly BuiltFurniturePrimitive[],
): Readonly<FurniturePolygonBudgetMetrics> {
  let maxPrimitiveSegmentCount = 0;
  let maxPrimitiveTriangleCount = 0;
  let totalSegmentCount = 0;
  let totalTriangleCount = 0;
  let totalVertexCount = 0;

  for (const primitive of primitives) {
    const primitiveTriangleCount = estimatePrimitiveTriangleCount(primitive);

    maxPrimitiveSegmentCount = Math.max(
      maxPrimitiveSegmentCount,
      primitive.segmentCount,
    );
    maxPrimitiveTriangleCount = Math.max(
      maxPrimitiveTriangleCount,
      primitiveTriangleCount,
    );
    totalSegmentCount += primitive.segmentCount;
    totalTriangleCount += primitiveTriangleCount;
    totalVertexCount += primitive.vertexCount;
  }

  return Object.freeze({
    furnitureType,
    maxPrimitiveSegmentCount,
    maxPrimitiveTriangleCount,
    meshCount: primitives.length,
    totalSegmentCount,
    totalTriangleCount,
    totalVertexCount,
  });
}

export function validateFurniturePolygonBudget(
  furnitureType: SupportedFurnitureType,
  primitives: readonly BuiltFurniturePrimitive[],
  overrides: Partial<FurniturePolygonBudget> = {},
): FurniturePolygonBudgetValidationResult {
  const budget = resolveFurniturePolygonBudget(furnitureType, overrides);
  const metrics = measureFurniturePolygonBudget(furnitureType, primitives);
  const issues: FurniturePolygonBudgetValidationIssue[] = [];

  pushBudgetIssue(issues, "meshCount", metrics.meshCount, budget.maxMeshCount);
  pushBudgetIssue(
    issues,
    "maxPrimitiveSegmentCount",
    metrics.maxPrimitiveSegmentCount,
    budget.maxPrimitiveSegmentCount,
  );
  pushBudgetIssue(
    issues,
    "maxPrimitiveTriangleCount",
    metrics.maxPrimitiveTriangleCount,
    budget.maxPrimitiveTriangleCount,
  );
  pushBudgetIssue(
    issues,
    "totalSegmentCount",
    metrics.totalSegmentCount,
    budget.maxTotalSegmentCount,
  );
  pushBudgetIssue(
    issues,
    "totalTriangleCount",
    metrics.totalTriangleCount,
    budget.maxTotalTriangleCount,
  );
  pushBudgetIssue(
    issues,
    "totalVertexCount",
    metrics.totalVertexCount,
    budget.maxTotalVertexCount,
  );

  return Object.freeze({
    budget,
    issues: Object.freeze(issues),
    metrics,
    ok: issues.length === 0,
  });
}

export function assertFurniturePolygonBudget(
  furnitureType: SupportedFurnitureType,
  primitives: readonly BuiltFurniturePrimitive[],
  overrides: Partial<FurniturePolygonBudget> = {},
): void {
  const validation = validateFurniturePolygonBudget(
    furnitureType,
    primitives,
    overrides,
  );

  if (validation.ok) {
    return;
  }

  throw new Error(
    `Furniture type "${furnitureType}" exceeds its low-poly budget: ${validation.issues
      .map((issue) => issue.message)
      .join("; ")}`,
  );
}

function createBudgetFallbackPrimitiveDescriptor(
  furnitureType: SupportedFurnitureType,
  descriptor: HandcraftedModelFurnitureDescriptor,
): PrimitiveFurnitureDescriptor {
  switch (furnitureType) {
    case "sofa":
      return freezePrimitiveDescriptor({
        descriptorType: "primitive-composition",
        footprint: { ...descriptor.footprint },
        materialTag: descriptor.materialTag,
        silhouette: descriptor.silhouette,
        parts: [
          {
            partId: "base",
            primitive: "rounded-box",
            dimensions: { width: 2.2, depth: 0.96, height: 0.2 },
            position: { x: 0, y: 0.1, z: 0 },
            cornerRadius: 0.08,
          },
          {
            partId: "seat",
            primitive: "rounded-box",
            dimensions: { width: 1.96, depth: 0.6, height: 0.18 },
            position: { x: 0, y: 0.31, z: 0.09 },
            cornerRadius: 0.08,
          },
          {
            partId: "backrest",
            primitive: "rounded-box",
            dimensions: { width: 1.96, depth: 0.22, height: 0.52 },
            position: { x: 0, y: 0.56, z: -0.3 },
            cornerRadius: 0.08,
          },
          {
            partId: "arm-left",
            primitive: "rounded-box",
            dimensions: { width: 0.14, depth: 0.86, height: 0.58 },
            position: { x: -1.03, y: 0.39, z: 0.01 },
            cornerRadius: 0.06,
          },
          {
            partId: "arm-right",
            primitive: "rounded-box",
            dimensions: { width: 0.14, depth: 0.86, height: 0.58 },
            position: { x: 1.03, y: 0.39, z: 0.01 },
            cornerRadius: 0.06,
          },
        ],
      });
    case "storage":
      return freezePrimitiveDescriptor({
        descriptorType: "primitive-composition",
        footprint: { ...descriptor.footprint },
        materialTag: descriptor.materialTag,
        silhouette: descriptor.silhouette,
        parts: [
          {
            partId: "plinth",
            primitive: "rounded-box",
            dimensions: { width: 1.08, depth: 0.36, height: 0.08 },
            position: { x: 0, y: 0.04, z: 0 },
            cornerRadius: 0.02,
          },
          {
            partId: "body",
            primitive: "rounded-box",
            dimensions: { width: 1.18, depth: 0.46, height: 1.24 },
            position: { x: 0, y: 0.7, z: 0 },
            cornerRadius: 0.025,
          },
          {
            partId: "top",
            primitive: "rounded-box",
            dimensions: { width: 1.18, depth: 0.46, height: 0.08 },
            position: { x: 0, y: 1.44, z: 0 },
            cornerRadius: 0.025,
          },
        ],
      });
    default:
      throw new Error(
        `Furniture type "${furnitureType}" does not define a representative primitive fallback for polygon budget validation.`,
      );
  }
}

function estimatePrimitiveTriangleCount(
  primitive: BuiltFurniturePrimitive,
): number {
  switch (primitive.primitive) {
    case "box":
      return 12;
    case "cylinder":
      return Math.max(4, primitive.segmentCount * 4 - 4);
    case "rounded-box":
      return 12 + primitive.segmentCount * 24;
  }
}

function pushBudgetIssue(
  issues: FurniturePolygonBudgetValidationIssue[],
  metric: FurniturePolygonBudgetValidationIssue["metric"],
  actual: number,
  maxAllowed: number,
): void {
  if (actual <= maxAllowed) {
    return;
  }

  issues.push({
    actual,
    maxAllowed,
    message: `${metric} measured ${actual} but the budget allows ${maxAllowed}`,
    metric,
  });
}

function freezeBudget(
  budget: FurniturePolygonBudget,
): Readonly<FurniturePolygonBudget> {
  return Object.freeze({ ...budget });
}

function freezePrimitiveDescriptor(
  descriptor: PrimitiveFurnitureDescriptor,
): PrimitiveFurnitureDescriptor {
  return Object.freeze({
    ...descriptor,
    footprint: Object.freeze({ ...descriptor.footprint }),
    parts: Object.freeze(
      descriptor.parts.map((part) =>
        Object.freeze({
          ...part,
          dimensions: Object.freeze({ ...part.dimensions }),
          position: Object.freeze({ ...part.position }),
        }),
      ),
    ),
  });
}
