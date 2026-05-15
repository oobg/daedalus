import React, { createElement, type ReactElement } from "react";

import type { EditorFloor } from "../../domain/editor-state.ts";
import { FloorHeightInput } from "./FloorHeightInput.ts";
import { FloorSelection } from "./FloorSelection.ts";

export interface FloorHeightConfigurationProps {
  floors: readonly Pick<EditorFloor, "floorId" | "floorName" | "floorHeight">[];
  activeFloorId: string | null;
  floorHeightInput: string;
  onSelectFloor: (floorId: string) => void;
  onFloorHeightInputChange: (value: string) => void;
  onFloorHeightChange: (input: {
    floorId: string;
    floorHeight: number;
  }) => void;
  onFloorHeightInputBlur?: (floorId: string) => void;
}

export function FloorHeightConfiguration({
  floors,
  activeFloorId,
  floorHeightInput,
  onSelectFloor,
  onFloorHeightInputChange,
  onFloorHeightChange,
  onFloorHeightInputBlur,
}: FloorHeightConfigurationProps): ReactElement {
  const activeFloor = floors.find((floor) => floor.floorId === activeFloorId) ?? null;

  return createElement(
    "div",
    { className: "space-y-3" },
    createElement(FloorSelection, {
      floors,
      activeFloorId,
      onSelectFloor,
    }),
    activeFloor
      ? createElement(
          "div",
          { className: "space-y-2" },
          createElement(
            "p",
            { className: "text-micro text-text-muted uppercase tracking-[0.08em] font-semibold" },
            "층 높이",
          ),
          createElement(FloorHeightInput, {
            value: floorHeightInput,
            onInputChange: onFloorHeightInputChange,
            onFloorHeightChange: (floorHeight) => {
              onFloorHeightChange({
                floorId: activeFloor.floorId,
                floorHeight,
              });
            },
            onInputBlur: () => {
              onFloorHeightInputBlur?.(activeFloor.floorId);
            },
          }),
        )
      : null,
  );
}
