import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import {
  findFloorHeightInput,
  FloorHeightInput,
} from "./FloorHeightInput.ts";

test("FloorHeightInput renders the selected floor height value", () => {
  const tree = FloorHeightInput({
    value: "4.5",
    onInputChange: () => undefined,
    onFloorHeightChange: () => undefined,
  });
  const markup = renderToStaticMarkup(
    React.createElement(FloorHeightInput, {
      value: "4.5",
      onInputChange: () => undefined,
      onFloorHeightChange: () => undefined,
    }),
  );

  const input = findFloorHeightInput(tree);

  assert.ok(input);
  assert.equal(input.props.value, "4.5");
  assert.match(markup, /높이 \(m\)/);
  assert.match(markup, /value="4\.5"/);
  assert.match(markup, /id="active-floor-height"/);
});

test("FloorHeightInput forwards raw input updates as the user types", () => {
  const updates: string[] = [];
  const dispatchedHeights: number[] = [];
  const tree = FloorHeightInput({
    value: "3",
    onInputChange: (value) => {
      updates.push(value);
    },
    onFloorHeightChange: (floorHeight) => {
      dispatchedHeights.push(floorHeight);
    },
  });

  const input = findFloorHeightInput(tree);

  assert.ok(input);

  input.props.onChange({
    target: {
      value: "5.25",
    },
  } as React.ChangeEvent<HTMLInputElement>);
  input.props.onChange({
    target: {
      value: "",
    },
  } as React.ChangeEvent<HTMLInputElement>);

  assert.deepEqual(updates, ["5.25", ""]);
  assert.deepEqual(dispatchedHeights, [5.25]);
});

test("FloorHeightInput dispatches validated floor-height changes only", () => {
  const dispatchedHeights: number[] = [];
  const tree = FloorHeightInput({
    value: "3",
    onInputChange: () => undefined,
    onFloorHeightChange: (floorHeight) => {
      dispatchedHeights.push(floorHeight);
    },
  });

  const input = findFloorHeightInput(tree);

  assert.ok(input);

  input.props.onChange({
    target: {
      value: "0",
    },
  } as React.ChangeEvent<HTMLInputElement>);
  input.props.onChange({
    target: {
      value: "6",
    },
  } as React.ChangeEvent<HTMLInputElement>);

  assert.deepEqual(dispatchedHeights, [6]);
});
