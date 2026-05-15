import React, {
  createElement,
  isValidElement,
  type ChangeEvent,
  type ReactElement,
  type ReactNode,
} from "react";

import { cn } from "../../lib/utils.ts";
import { parseFloorHeightEditorValue } from "../../features/editor/model/floorHeightEditing.ts";

export interface FloorHeightInputProps {
  inputId?: string;
  value: string;
  onInputChange: (value: string) => void;
  onFloorHeightChange: (floorHeight: number) => void;
  onInputBlur?: () => void;
}

export interface FloorHeightInputElement
  extends ReactElement<{
    id: string;
    min: number;
    onBlur?: () => void;
    onChange: (event: ChangeEvent<HTMLInputElement>) => void;
    step: number;
    type: "number";
    value: string;
  }> {}

const DEFAULT_INPUT_ID = "active-floor-height";

export function FloorHeightInput({
  inputId = DEFAULT_INPUT_ID,
  value,
  onInputChange,
  onFloorHeightChange,
  onInputBlur,
}: FloorHeightInputProps): ReactElement {
  return createElement(
    "div",
    { className: "space-y-1" },
    createElement(
      "label",
      {
        htmlFor: inputId,
        className: "text-[11px] text-text-muted",
      },
      "높이 (m)",
    ),
    createElement("input", {
      id: inputId,
      type: "number",
      min: 0.5,
      step: 0.5,
      value,
      onChange: (event: ChangeEvent<HTMLInputElement>) => {
        const nextValue = event.target.value;

        onInputChange(nextValue);

        const nextFloorHeight = parseFloorHeightEditorValue(nextValue);

        if (nextFloorHeight !== null) {
          onFloorHeightChange(nextFloorHeight);
        }
      },
      onBlur: onInputBlur,
      className: cn(
        "flex h-7 w-full rounded-md border border-border-default bg-surface-2",
        "px-2.5 py-1.5 text-sm text-text-primary",
        "placeholder:text-text-disabled",
        "transition-colors duration-75",
        "focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15",
        "disabled:opacity-50 disabled:cursor-not-allowed",
      ),
    }),
  );
}

export function findFloorHeightInput(
  node: ReactNode,
): FloorHeightInputElement | null {
  if (Array.isArray(node)) {
    for (const child of node) {
      const match = findFloorHeightInput(child);

      if (match !== null) {
        return match;
      }
    }

    return null;
  }

  if (!isValidElement(node)) {
    return null;
  }

  const props = node.props as {
    children?: ReactNode;
    id?: unknown;
  };

  if (node.type === "input" && props.id === DEFAULT_INPUT_ID) {
    return node as FloorHeightInputElement;
  }

  return findFloorHeightInput(props.children);
}
