import assert from "node:assert/strict";
import test from "node:test";

import {
  FLOOR_HEIGHT_VALIDATION_MESSAGE,
  validateFloorHeightValue,
} from "../src/domain/floor-height.ts";

test("validateFloorHeightValue accepts a single positive finite floor height", () => {
  assert.deepEqual(validateFloorHeightValue(3), {
    ok: true,
    value: 3,
  });
  assert.deepEqual(validateFloorHeightValue(" 4.25 "), {
    ok: true,
    value: 4.25,
  });
  assert.deepEqual(validateFloorHeightValue("0.5"), {
    ok: true,
    value: 0.5,
  });
});

test("validateFloorHeightValue rejects empty, malformed, and non-positive floor heights", () => {
  const invalidInputs = [
    "",
    " ",
    "height",
    "3m",
    "0",
    "-1",
    Number.NaN,
    Number.POSITIVE_INFINITY,
  ];

  for (const input of invalidInputs) {
    assert.deepEqual(validateFloorHeightValue(input), {
      ok: false,
      error: {
        code: "invalid_floor_height",
        message: FLOOR_HEIGHT_VALIDATION_MESSAGE,
      },
    });
  }
});
