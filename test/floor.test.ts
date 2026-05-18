import test from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_FLOOR_HEIGHT,
  assignFloorReferenceImage,
  createFloor,
  deserializeFloor,
  getFloorVerticalOffset,
  parseFloorHeightInput,
  normalizeFloor,
  resolveFloorBaseElevations,
  resolveFloorVerticalPlacements,
  serializeFloor,
  updateFloorHeight,
} from "../src/domain/floor.ts";

test("createFloor applies the default height when omitted", () => {
  const floor = createFloor({
    id: "floor-1",
    name: "Ground Floor",
  });

  assert.equal(floor.height, DEFAULT_FLOOR_HEIGHT);
  assert.equal(floor.referenceImage, null);
});

test("createFloor applies the default height when undefined", () => {
  const floor = createFloor({
    id: "floor-2",
    name: "Second Floor",
    height: undefined,
  });

  assert.equal(floor.height, DEFAULT_FLOOR_HEIGHT);
});

test("createFloor preserves an explicit height", () => {
  const floor = createFloor({
    id: "floor-3",
    name: "Third Floor",
    height: 4.2,
    referenceImage: "floor-plan://project-alpha/floor-3/source.png",
  });

  assert.equal(floor.height, 4.2);
  assert.equal(
    floor.referenceImage,
    "floor-plan://project-alpha/floor-3/source.png",
  );
});

test("createFloor supports multiple floor objects with different height values", () => {
  const floors = [
    createFloor({
      id: "floor-ground",
      name: "Ground Floor",
      height: 3.2,
    }),
    createFloor({
      id: "floor-second",
      name: "Second Floor",
      height: 4.6,
    }),
    createFloor({
      id: "floor-third",
      name: "Third Floor",
      height: 2.9,
    }),
  ];

  assert.deepEqual(
    floors.map((floor) => ({
      id: floor.id,
      height: floor.height,
    })),
    [
      { id: "floor-ground", height: 3.2 },
      { id: "floor-second", height: 4.6 },
      { id: "floor-third", height: 2.9 },
    ],
  );
});

test("createFloor rejects non-positive or non-finite heights", () => {
  const invalidHeights = [0, -1, Number.NaN, Number.POSITIVE_INFINITY];

  for (const height of invalidHeights) {
    assert.throws(
      () =>
        createFloor({
          id: `floor-${String(height)}`,
          name: "Invalid Floor",
          height,
        }),
      /Floor height must be (greater than 0|a finite number)\./,
    );
  }
});

test("normalizeFloor remains an alias of createFloor for existing callers", () => {
  const input = {
    id: "floor-compat",
    name: "Compatibility Floor",
    height: 3.8,
    referenceImage: "floor-plan://project-alpha/floor-compat/source.png",
  } as const;

  assert.deepEqual(normalizeFloor(input), createFloor(input));
});

test("deserializeFloor then serializeFloor preserves height without loss", () => {
  const serializedFloor = {
    id: "floor-4",
    name: "Fourth Floor",
    height: 5.75,
    referenceImage: "floor-plan://project-alpha/floor-4/source.webp",
  };

  const roundTrippedFloor = serializeFloor(deserializeFloor(serializedFloor));

  assert.deepEqual(roundTrippedFloor, serializedFloor);
});

test("serializeFloor and deserializeFloor preserve height through JSON save and load", () => {
  const floor = createFloor({
    id: "floor-5",
    name: "Fifth Floor",
    height: 6.25,
    referenceImage: null,
  });

  const savedRecord = JSON.stringify(serializeFloor(floor));
  const loadedRecord = JSON.parse(savedRecord) as {
    id: string;
    name: string;
    height: number;
    referenceImage: string | null;
  };

  assert.equal(loadedRecord.height, 6.25);
  assert.deepEqual(deserializeFloor(loadedRecord), floor);
});

test("updateFloorHeight updates only the targeted floor", () => {
  const floors = [
    normalizeFloor({
      id: "floor-1",
      name: "Ground Floor",
      height: 3,
      referenceImage: "floor-plan://project-alpha/floor-1/ground.png",
    }),
    normalizeFloor({
      id: "floor-2",
      name: "Second Floor",
      height: 4,
      referenceImage: "floor-plan://project-alpha/floor-2/second.png",
    }),
  ];

  const result = updateFloorHeight(floors, "floor-1", "5.5");

  assert.equal(result.ok, true);

  if (!result.ok) {
    assert.fail("Expected the floor height update to succeed.");
  }

  assert.equal(result.floor.height, 5.5);
  assert.equal(result.floors[0].height, 5.5);
  assert.equal(result.floors[1].height, 4);
  assert.equal(
    result.floors[0].referenceImage,
    "floor-plan://project-alpha/floor-1/ground.png",
  );
  assert.equal(
    result.floors[1].referenceImage,
    "floor-plan://project-alpha/floor-2/second.png",
  );
  assert.notEqual(result.floors[0], floors[0]);
  assert.equal(result.floors[1], floors[1]);
});

test("assignFloorReferenceImage updates only the targeted floor assignment", () => {
  const floors = [
    normalizeFloor({
      id: "floor-1",
      name: "Ground Floor",
      referenceImage: "floor-plan://project-alpha/floor-1/original.png",
    }),
    normalizeFloor({
      id: "floor-2",
      name: "Second Floor",
      referenceImage: "floor-plan://project-alpha/floor-2/existing.png",
    }),
    normalizeFloor({
      id: "floor-3",
      name: "Third Floor",
      referenceImage: null,
    }),
  ];

  const result = assignFloorReferenceImage(floors, {
    floorId: "floor-1",
    referenceImage: "floor-plan://project-alpha/floor-1/replacement.png",
  });

  assert.equal(
    result.floor.referenceImage,
    "floor-plan://project-alpha/floor-1/replacement.png",
  );
  assert.equal(
    result.floors[0].referenceImage,
    "floor-plan://project-alpha/floor-1/replacement.png",
  );
  assert.equal(
    result.floors[1].referenceImage,
    "floor-plan://project-alpha/floor-2/existing.png",
  );
  assert.equal(result.floors[2].referenceImage, null);
  assert.notEqual(result.floors[0], floors[0]);
  assert.equal(result.floors[1], floors[1]);
  assert.equal(result.floors[2], floors[2]);
});

test("assignFloorReferenceImage can clear a floor reference image without touching others", () => {
  const floors = [
    normalizeFloor({
      id: "floor-1",
      name: "Ground Floor",
      referenceImage: "floor-plan://project-alpha/floor-1/ground.png",
    }),
    normalizeFloor({
      id: "floor-2",
      name: "Second Floor",
      referenceImage: "floor-plan://project-alpha/floor-2/second.png",
    }),
  ];

  const result = assignFloorReferenceImage(floors, {
    floorId: "floor-2",
    referenceImage: null,
  });

  assert.equal(result.floors[0].referenceImage, floors[0].referenceImage);
  assert.equal(result.floors[1].referenceImage, null);
  assert.equal(result.floors[0], floors[0]);
  assert.notEqual(result.floors[1], floors[1]);
});

test("getFloorVerticalOffset derives per-floor offsets from stored heights", () => {
  const floors = [
    normalizeFloor({
      id: "floor-1",
      name: "Ground Floor",
      height: 3.25,
    }),
    normalizeFloor({
      id: "floor-2",
      name: "Second Floor",
      height: 4.5,
    }),
    normalizeFloor({
      id: "floor-3",
      name: "Third Floor",
      height: 2.75,
    }),
  ];

  assert.equal(getFloorVerticalOffset(floors, "floor-1"), 0);
  assert.equal(getFloorVerticalOffset(floors, "floor-2"), 3.25);
  assert.equal(getFloorVerticalOffset(floors, "floor-3"), 7.75);
});

test("resolveFloorBaseElevations derives each floor base elevation from the ordered configured heights", () => {
  const floors = [
    normalizeFloor({
      id: "floor-lobby",
      name: "Lobby",
      height: 4.1,
    }),
    normalizeFloor({
      id: "floor-office",
      name: "Office",
      height: 3.35,
    }),
    normalizeFloor({
      id: "floor-mezzanine",
      name: "Mezzanine",
      height: 2.2,
    }),
    normalizeFloor({
      id: "floor-roof",
      name: "Roof Access",
      height: 3.9,
    }),
  ];

  assert.deepEqual(resolveFloorBaseElevations(floors), [
    {
      floorId: "floor-lobby",
      baseElevation: 0,
    },
    {
      floorId: "floor-office",
      baseElevation: 4.1,
    },
    {
      floorId: "floor-mezzanine",
      baseElevation: 7.45,
    },
    {
      floorId: "floor-roof",
      baseElevation: 9.65,
    },
  ]);
});

test("resolveFloorVerticalPlacements returns cumulative offsets for viewer and export", () => {
  const floors = [
    normalizeFloor({
      id: "floor-1",
      name: "Ground Floor",
      height: 2.5,
    }),
    normalizeFloor({
      id: "floor-2",
      name: "Second Floor",
      height: 3.75,
    }),
    normalizeFloor({
      id: "floor-3",
      name: "Third Floor",
      height: 4.25,
    }),
  ];

  assert.deepEqual(resolveFloorVerticalPlacements(floors), [
    {
      floorId: "floor-1",
      offset: 0,
      height: 2.5,
    },
    {
      floorId: "floor-2",
      offset: 2.5,
      height: 3.75,
    },
    {
      floorId: "floor-3",
      offset: 6.25,
      height: 4.25,
    },
  ]);
});

test("parseFloorHeightInput rejects invalid height values", () => {
  const invalidInputs = [
    {
      input: "",
      error: {
        code: "empty_floor_height",
        message: "Floor height is required.",
      },
    },
    {
      input: "abc",
      error: {
        code: "malformed_floor_height",
        message: "Floor height must be numeric.",
      },
    },
    {
      input: "3m",
      error: {
        code: "malformed_floor_height",
        message: "Floor height must be numeric.",
      },
    },
    {
      input: "0",
      error: {
        code: "non_positive_floor_height",
        message: "Floor height must be greater than 0.",
      },
    },
    {
      input: -2,
      error: {
        code: "non_positive_floor_height",
        message: "Floor height must be greater than 0.",
      },
    },
    {
      input: Number.NaN,
      error: {
        code: "non_finite_floor_height",
        message: "Floor height must be a finite number.",
      },
    },
    {
      input: Number.POSITIVE_INFINITY,
      error: {
        code: "non_finite_floor_height",
        message: "Floor height must be a finite number.",
      },
    },
  ];

  for (const { input, error } of invalidInputs) {
    const result = parseFloorHeightInput(input);

    assert.deepEqual(result, error);
  }
});

test("updateFloorHeight returns a validation error for invalid height input", () => {
  const floors = [
    normalizeFloor({
      id: "floor-1",
      name: "Ground Floor",
      height: 3,
    }),
    normalizeFloor({
      id: "floor-2",
      name: "Second Floor",
      height: 4,
    }),
  ];

  const result = updateFloorHeight(floors, "floor-1", "0");

  assert.deepEqual(result, {
    ok: false,
    error: {
      code: "non_positive_floor_height",
      message: "Floor height must be greater than 0.",
    },
  });
  assert.equal(floors[0].height, 3);
  assert.equal(floors[1].height, 4);
});
