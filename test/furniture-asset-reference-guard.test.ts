import assert from "node:assert/strict";
import test from "node:test";

import {
  assertFurnitureAssetReference,
  validateFurnitureAssetReference,
} from "../src/features/viewer/furniture-asset-reference-guard.ts";

test("validateFurnitureAssetReference accepts a well-formed lowercase-hyphenated model asset reference", () => {
  const result = validateFurnitureAssetReference("sofa-compact-arched-oak-base");

  assert.equal(result.ok, true);
});

test("validateFurnitureAssetReference accepts references with mixed separators and casing via normalization", () => {
  for (const ref of ["Chair_Oak_Nordic", "DESK-WALNUT-FRAME", "storage unit pine"]) {
    const result = validateFurnitureAssetReference(ref);

    assert.equal(result.ok, true, `Expected "${ref}" to pass validation`);
  }
});

test("validateFurnitureAssetReference rejects an empty string", () => {
  const result = validateFurnitureAssetReference("");

  assert.equal(result.ok, false);

  if (!result.ok) {
    assert.deepEqual(result.issues, [
      {
        path: "modelAssetId",
        message:
          "Normalized handcrafted furniture descriptors require a non-empty model asset reference.",
      },
    ]);
  }
});

test("validateFurnitureAssetReference rejects a whitespace-only string", () => {
  const result = validateFurnitureAssetReference("   ");

  assert.equal(result.ok, false);

  if (!result.ok) {
    assert.equal(result.issues[0].message.includes("non-empty"), true);
  }
});

test("validateFurnitureAssetReference rejects non-string inputs", () => {
  for (const input of [null, undefined, 42, {}, []]) {
    const result = validateFurnitureAssetReference(input);

    assert.equal(result.ok, false, `Expected ${JSON.stringify(input)} to fail`);

    if (!result.ok) {
      assert.equal(result.issues[0].path, "modelAssetId");
      assert.equal(result.issues[0].message.includes("non-empty"), true);
    }
  }
});

test("validateFurnitureAssetReference uses a custom path label in the issue when provided", () => {
  const result = validateFurnitureAssetReference("", "descriptor.modelAssetId");

  assert.equal(result.ok, false);

  if (!result.ok) {
    assert.equal(result.issues[0].path, "descriptor.modelAssetId");
  }
});

test("validateFurnitureAssetReference rejects every disallowed realistic-scan and game-prop pattern", () => {
  const bannedCases = [
    { ref: "chair-game-prop-oak",       pattern: "game-prop" },
    { ref: "sofa-hero-prop-leather",    pattern: "hero-prop" },
    { ref: "desk-photoreal-birch",      pattern: "photoreal" },
    { ref: "storage-photorealistic-v2", pattern: "photorealistic" },
    { ref: "table-realistic-pine",      pattern: "realistic" },
    { ref: "cabinet-pbr-metal",         pattern: "pbr" },
    { ref: "bed-scan-oak",              pattern: "scan" },
    { ref: "chair-scanned-ash",         pattern: "scanned" },
    { ref: "sofa-megascans-lounge",     pattern: "megascans" },
    { ref: "desk-megascan-base",        pattern: "megascan" },
    { ref: "table-kitbash-parts",       pattern: "kitbash" },
    { ref: "storage-kitbashed-crate",   pattern: "kitbashed" },
  ];

  for (const { ref, pattern } of bannedCases) {
    const result = validateFurnitureAssetReference(ref);

    assert.equal(result.ok, false, `Expected "${ref}" (pattern: ${pattern}) to be rejected`);

    if (!result.ok) {
      assert.equal(result.issues[0].path, "modelAssetId");
      assert.equal(
        result.issues[0].message,
        `Normalized furniture descriptor rejected disallowed asset reference "${ref}". ` +
          "Realistic scans and game-prop assets are not approved for the miniature viewer.",
      );
    }
  }
});

test("validateFurnitureAssetReference rejects banned patterns regardless of casing and separators", () => {
  for (const ref of ["Chair_PBR_Oak", "SOFA-REALISTIC-SCAN", "desk.KITBASH.parts"]) {
    const result = validateFurnitureAssetReference(ref);

    assert.equal(result.ok, false, `Expected "${ref}" to be rejected after normalization`);
  }
});

test("assertFurnitureAssetReference returns the original reference string when it passes", () => {
  const ref = "bed-linen-oak-frame";
  const returned = assertFurnitureAssetReference(ref);

  assert.equal(returned, ref);
});

test("assertFurnitureAssetReference throws TypeError with the issue message for a banned reference", () => {
  assert.throws(() => assertFurnitureAssetReference("cabinet-hero-prop"), {
    name: "TypeError",
    message:
      'Normalized furniture descriptor rejected disallowed asset reference "cabinet-hero-prop". ' +
      "Realistic scans and game-prop assets are not approved for the miniature viewer.",
  });
});

test("assertFurnitureAssetReference throws TypeError for an empty reference", () => {
  assert.throws(() => assertFurnitureAssetReference(""), {
    name: "TypeError",
    message: "Normalized handcrafted furniture descriptors require a non-empty model asset reference.",
  });
});
