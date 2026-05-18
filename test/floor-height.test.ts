import assert from "node:assert/strict";
import test from "node:test";

import {
  EMPTY_FLOOR_HEIGHT_MESSAGE,
  MALFORMED_FLOOR_HEIGHT_MESSAGE,
  NON_FINITE_FLOOR_HEIGHT_MESSAGE,
  NON_POSITIVE_FLOOR_HEIGHT_MESSAGE,
  validateFloorHeightValue,
} from "../src/domain/floor-height.ts";

test("validateFloorHeightValue accepts boundary and typical positive finite floor heights", () => {
  assert.deepEqual(validateFloorHeightValue(3), {
    ok: true,
    value: 3,
  });
  assert.deepEqual(validateFloorHeightValue(Number.MIN_VALUE), {
    ok: true,
    value: Number.MIN_VALUE,
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

test("validateFloorHeightValue returns defined validation errors for invalid floor heights", () => {
  const invalidCases = [
    {
      input: "",
      error: {
        code: "empty_floor_height",
        message: EMPTY_FLOOR_HEIGHT_MESSAGE,
      },
    },
    {
      input: " ",
      error: {
        code: "empty_floor_height",
        message: EMPTY_FLOOR_HEIGHT_MESSAGE,
      },
    },
    {
      input: "height",
      error: {
        code: "malformed_floor_height",
        message: MALFORMED_FLOOR_HEIGHT_MESSAGE,
      },
    },
    {
      input: "3m",
      error: {
        code: "malformed_floor_height",
        message: MALFORMED_FLOOR_HEIGHT_MESSAGE,
      },
    },
    {
      input: "0",
      error: {
        code: "non_positive_floor_height",
        message: NON_POSITIVE_FLOOR_HEIGHT_MESSAGE,
      },
    },
    {
      input: "-1",
      error: {
        code: "non_positive_floor_height",
        message: NON_POSITIVE_FLOOR_HEIGHT_MESSAGE,
      },
    },
    {
      input: Number.NaN,
      error: {
        code: "non_finite_floor_height",
        message: NON_FINITE_FLOOR_HEIGHT_MESSAGE,
      },
    },
    {
      input: Number.POSITIVE_INFINITY,
      error: {
        code: "non_finite_floor_height",
        message: NON_FINITE_FLOOR_HEIGHT_MESSAGE,
      },
    },
    {
      input: Number.NEGATIVE_INFINITY,
      error: {
        code: "non_finite_floor_height",
        message: NON_FINITE_FLOOR_HEIGHT_MESSAGE,
      },
    },
    {
      input: 0,
      error: {
        code: "non_positive_floor_height",
        message: NON_POSITIVE_FLOOR_HEIGHT_MESSAGE,
      },
    },
    {
      input: -0.01,
      error: {
        code: "non_positive_floor_height",
        message: NON_POSITIVE_FLOOR_HEIGHT_MESSAGE,
      },
    },
  ];

  for (const { input, error } of invalidCases) {
    assert.deepEqual(validateFloorHeightValue(input), {
      ok: false,
      error,
    });
  }
});
