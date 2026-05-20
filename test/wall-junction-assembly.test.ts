import assert from "node:assert/strict";
import test from "node:test";

import {
  createInsetPolygon,
  inspectWallTopology,
} from "../src/components/viewer/viewer25dGeometry.ts";
import {
  createWallBandRing,
  createWallJunctionAssembly,
  validateWallBandTopology,
} from "../src/features/viewer/wall-junction-assembly.ts";

test("createWallJunctionAssembly stitches softened corners and straight wall runs into one continuous closed loop", () => {
  const assembly = createWallJunctionAssembly(
    [
      { x: 0, y: 0 },
      { x: 4.8, y: 0 },
      { x: 4.8, y: 1.4 },
      { x: 2.6, y: 1.4 },
      { x: 2.6, y: 3.6 },
      { x: 0, y: 3.6 },
    ],
    {
      baseOffset: 0.014,
      curveSegments: 6,
      height: 0.9,
      minimumWallCornerRadius: 0.18,
      thickness: 0.045,
      topEdgeRadius: 0.011,
      wallCornerRadiusRatio: 3.5,
      wallCornerSegments: 3,
      wallCornerStyle: "rounded",
    },
  );

  assert.equal(assembly.isClosedLoop, true);
  assert.equal(assembly.straightSectionCount, 6);
  assert.ok(
    assembly.cornerSectionCount > 0,
    "Expected softened corners to contribute explicit corner junction sections.",
  );
  assert.equal(
    assembly.sections.length,
    assembly.straightSectionCount + assembly.cornerSectionCount,
  );

  for (const [index, section] of assembly.sections.entries()) {
    assert.ok(section.length > 0.001, "Expected every junction section to carry real span length.");
    assert.notDeepEqual(
      section.start,
      section.end,
      "Expected every junction section to cover distinct endpoints.",
    );

    const nextSection = assembly.sections[(index + 1) % assembly.sections.length];

    assert.deepEqual(
      section.end,
      nextSection.start,
      `Expected section ${index} to share its terminal endpoint with the following section.`,
    );

    assert.notDeepEqual(
      section.start,
      nextSection.end,
      `Expected adjacent sections ${index} and ${(index + 1) % assembly.sections.length} not to overlap as mirrored duplicates.`,
    );

    if (section.kind === "corner") {
      assert.ok(
        section.cornerPathPointCount > 2,
        "Expected corner sections to come from a softened multi-point corner path.",
      );
    }
  }

  const firstSection = assembly.sections[0];
  const lastSection = assembly.sections[assembly.sections.length - 1];

  assert.deepEqual(
    lastSection.end,
    firstSection.start,
    "Expected the assembled wall junction loop to close cleanly at the final shared endpoint.",
  );

  assert.ok(assembly.wallBand, "Expected a stitched wall band for closed wall polygons.");
  assert.deepEqual(
    assembly.wallBand.outerOutline,
    [
      { x: 0, y: 0 },
      { x: 4.8, y: 0 },
      { x: 4.8, y: 1.4 },
      { x: 2.6, y: 1.4 },
      { x: 2.6, y: 3.6 },
      { x: 0, y: 3.6 },
    ],
    "Expected the wall band to preserve the original outer outline exactly.",
  );
  assert.equal(
    assembly.wallBand.stitchedLoop.length,
    assembly.wallBand.outerOutline.length + assembly.wallBand.innerContour.length,
  );
  assert.deepEqual(
    assembly.wallBand.stitchedLoop.slice(0, assembly.wallBand.outerOutline.length),
    assembly.wallBand.outerOutline,
    "Expected the stitched band loop to begin with the untouched outer outline.",
  );
  assert.deepEqual(
    assembly.wallBand.stitchedLoop.slice(assembly.wallBand.outerOutline.length),
    [...assembly.wallBand.innerContour].reverse(),
    "Expected the stitched band loop to return along the inward contour without branching.",
  );

  const bandTopology = inspectWallTopology(assembly.wallBand.stitchedLoop);

  assert.equal(bandTopology.isContinuous, true);
  assert.equal(bandTopology.isSelfIntersecting, false);
});

test("createWallJunctionAssembly normalizes an explicitly closed quadrilateral before stitching the inward wall band", () => {
  const assembly = createWallJunctionAssembly(
    [
      { x: 0, y: 0 },
      { x: 4.2, y: 0 },
      { x: 4.2, y: 3.1 },
      { x: 0, y: 3.1 },
      { x: 0, y: 0 },
    ],
    {
      baseOffset: 0.014,
      curveSegments: 6,
      height: 0.9,
      minimumWallCornerRadius: 0.28,
      thickness: 0.045,
      topEdgeRadius: 0.011,
      wallCornerRadiusRatio: 4.5,
      wallCornerSegments: 4,
      wallCornerStyle: "rounded",
    },
  );

  assert.equal(assembly.isClosedLoop, true);
  assert.equal(assembly.straightSectionCount, 4);
  assert.ok(assembly.wallBand, "Expected a stitched wall band for an explicitly closed quadrilateral.");
  assert.deepEqual(assembly.wallBand.outerOutline, [
    { x: 0, y: 0 },
    { x: 4.2, y: 0 },
    { x: 4.2, y: 3.1 },
    { x: 0, y: 3.1 },
  ]);

  const bandTopology = inspectWallTopology(assembly.wallBand.stitchedLoop);

  assert.equal(bandTopology.isContinuous, true);
  assert.equal(bandTopology.isSelfIntersecting, false);

  for (const [index, section] of assembly.sections.entries()) {
    const nextSection = assembly.sections[(index + 1) % assembly.sections.length];

    assert.deepEqual(
      section.end,
      nextSection.start,
      `Expected explicitly closed quadrilateral section ${index} to stitch directly into the following section.`,
    );
  }
});

test("createWallJunctionAssembly preserves every valid closed-polygon outer vertex in input order even when one edge is very short", () => {
  const assembly = createWallJunctionAssembly(
    [
      { x: 0, y: 0 },
      { x: 4.2, y: 0 },
      { x: 4.2, y: 0.0006 },
      { x: 4.2, y: 3.1 },
      { x: 0, y: 3.1 },
      { x: 0, y: 0 },
    ],
    {
      baseOffset: 0.014,
      curveSegments: 6,
      height: 0.9,
      minimumWallCornerRadius: 0.28,
      thickness: 0.045,
      topEdgeRadius: 0.011,
      wallCornerRadiusRatio: 4.5,
      wallCornerSegments: 4,
      wallCornerStyle: "rounded",
    },
  );

  assert.ok(assembly.wallBand, "Expected a stitched wall band for a valid closed polygon.");
  assert.deepEqual(assembly.wallBand.outerOutline, [
    { x: 0, y: 0 },
    { x: 4.2, y: 0 },
    { x: 4.2, y: 0.0006 },
    { x: 4.2, y: 3.1 },
    { x: 0, y: 3.1 },
  ]);
  assert.deepEqual(
    assembly.wallBand.stitchedLoop.slice(0, assembly.wallBand.outerOutline.length),
    assembly.wallBand.outerOutline,
    "Expected the stitched wall band to start with the untouched outer boundary in the original edge order.",
  );
});

test("createWallJunctionAssembly preserves quadrilateral outer-contour vertex order and edge directions exactly", () => {
  const inputOutline = [
    { x: 1.25, y: 0.5 },
    { x: 6.75, y: 1.1 },
    { x: 5.9, y: 4.85 },
    { x: 0.8, y: 4.2 },
    { x: 1.25, y: 0.5 },
  ] as const;
  const expectedOuterOutline = inputOutline.slice(0, -1);
  const assembly = createWallJunctionAssembly(inputOutline, {
    baseOffset: 0.014,
    curveSegments: 6,
    height: 0.9,
    minimumWallCornerRadius: 0.2,
    thickness: 0.045,
    topEdgeRadius: 0.011,
    wallCornerRadiusRatio: 3.5,
    wallCornerSegments: 3,
    wallCornerStyle: "rounded",
  });

  assert.ok(assembly.wallBand, "Expected a stitched wall band for a closed quadrilateral.");
  assert.deepEqual(
    assembly.wallBand.outerOutline,
    expectedOuterOutline,
    "Expected the quadrilateral outer contour to match the drawn outline exactly after closure normalization.",
  );

  const preservedOuterOutline = assembly.wallBand.outerOutline;

  assert.equal(preservedOuterOutline.length, 4);

  for (const [index, point] of preservedOuterOutline.entries()) {
    const inputPoint = expectedOuterOutline[index];
    const nextPoint: (typeof preservedOuterOutline)[number] = preservedOuterOutline[(index + 1) % preservedOuterOutline.length];
    const nextInputPoint = expectedOuterOutline[(index + 1) % expectedOuterOutline.length];

    assert.deepEqual(
      point,
      inputPoint,
      `Expected preserved quadrilateral vertex ${index} to remain in the original input slot.`,
    );
    assert.deepEqual(
      { x: nextPoint.x - point.x, y: nextPoint.y - point.y },
      { x: nextInputPoint.x - inputPoint.x, y: nextInputPoint.y - inputPoint.y },
      `Expected preserved quadrilateral edge ${index} to keep the original direction and span.`,
    );
  }
});

test("validateWallBandTopology rejects a quadrilateral wall band when the stitched loop crosses itself", () => {
  const validation = validateWallBandTopology({
    stitchedLoop: [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 4, y: 4 },
      { x: 0, y: 4 },
      { x: 1, y: 1 },
      { x: 3, y: 3 },
      { x: 1, y: 3 },
      { x: 3, y: 1 },
    ],
  });

  assert.equal(validation.isContinuous, true);
  assert.equal(validation.isSelfIntersecting, true);
  assert.equal(validation.isRejected, true);
});

test("validateWallBandTopology rejects a closed-polygon wall band when the stitched loop forms cross-shaped topology", () => {
  const validation = validateWallBandTopology({
    stitchedLoop: [
      { x: 0, y: 0 },
      { x: 5, y: 0 },
      { x: 5, y: 1.5 },
      { x: 3, y: 1.5 },
      { x: 3, y: 4 },
      { x: 0, y: 4 },
      { x: 0.8, y: 0.8 },
      { x: 2.4, y: 2.8 },
      { x: 1, y: 3 },
      { x: 2.4, y: 1.2 },
      { x: 4, y: 1.2 },
      { x: 4, y: 0.8 },
    ],
  });

  assert.equal(validation.isContinuous, true);
  assert.equal(validation.isSelfIntersecting, true);
  assert.equal(validation.isRejected, true);
});

test("createWallBandRing realigns a rotated inner contour into one closed non-self-intersecting wall band", () => {
  const outerOutline = [
    { x: 0, y: 0 },
    { x: 5, y: 0 },
    { x: 5, y: 4 },
    { x: 3, y: 4 },
    { x: 3, y: 1 },
    { x: 2, y: 1 },
    { x: 2, y: 4 },
    { x: 0, y: 4 },
  ];
  const innerContour = createInsetPolygon(outerOutline, 0.45);
  const rotatedInnerContour = [
    ...innerContour.slice(2),
    ...innerContour.slice(0, 2),
  ];

  assert.equal(
    validateWallBandTopology({
      outerOutline,
      innerContour: rotatedInnerContour,
      stitchedLoop: [...outerOutline, ...[...rotatedInnerContour].reverse()],
    }).isRejected,
    true,
    "Expected the naive rotated stitch order to recreate the forbidden cross-shaped wall band.",
  );

  const wallBand = createWallBandRing(outerOutline, rotatedInnerContour);

  assert.ok(
    wallBand,
    "Expected the ring assembly to recover a valid closed wall band from a rotated inward contour.",
  );
  assert.deepEqual(
    wallBand.outerOutline,
    outerOutline,
    "Expected the wall band assembly to preserve the original outer outline exactly.",
  );
  assert.equal(
    wallBand.stitchedLoop.length,
    wallBand.outerOutline.length + wallBand.innerContour.length,
  );

  const topology = inspectWallTopology(wallBand.stitchedLoop);

  assert.equal(topology.isContinuous, true);
  assert.equal(topology.isSelfIntersecting, false);
  assert.equal(validateWallBandTopology(wallBand).isRejected, false);
});

test("validateWallBandTopology confirms convex wall-band geometry for a supported convex quadrilateral input", () => {
  const outerOutline = [
    { x: 0, y: 0 },
    { x: 5, y: 1 },
    { x: 4, y: 4 },
    { x: -1, y: 3 },
  ];
  const innerContour = createInsetPolygon(outerOutline, 0.3);
  const wallBand = createWallBandRing(outerOutline, innerContour);

  assert.ok(wallBand, "Expected a valid wall band for a convex quadrilateral input.");

  const validation = validateWallBandTopology(wallBand);

  assert.equal(validation.isContinuous, true);
  assert.equal(validation.isSelfIntersecting, false);
  assert.equal(validation.isConvex, true);
  assert.equal(validation.isRejected, false);
});
