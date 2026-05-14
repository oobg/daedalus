import type {
  FurnitureDescriptorPrimitiveKind,
  FurnitureDescriptorPrimitivePart,
  PrimitiveFurnitureDescriptor,
} from "./furniture-descriptor-mapping.ts";

const BOX_VERTEX_COUNT = 8;
const CYLINDER_MIN_RADIAL_SEGMENTS = 6;
const ROUNDED_BOX_MIN_SEGMENTS = 2;

export interface FurniturePrimitiveBuildLimits {
  maxBoxVertices?: number;
  maxCylinderRadialSegments?: number;
  maxCylinderVertices?: number;
  maxRoundedBoxSegments?: number;
  maxRoundedBoxVertices?: number;
}

export interface BuiltFurniturePrimitiveBase {
  partId: string;
  primitive: FurnitureDescriptorPrimitiveKind;
  dimensions: Readonly<{
    width: number;
    depth: number;
    height: number;
  }>;
  position: Readonly<{
    x: number;
    y: number;
    z: number;
  }>;
  segmentCount: number;
  vertexCount: number;
}

export interface BuiltFurnitureBoxPrimitive
  extends BuiltFurniturePrimitiveBase {
  primitive: "box";
  geometryArgs: readonly [width: number, height: number, depth: number];
}

export interface BuiltFurnitureCylinderPrimitive
  extends BuiltFurniturePrimitiveBase {
  primitive: "cylinder";
  geometryArgs: readonly [
    radiusTop: number,
    radiusBottom: number,
    height: number,
    radialSegments: number,
  ];
  radialSegments: number;
}

export interface BuiltFurnitureRoundedBoxPrimitive
  extends BuiltFurniturePrimitiveBase {
  primitive: "rounded-box";
  cornerRadius: number;
  geometryArgs: readonly [
    width: number,
    height: number,
    depth: number,
    segments: number,
    radius: number,
  ];
}

export type BuiltFurniturePrimitive =
  | BuiltFurnitureBoxPrimitive
  | BuiltFurnitureCylinderPrimitive
  | BuiltFurnitureRoundedBoxPrimitive;

const DEFAULT_LIMITS = Object.freeze({
  maxBoxVertices: BOX_VERTEX_COUNT,
  maxCylinderRadialSegments: 12,
  maxCylinderVertices: 26,
  maxRoundedBoxSegments: 4,
  maxRoundedBoxVertices: 72,
} satisfies Required<FurniturePrimitiveBuildLimits>);

export function buildFurniturePrimitive(
  part: FurnitureDescriptorPrimitivePart,
  limits: FurniturePrimitiveBuildLimits = {},
): BuiltFurniturePrimitive {
  assertValidPrimitivePart(part);

  switch (part.primitive) {
    case "box":
      return buildBoxPrimitive(part, limits);
    case "cylinder":
      return buildCylinderPrimitive(part, limits);
    case "rounded-box":
      return buildRoundedBoxPrimitive(part, limits);
  }
}

export function buildFurniturePrimitives(
  descriptor: PrimitiveFurnitureDescriptor,
  limits: FurniturePrimitiveBuildLimits = {},
): BuiltFurniturePrimitive[] {
  return descriptor.parts.map((part) => buildFurniturePrimitive(part, limits));
}

function buildBoxPrimitive(
  part: FurnitureDescriptorPrimitivePart,
  limits: FurniturePrimitiveBuildLimits,
): BuiltFurnitureBoxPrimitive {
  const maxBoxVertices = limits.maxBoxVertices ?? DEFAULT_LIMITS.maxBoxVertices;

  if (maxBoxVertices < BOX_VERTEX_COUNT) {
    throw new Error(
      `Box primitive "${part.partId}" requires at least ${BOX_VERTEX_COUNT} vertices.`,
    );
  }

  return freezePrimitive({
    partId: part.partId,
    primitive: "box",
    dimensions: { ...part.dimensions },
    position: { ...part.position },
    geometryArgs: [
      part.dimensions.width,
      part.dimensions.height,
      part.dimensions.depth,
    ],
    segmentCount: 1,
    vertexCount: BOX_VERTEX_COUNT,
  });
}

function buildCylinderPrimitive(
  part: FurnitureDescriptorPrimitivePart,
  limits: FurniturePrimitiveBuildLimits,
): BuiltFurnitureCylinderPrimitive {
  const radialSegmentCap = Math.max(
    CYLINDER_MIN_RADIAL_SEGMENTS,
    Math.floor(
      limits.maxCylinderRadialSegments ??
        DEFAULT_LIMITS.maxCylinderRadialSegments,
    ),
  );
  const vertexCap = Math.max(
    estimateCylinderVertexCount(CYLINDER_MIN_RADIAL_SEGMENTS),
    Math.floor(
      limits.maxCylinderVertices ?? DEFAULT_LIMITS.maxCylinderVertices,
    ),
  );
  const diameter = Math.min(part.dimensions.width, part.dimensions.depth);
  const targetSegments = Math.round((Math.PI * diameter) / 0.14);
  const radialSegments = clamp(
    targetSegments,
    CYLINDER_MIN_RADIAL_SEGMENTS,
    Math.min(radialSegmentCap, maxCylinderSegmentsForVertexCap(vertexCap)),
  );

  return freezePrimitive({
    partId: part.partId,
    primitive: "cylinder",
    dimensions: { ...part.dimensions },
    position: { ...part.position },
    geometryArgs: [
      diameter / 2,
      diameter / 2,
      part.dimensions.height,
      radialSegments,
    ],
    radialSegments,
    segmentCount: radialSegments,
    vertexCount: estimateCylinderVertexCount(radialSegments),
  });
}

function buildRoundedBoxPrimitive(
  part: FurnitureDescriptorPrimitivePart,
  limits: FurniturePrimitiveBuildLimits,
): BuiltFurnitureRoundedBoxPrimitive {
  const maxRadius =
    Math.min(
      part.dimensions.width,
      part.dimensions.depth,
      part.dimensions.height,
    ) / 2;
  const cornerRadius = clamp(
    part.cornerRadius ?? maxRadius * 0.35,
    0.01,
    maxRadius,
  );
  const segmentCap = Math.max(
    ROUNDED_BOX_MIN_SEGMENTS,
    Math.floor(
      limits.maxRoundedBoxSegments ?? DEFAULT_LIMITS.maxRoundedBoxSegments,
    ),
  );
  const vertexCap = Math.max(
    estimateRoundedBoxVertexCount(ROUNDED_BOX_MIN_SEGMENTS),
    Math.floor(
      limits.maxRoundedBoxVertices ?? DEFAULT_LIMITS.maxRoundedBoxVertices,
    ),
  );
  const targetSegments = Math.round(cornerRadius / 0.025);
  const segments = clamp(
    targetSegments,
    ROUNDED_BOX_MIN_SEGMENTS,
    Math.min(segmentCap, maxRoundedBoxSegmentsForVertexCap(vertexCap)),
  );

  return freezePrimitive({
    partId: part.partId,
    primitive: "rounded-box",
    dimensions: { ...part.dimensions },
    position: { ...part.position },
    cornerRadius,
    geometryArgs: [
      part.dimensions.width,
      part.dimensions.height,
      part.dimensions.depth,
      segments,
      cornerRadius,
    ],
    segmentCount: segments,
    vertexCount: estimateRoundedBoxVertexCount(segments),
  });
}

function assertValidPrimitivePart(part: FurnitureDescriptorPrimitivePart): void {
  const scalarEntries = [
    ["width", part.dimensions.width],
    ["depth", part.dimensions.depth],
    ["height", part.dimensions.height],
    ["x", part.position.x],
    ["y", part.position.y],
    ["z", part.position.z],
  ] as const;

  for (const [label, value] of scalarEntries) {
    if (!Number.isFinite(value)) {
      throw new Error(
        `Furniture primitive part "${part.partId}" must provide a finite ${label}.`,
      );
    }
  }

  for (const [label, value] of scalarEntries.slice(0, 3)) {
    if (value <= 0) {
      throw new Error(
        `Furniture primitive part "${part.partId}" must provide a positive ${label}.`,
      );
    }
  }
}

function estimateCylinderVertexCount(radialSegments: number): number {
  return radialSegments * 2 + 2;
}

function estimateRoundedBoxVertexCount(segments: number): number {
  return 8 + segments * 16;
}

function maxCylinderSegmentsForVertexCap(vertexCap: number): number {
  return Math.floor((vertexCap - 2) / 2);
}

function maxRoundedBoxSegmentsForVertexCap(vertexCap: number): number {
  return Math.floor((vertexCap - 8) / 16);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function freezePrimitive<T extends BuiltFurniturePrimitive>(primitive: T): T {
  return Object.freeze({
    ...primitive,
    dimensions: Object.freeze({ ...primitive.dimensions }),
    position: Object.freeze({ ...primitive.position }),
    geometryArgs: Object.freeze([...primitive.geometryArgs]) as T["geometryArgs"],
  });
}
