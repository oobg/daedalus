import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import {
  FloorSelection,
  collectFloorSelectionButtons,
} from "./FloorSelection.tsx";

const floors = [
  { floorId: "floor-1", floorName: "Ground", floorHeight: 3 },
  { floorId: "floor-2", floorName: "Mezzanine", floorHeight: 4.5 },
  { floorId: "floor-3", floorName: "Roof", floorHeight: 2.5 },
] as const;

test("FloorSelection renders every floor option and exposes the current selection", () => {
  const tree = FloorSelection({
    floors,
    activeFloorId: "floor-2",
    onSelectFloor: () => undefined,
  });
  const markup = renderToStaticMarkup(
    React.createElement(FloorSelection, {
      floors,
      activeFloorId: "floor-2",
      onSelectFloor: () => undefined,
    }),
  );

  assert.match(markup, /현재 선택/);
  assert.match(markup, /Mezzanine/);
  assert.match(markup, /aria-label="Available floors"/);
  assert.match(markup, /aria-pressed="true"/);
  assert.match(markup, /4\.5m/);
  assert.deepEqual(
    collectFloorSelectionButtons(tree).map((button) => button.props["data-floor-id"]),
    ["floor-3", "floor-2", "floor-1"],
  );
});

test("FloorSelection dispatches the selected floor id when an option is activated", () => {
  const selections: string[] = [];
  const tree = FloorSelection({
    floors,
    activeFloorId: "floor-1",
    onSelectFloor: (floorId) => {
      selections.push(floorId);
    },
  });

  const buttons = collectFloorSelectionButtons(tree);
  const mezzanineButton = buttons.find(
    (button) => button.props["data-floor-id"] === "floor-2",
  );

  assert.equal(buttons.length, 3);
  assert.ok(mezzanineButton);

  mezzanineButton.props.onClick();

  assert.deepEqual(selections, ["floor-2"]);
});
