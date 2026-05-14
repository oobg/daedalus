import assert from "node:assert/strict";
import test from "node:test";

import { createWallJunctionAssembly } from "../src/features/viewer/wall-junction-assembly.ts";

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
});
