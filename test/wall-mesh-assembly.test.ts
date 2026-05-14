import assert from "node:assert/strict";
import test from "node:test";

import { createWallCornerMeshes } from "../src/features/viewer/wall-corner-mesh.ts";
import { createWallMeshAssembly } from "../src/features/viewer/wall-mesh-assembly.ts";

test("createWallMeshAssembly keeps final wall output on the softened geometry pipeline across mixed wall layouts", () => {
  const fixtures = [
    {
      expectedCornerMeshes: 0,
      expectedStraightMeshes: 1,
      name: "open wall run",
      options: {
        baseOffset: 0.014,
        curveSegments: 6,
        height: 0.9,
        thickness: 0.045,
        topEdgeRadius: 0.011,
      },
      points: [
        { x: 0, y: 0 },
        { x: 3.4, y: 0.2 },
      ],
    },
    {
      name: "rounded rectangular room",
      options: {
        baseOffset: 0.014,
        curveSegments: 6,
        height: 0.9,
        minimumWallCornerRadius: 0.28,
        thickness: 0.045,
        topEdgeRadius: 0.011,
        wallCornerRadiusRatio: 4.5,
        wallCornerSegments: 4,
        wallCornerStyle: "rounded" as const,
      },
      points: [
        { x: 0, y: 0 },
        { x: 4.2, y: 0 },
        { x: 4.2, y: 3.1 },
        { x: 0, y: 3.1 },
      ],
    },
    {
      name: "concave gallery room",
      options: {
        baseOffset: 0.014,
        curveSegments: 6,
        height: 0.9,
        minimumWallCornerRadius: 0.18,
        thickness: 0.045,
        topEdgeRadius: 0.011,
        wallCornerRadiusRatio: 3.5,
        wallCornerSegments: 3,
        wallCornerStyle: "rounded" as const,
      },
      points: [
        { x: 0, y: 0 },
        { x: 4.8, y: 0 },
        { x: 4.8, y: 1.4 },
        { x: 2.6, y: 1.4 },
        { x: 2.6, y: 3.6 },
        { x: 0, y: 3.6 },
      ],
    },
  ];

  for (const fixture of fixtures) {
    const assembly = createWallMeshAssembly(fixture.points, fixture.options);
    const cornerMeshes = createWallCornerMeshes(fixture.points, fixture.options);
    const expectedCornerMeshes =
      fixture.expectedCornerMeshes ?? cornerMeshes.length;
    const expectedStraightMeshes =
      fixture.expectedStraightMeshes ?? fixture.points.length;

    assert.equal(
      assembly.cornerMeshCount,
      expectedCornerMeshes,
      `Expected ${fixture.name} to preserve the full softened-corner output count.`,
    );
    assert.equal(
      assembly.straightMeshCount,
      expectedStraightMeshes,
      `Expected ${fixture.name} to stitch each wall span with softened straight segments only.`,
    );
    assert.equal(
      assembly.meshes.length,
      assembly.cornerMeshCount + assembly.straightMeshCount,
      `Expected ${fixture.name} to expose every rendered wall mesh through the assembly.`,
    );
    assert.equal(
      assembly.usesOnlySoftenedGeometryPipeline,
      true,
      `Expected ${fixture.name} to reject any non-softened wall geometry path.`,
    );
    assert.ok(
      assembly.meshes.length > 0,
      `Expected ${fixture.name} to yield rendered wall meshes.`,
    );

    for (const mesh of assembly.meshes) {
      assert.equal(mesh.geometry.type, "ExtrudeGeometry");
      assert.notEqual(mesh.geometry.type, "BoxGeometry");
      assert.ok(
        mesh.source === "softened-straight-segment" ||
          mesh.source === "softened-corner-path",
        `Expected ${fixture.name} to use only softened wall mesh sources.`,
      );
    }

    if (fixture.points.length > 2) {
      assertClosedLoopAssemblyOrder(fixture.name, assembly.meshes, cornerMeshes);
    }
  }
});

function assertClosedLoopAssemblyOrder(
  fixtureName: string,
  meshes: ReturnType<typeof createWallMeshAssembly>["meshes"],
  cornerMeshes: ReturnType<typeof createWallCornerMeshes>,
): void {
  const cornerMeshCounts = new Map<number, number>();

  for (const cornerMesh of cornerMeshes) {
    cornerMeshCounts.set(
      cornerMesh.cornerIndex,
      (cornerMeshCounts.get(cornerMesh.cornerIndex) ?? 0) + 1,
    );
  }

  let cursor = 0;

  for (let cornerIndex = 0; cornerIndex < cornerMeshCounts.size; cornerIndex += 1) {
    const expectedCornerCount = cornerMeshCounts.get(cornerIndex) ?? 0;

    for (let index = 0; index < expectedCornerCount; index += 1) {
      const mesh = meshes[cursor];

      assert.equal(
        mesh?.source,
        "softened-corner-path",
        `Expected ${fixtureName} to emit corner geometry before the stitched straight span for corner ${cornerIndex}.`,
      );
      assert.equal(
        mesh.cornerIndex,
        cornerIndex,
        `Expected ${fixtureName} corner meshes to stay grouped by their original corner index.`,
      );
      cursor += 1;
    }

    assert.equal(
      meshes[cursor]?.source,
      "softened-straight-segment",
      `Expected ${fixtureName} to insert a softened straight span after corner ${cornerIndex}.`,
    );
    cursor += 1;
  }

  assert.equal(
    cursor,
    meshes.length,
    `Expected ${fixtureName} assembly ordering assertions to account for every rendered wall mesh.`,
  );
}
