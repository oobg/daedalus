"use client";

import {
  MousePointer2,
  Square,
  Grid2x2,
  DoorOpen,
  Maximize2,
  Layers,
  ChevronsUpDown,
  type LucideIcon,
} from "lucide-react";
import { useEditorStore } from "@/store/editorStore";
import type { ToolType } from "@/store/editorStore";
import { cn } from "@/lib/utils";

const TOOLS: { id: ToolType; label: string; Icon: LucideIcon }[] = [
  { id: "select",    label: "선택",       Icon: MousePointer2  },
  { id: "exterior",  label: "외벽",       Icon: Square         },
  { id: "room",      label: "방",         Icon: Grid2x2        },
  { id: "door",      label: "문",         Icon: DoorOpen       },
  { id: "window",    label: "창문",       Icon: Maximize2      },
  { id: "stair",     label: "계단",       Icon: Layers         },
  { id: "elevator",  label: "엘리베이터", Icon: ChevronsUpDown },
];

export default function Toolbar() {
  const activeTool    = useEditorStore(s => s.activeTool);
  const setActiveTool = useEditorStore(s => s.setActiveTool);
  const isDrawing     = useEditorStore(s => s.isDrawing);
  const draftPoints   = useEditorStore(s => s.draftPoints);
  const commitDraft   = useEditorStore(s => s.commitDraft);
  const cancelDraft   = useEditorStore(s => s.cancelDraft);

  return (
    <div className="flex items-center gap-0.5 px-4 h-11 bg-surface-0 border-b border-border-default select-none shrink-0">

      {/* Brand */}
      <div className="flex items-center gap-2 mr-5">
        <div className="w-5 h-5 rounded bg-accent flex items-center justify-center">
          <Grid2x2 size={11} className="text-white" strokeWidth={2} />
        </div>
        <span className="text-[13px] font-semibold text-text-primary tracking-tight">
          Space Raven
        </span>
      </div>

      {/* Divider */}
      <div className="w-px h-4 bg-border-default mr-1" />

      {/* Tool buttons */}
      {TOOLS.map(({ id, label, Icon }) => {
        const isActive = activeTool === id;
        return (
          <button
            key={id}
            onClick={() => setActiveTool(id)}
            title={label}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors duration-75",
              isActive
                ? "bg-accent-subtle text-accent-text"
                : "text-text-secondary hover:bg-surface-3 hover:text-text-primary"
            )}
          >
            <Icon
              size={13}
              strokeWidth={isActive ? 2.2 : 1.8}
              className="shrink-0"
            />
            <span>{label}</span>
          </button>
        );
      })}

      {/* Drawing status */}
      {isDrawing && (
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[11px] text-text-muted tabular-nums">
            {draftPoints.length}개 — Enter 완료 · Esc 취소
          </span>
          {draftPoints.length >= 3 && (
            <button
              onClick={commitDraft}
              className="px-2.5 py-1 bg-accent text-white rounded-md text-xs font-medium
                         transition-colors duration-75 hover:bg-accent-hover"
            >
              완료
            </button>
          )}
          <button
            onClick={cancelDraft}
            className="px-2.5 py-1 bg-surface-3 text-text-secondary rounded-md text-xs
                       transition-colors duration-75 hover:bg-border-subtle"
          >
            취소
          </button>
        </div>
      )}
    </div>
  );
}
