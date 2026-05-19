import React, { type ReactElement } from "react";

import type { EditorFloor } from "../../domain/editor-state.ts";
import { FloorHeightInput } from "./FloorHeightInput.tsx";
import { FloorSelection } from "./FloorSelection.tsx";

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

  return (
    <div className="space-y-3">
      <FloorSelection
        floors={floors}
        activeFloorId={activeFloorId}
        onSelectFloor={onSelectFloor}
      />
      {activeFloor && (
        <div className="space-y-2">
          <p className="text-micro text-text-muted uppercase tracking-[0.08em] font-semibold">
            층 높이
          </p>
          <FloorHeightInput
            value={floorHeightInput}
            onInputChange={onFloorHeightInputChange}
            onFloorHeightChange={(floorHeight) => {
              onFloorHeightChange({
                floorId: activeFloor.floorId,
                floorHeight,
              });
            }}
            onInputBlur={() => {
              onFloorHeightInputBlur?.(activeFloor.floorId);
            }}
          />
        </div>
      )}
    </div>
  );
}
