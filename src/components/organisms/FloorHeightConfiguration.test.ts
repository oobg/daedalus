import assert from "node:assert/strict";
import test from "node:test";
import {
  Fragment,
  createElement,
  default as React,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { createEditorStore } from "../../store/createEditorStore.ts";
import { findFloorHeightInput } from "./FloorHeightInput.tsx";
import {
  FloorHeightConfiguration,
} from "./FloorHeightConfiguration.tsx";
import { collectFloorSelectionButtons } from "./FloorSelection.tsx";

const floors = [
  { floorId: "floor-1", floorName: "Ground", floorHeight: 3 },
  { floorId: "floor-2", floorName: "Mezzanine", floorHeight: 4.5 },
  { floorId: "floor-3", floorName: "Roof", floorHeight: 2.5 },
] as const;

test("FloorHeightConfiguration renders the active floor selector and height editor together", () => {
  const tree = resolveCompositeElements(
    FloorHeightConfiguration({
      floors,
      activeFloorId: "floor-2",
      floorHeightInput: "4.5",
      onSelectFloor: () => undefined,
      onFloorHeightInputChange: () => undefined,
      onFloorHeightChange: () => undefined,
    }),
  );
  const markup = renderToStaticMarkup(
    React.createElement(FloorHeightConfiguration, {
      floors,
      activeFloorId: "floor-2",
      floorHeightInput: "4.5",
      onSelectFloor: () => undefined,
      onFloorHeightInputChange: () => undefined,
      onFloorHeightChange: () => undefined,
    }),
  );

  assert.match(markup, /aria-label="Available floors"/);
  assert.match(markup, /현재 선택/);
  assert.match(markup, /Mezzanine/);
  assert.match(markup, /층 높이/);
  assert.match(markup, /value="4\.5"/);
  assert.equal(collectFloorSelectionButtons(tree).length, 3);
  assert.ok(findFloorHeightInput(tree));
});

test("FloorHeightConfiguration dispatches floor selection and active-floor height edits", () => {
  const selections: string[] = [];
  const edits: Array<{ floorId: string; floorHeight: number }> = [];
  const tree = resolveCompositeElements(
    FloorHeightConfiguration({
      floors,
      activeFloorId: "floor-2",
      floorHeightInput: "4.5",
      onSelectFloor: (floorId) => {
        selections.push(floorId);
      },
      onFloorHeightInputChange: () => undefined,
      onFloorHeightChange: (input) => {
        edits.push(input);
      },
    }),
  );

  const floorButtons = collectFloorSelectionButtons(tree);
  const roofButton = floorButtons.find(
    (button) => button.props["data-floor-id"] === "floor-3",
  );
  const heightInput = findFloorHeightInput(tree);

  assert.ok(roofButton);
  assert.ok(heightInput);

  roofButton.props.onClick();
  heightInput.props.onChange({
    target: {
      value: "5.25",
    },
  } as React.ChangeEvent<HTMLInputElement>);

  assert.deepEqual(selections, ["floor-3"]);
  assert.deepEqual(edits, [{ floorId: "floor-2", floorHeight: 5.25 }]);
});

test("FloorHeightConfiguration applies a typed height change to the selected floor only", () => {
  const store = createEditorStore({ storage: null });
  const initialFloorId = store.getState().project.viewState.activeFloorId;

  assert.ok(initialFloorId);

  store.getState().updateFloor(initialFloorId, {
    floorName: "Ground",
    floorHeight: 3,
  });
  store.getState().addFloor();

  const addedFloorId =
    store
      .getState()
      .project.floors.find((floor) => floor.floorId !== initialFloorId)?.floorId ?? null;

  assert.ok(addedFloorId);

  store.getState().updateFloor(addedFloorId, {
    floorName: "Mezzanine",
    floorHeight: 4.5,
  });

  const tree = resolveCompositeElements(
    FloorHeightConfiguration({
      floors: store.getState().project.floors,
      activeFloorId: store.getState().project.viewState.activeFloorId,
      floorHeightInput: "3",
      onSelectFloor: (floorId) => {
        store.getState().setActiveFloor(floorId);
      },
      onFloorHeightInputChange: () => undefined,
      onFloorHeightChange: ({ floorHeight }) => {
        store.getState().updateActiveFloorHeight(floorHeight);
      },
    }),
  );

  const floorButtons = collectFloorSelectionButtons(tree);
  const mezzanineButton = floorButtons.find(
    (button) => button.props["data-floor-id"] === addedFloorId,
  );
  const heightInput = findFloorHeightInput(tree);

  assert.ok(mezzanineButton);
  assert.ok(heightInput);

  mezzanineButton.props.onClick();
  heightInput.props.onChange({
    target: {
      value: "5.25",
    },
  } as React.ChangeEvent<HTMLInputElement>);

  const updatedProject = store.getState().project;

  assert.equal(updatedProject.viewState.activeFloorId, addedFloorId);
  assert.deepEqual(
    updatedProject.floors.map((floor) => ({
      floorId: floor.floorId,
      floorHeight: floor.floorHeight,
    })),
    [
      { floorId: initialFloorId, floorHeight: 3 },
      { floorId: addedFloorId, floorHeight: 5.25 },
    ],
  );
});

test("FloorHeightConfiguration forwards blur resets for the active floor only", () => {
  const blurFloorIds: string[] = [];
  const tree = resolveCompositeElements(
    FloorHeightConfiguration({
      floors,
      activeFloorId: "floor-1",
      floorHeightInput: "3",
      onSelectFloor: () => undefined,
      onFloorHeightInputChange: () => undefined,
      onFloorHeightChange: () => undefined,
      onFloorHeightInputBlur: (floorId) => {
        blurFloorIds.push(floorId);
      },
    }),
  );

  const input = findFloorHeightInput(tree);

  assert.ok(input);

  input.props.onBlur?.();

  assert.deepEqual(blurFloorIds, ["floor-1"]);
});

test("FloorHeightConfiguration omits the height editor when no active floor is selected", () => {
  const tree = resolveCompositeElements(
    FloorHeightConfiguration({
      floors,
      activeFloorId: null,
      floorHeightInput: "",
      onSelectFloor: () => undefined,
      onFloorHeightInputChange: () => undefined,
      onFloorHeightChange: () => undefined,
    }),
  );

  assert.equal(findFloorHeightInput(tree), null);
  assert.equal(collectFloorSelectionButtons(tree).length, 3);
});

function resolveCompositeElements(node: ReactNode): ReactNode {
  if (Array.isArray(node)) {
    return node.map(resolveCompositeElements);
  }

  if (!isValidElement(node)) {
    return node;
  }

  if (node.type === Fragment) {
    return createElement(
      Fragment,
      null,
      resolveCompositeElements((node.props as { children?: ReactNode }).children),
    );
  }

  if (typeof node.type === "function") {
    return resolveCompositeElements(
      (node.type as (props: object) => ReactNode)(node.props as object),
    );
  }

  const props = node.props as { children?: ReactNode };

  return createElement(
    node.type,
    {
      ...(node.props as object),
    },
    props.children === undefined ? undefined : resolveCompositeElements(props.children),
  ) as ReactElement;
}
