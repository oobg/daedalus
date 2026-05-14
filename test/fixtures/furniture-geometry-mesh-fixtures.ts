import { ShapeUtils, Vector2 } from "three";

import type { FurnitureAssetGeometryMesh } from "../../src/features/viewer/furniture-geometry-normalization.ts";

interface FootprintPoint {
  x: number;
  z: number;
}

export const furnitureGeometryMeshFixtures = Object.freeze({
  chairRoundedOctagon: createExtrudedFixture(
    "chair-rounded-octagon",
    [
      { x: -0.42, z: -0.28 },
      { x: -0.3, z: -0.4 },
      { x: 0.3, z: -0.4 },
      { x: 0.42, z: -0.28 },
      { x: 0.42, z: 0.28 },
      { x: 0.3, z: 0.4 },
      { x: -0.3, z: 0.4 },
      { x: -0.42, z: 0.28 },
    ],
    0.42,
  ),
  consoleCrossFootprint: createExtrudedFixture(
    "console-cross-footprint",
    [
      { x: -0.48, z: -0.18 },
      { x: -0.18, z: -0.18 },
      { x: -0.18, z: -0.42 },
      { x: 0.18, z: -0.42 },
      { x: 0.18, z: -0.18 },
      { x: 0.48, z: -0.18 },
      { x: 0.48, z: 0.18 },
      { x: 0.18, z: 0.18 },
      { x: 0.18, z: 0.42 },
      { x: -0.18, z: 0.42 },
      { x: -0.18, z: 0.18 },
      { x: -0.48, z: 0.18 },
    ],
    0.42,
  ),
  sofaScallopedShowpiece: createExtrudedFixture(
    "sofa-scalloped-showpiece",
    [
      { x: -0.6, z: -0.16 },
      { x: -0.5, z: -0.28 },
      { x: -0.36, z: -0.36 },
      { x: -0.18, z: -0.4 },
      { x: 0, z: -0.42 },
      { x: 0.18, z: -0.4 },
      { x: 0.36, z: -0.36 },
      { x: 0.5, z: -0.28 },
      { x: 0.6, z: -0.16 },
      { x: 0.62, z: 0.02 },
      { x: 0.58, z: 0.18 },
      { x: 0.5, z: 0.28 },
      { x: 0.38, z: 0.34 },
      { x: 0.2, z: 0.38 },
      { x: 0, z: 0.4 },
      { x: -0.2, z: 0.38 },
      { x: -0.38, z: 0.34 },
      { x: -0.5, z: 0.28 },
      { x: -0.58, z: 0.18 },
      { x: -0.62, z: 0.02 },
    ],
    0.46,
  ),
});

export function createUnindexedFixture(
  mesh: FurnitureAssetGeometryMesh,
): FurnitureAssetGeometryMesh {
  if (mesh.indices == null) {
    return mesh;
  }

  const positions: number[] = [];

  for (const vertexIndex of mesh.indices) {
    const offset = vertexIndex * 3;

    positions.push(
      mesh.positions[offset],
      mesh.positions[offset + 1],
      mesh.positions[offset + 2],
    );
  }

  return {
    assetId: `${mesh.assetId}-unindexed`,
    positions,
  };
}

function createExtrudedFixture(
  assetId: string,
  footprint: readonly FootprintPoint[],
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
