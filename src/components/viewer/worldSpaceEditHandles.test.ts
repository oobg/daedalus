import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { Html } from "@react-three/drei";

import {
  collectWorldSpaceHtmlHandleElements,
  createWorldSpaceEditHandleElements,
  isWorldSpaceHtmlEditHandleElement,
  WorldSpaceEditHandles,
  type WorldSpaceEditHandlesProps,
} from "./worldSpaceEditHandles.ts";

type HtmlHandleProps = {
  position: [number, number, number];
  center?: boolean;
  transform?: boolean;
  sprite?: boolean;
  children?: React.ReactElement;
};

type ButtonProps = Record<string, unknown>;

test("WorldSpaceEditHandles mounts each edit handle through drei Html at its world position", () => {
  const tree = React.createElement(WorldSpaceEditHandles, {
    handles: [
      {
        id: "room-a:vertex:0",
        label: "Vertex 0",
        worldPosition: { x: 1.25, y: 3.5, z: -2.75 },
      },
      {
        id: "room-a:vertex:1",
        label: "Vertex 1",
        worldPosition: { x: -4, y: 1.5, z: 6.25 },
      },
    ],
  });

  const htmlHandles = collectWorldSpaceHtmlHandleElements(WorldSpaceEditHandles(tree.props as WorldSpaceEditHandlesProps));

  assert.equal(htmlHandles.length, 2);
  assert.deepEqual(htmlHandles.map((handle) => (handle.props as HtmlHandleProps).position), [
    [1.25, 3.5, -2.75],
    [-4, 1.5, 6.25],
  ]);
  assert.deepEqual(
    htmlHandles.map((handle) => {
      const p = handle.props as HtmlHandleProps;
      return { center: p.center, transform: p.transform, sprite: p.sprite };
    }),
    [
      { center: true, transform: true, sprite: true },
      { center: true, transform: true, sprite: true },
    ],
  );
});

test("createWorldSpaceEditHandleElements exposes 3D coordinates on handle elements without any 2D canvas projection props", () => {
  const sourceHandle = {
    id: "room-b:edge:0",
    label: "Insert vertex",
    worldPosition: { x: 8.5, y: 0.125, z: 2.25 },
  } as const;
  const [htmlHandle] = createWorldSpaceEditHandleElements({
    handles: [
      sourceHandle,
    ],
    onHandlePointerDown: () => undefined,
  });

  assert.ok(htmlHandle);
  assert.equal(isWorldSpaceHtmlEditHandleElement(htmlHandle), true);
  assert.equal(htmlHandle.type, Html);
  const htmlProps = htmlHandle.props as HtmlHandleProps;
  assert.deepEqual(htmlProps.position, [
    sourceHandle.worldPosition.x,
    sourceHandle.worldPosition.y,
    sourceHandle.worldPosition.z,
  ]);
  assert.deepEqual(htmlProps.position, [8.5, 0.125, 2.25]);
  assert.equal("calculatePosition" in (htmlHandle.props as object), false);

  const button = htmlProps.children;
  assert.ok(button);
  const buttonProps = button.props as ButtonProps;

  assert.equal(buttonProps["data-world-handle-id"], "room-b:edge:0");
  assert.equal(buttonProps["data-world-x"], "8.5");
  assert.equal(buttonProps["data-world-y"], "0.125");
  assert.equal(buttonProps["data-world-z"], "2.25");
  assert.equal("data-canvas-x" in buttonProps, false);
  assert.equal("data-canvas-y" in buttonProps, false);
});
