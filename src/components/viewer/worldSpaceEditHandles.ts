import React from "react";
import { Html } from "@react-three/drei";

export interface WorldSpaceEditHandlePosition {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface WorldSpaceEditHandleDefinition {
  readonly id: string;
  readonly label: string;
  readonly worldPosition: WorldSpaceEditHandlePosition;
}

export interface WorldSpaceEditHandlesProps {
  readonly handles: readonly WorldSpaceEditHandleDefinition[];
  readonly onHandlePointerDown?: (handleId: string) => void;
}

export function createWorldSpaceEditHandleElements({
  handles,
  onHandlePointerDown,
}: WorldSpaceEditHandlesProps): React.ReactElement[] {
  return handles.map((handle) =>
    React.createElement(
      Html,
      {
        key: handle.id,
        position: [
          handle.worldPosition.x,
          handle.worldPosition.y,
          handle.worldPosition.z,
        ] as const,
        center: true,
        transform: true,
        sprite: true,
      },
      React.createElement(
        "button",
        {
          type: "button",
          "data-world-handle-id": handle.id,
          "data-world-x": String(handle.worldPosition.x),
          "data-world-y": String(handle.worldPosition.y),
          "data-world-z": String(handle.worldPosition.z),
          "aria-label": handle.label,
          onPointerDown: () => onHandlePointerDown?.(handle.id),
        },
        handle.label,
      ),
    ),
  );
}

export function WorldSpaceEditHandles(
  props: WorldSpaceEditHandlesProps,
): React.ReactElement {
  return React.createElement(
    React.Fragment,
    null,
    ...createWorldSpaceEditHandleElements(props),
  );
}

export function isWorldSpaceHtmlEditHandleElement(
  candidate: unknown,
): candidate is React.ReactElement {
  return React.isValidElement(candidate) && candidate.type === Html;
}

export function collectWorldSpaceHtmlHandleElements(
  tree: React.ReactElement,
): React.ReactElement[] {
  const treeProps = tree.props as { children?: React.ReactNode };
  const queue = React.Children.toArray(treeProps.children);
  const handles: React.ReactElement[] = [];

  while (queue.length > 0) {
    const candidate = queue.shift();

    if (isWorldSpaceHtmlEditHandleElement(candidate)) {
      handles.push(candidate);
      continue;
    }

    if (!React.isValidElement(candidate)) {
      continue;
    }

    const candidateProps = candidate.props as { children?: React.ReactNode };
    queue.push(...React.Children.toArray(candidateProps.children));
  }

  return handles;
}
