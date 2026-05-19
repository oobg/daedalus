import React, {
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";

import type { EditorFloor } from "../../domain/editor-state.ts";
import { cn } from "../../lib/utils.ts";

export interface FloorSelectionProps {
  floors: readonly Pick<EditorFloor, "floorId" | "floorName" | "floorHeight">[];
  activeFloorId: string | null;
  onSelectFloor: (floorId: string) => void;
}

export interface FloorSelectionButtonElement
  extends ReactElement<{
    children?: ReactNode;
    "data-floor-id": string;
    onClick: () => void;
    type: "button";
  }> {}

export function FloorSelection({
  floors,
  activeFloorId,
  onSelectFloor,
}: FloorSelectionProps): ReactElement {
  const activeFloor = floors.find((floor) => floor.floorId === activeFloorId) ?? null;

  return (
    <>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">
          현재 선택
        </p>
        <p
          aria-live="polite"
          className="truncate text-[11px] font-semibold text-text-primary"
        >
          {activeFloor?.floorName ?? "없음"}
        </p>
      </div>
      <ul aria-label="Available floors" className="space-y-0.5">
        {[...floors].reverse().map((floor) => {
          const isActive = floor.floorId === activeFloorId;

          return (
            <li key={floor.floorId}>
              <button
                type="button"
                aria-pressed={isActive}
                data-floor-id={floor.floorId}
                onClick={() => onSelectFloor(floor.floorId)}
                className={cn(
                  "flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-sm transition-colors duration-75",
                  isActive
                    ? "bg-accent text-white"
                    : "cursor-pointer text-text-primary hover:bg-surface-3",
                )}
              >
                <span className="truncate font-medium">{floor.floorName}</span>
                <span
                  className={cn(
                    "ml-1 shrink-0 tabular-nums text-[11px]",
                    isActive ? "text-white/60" : "text-text-muted",
                  )}
                >
                  {floor.floorHeight}m
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}

export function collectFloorSelectionButtons(
  node: ReactNode,
): FloorSelectionButtonElement[] {
  const buttons: FloorSelectionButtonElement[] = [];

  collectElements(node, buttons);

  return buttons;
}

function collectElements(
  node: ReactNode,
  buttons: FloorSelectionButtonElement[],
): void {
  if (Array.isArray(node)) {
    for (const child of node) {
      collectElements(child, buttons);
    }

    return;
  }

  if (!isValidElement(node)) {
    return;
  }

  const props = node.props as {
    children?: ReactNode;
    "data-floor-id"?: unknown;
  };

  if (node.type === "button" && typeof props["data-floor-id"] === "string") {
    buttons.push(node as FloorSelectionButtonElement);
  }

  collectElements(props.children, buttons);
}
