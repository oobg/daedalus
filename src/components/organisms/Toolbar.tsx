"use client";

import { useEditorStore } from "@/store/editorStore";
import type { ToolType } from "@/store/editorStore";

const TOOLS: { id: ToolType; label: string; icon: string }[] = [
  { id: "select",    label: "선택",      icon: "↖" },
  { id: "exterior",  label: "외벽",      icon: "⬜" },
  { id: "room",      label: "방",        icon: "▭" },
  { id: "door",      label: "문",        icon: "⬛" },
  { id: "window",    label: "창문",      icon: "🪟" },
  { id: "stair",     label: "계단",      icon: "⇑" },
  { id: "elevator",  label: "엘리베이터", icon: "⊟" },
];

export default function Toolbar() {
  const activeTool  = useEditorStore(s => s.activeTool);
  const setActiveTool = useEditorStore(s => s.setActiveTool);
  const isDrawing   = useEditorStore(s => s.isDrawing);
  const draftPoints = useEditorStore(s => s.draftPoints);
  const commitDraft = useEditorStore(s => s.commitDraft);
  const cancelDraft = useEditorStore(s => s.cancelDraft);

  return (
    <div className="flex items-center gap-0.5 px-3 h-12 bg-surface-0 border-b border-border-default select-none shrink-0">
      {/* Brand */}
      <span className="text-sm font-semibold text-accent mr-4 tracking-tight">
        Space Raven
      </span>

      {/* Tool buttons */}
      {TOOLS.map(tool => {
        const isActive = activeTool === tool.id;
        return (
          <button
            key={tool.id}
            onClick={() => setActiveTool(tool.id)}
            title={tool.label}
            className={[
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm transition-colors duration-75",
              isActive
                ? "bg-accent-subtle text-accent font-medium"
                : "text-text-secondary hover:bg-surface-3 hover:text-text-primary",
            ].join(" ")}
          >
            <span className="text-base leading-none">{tool.icon}</span>
            <span>{tool.label}</span>
          </button>
        );
      })}

      {/* Drawing status */}
      {isDrawing && (
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-text-muted">
            점 {draftPoints.length}개 찍힘 &mdash; Enter 완료 · Esc 취소
          </span>
          {draftPoints.length >= 3 && (
            <button
              onClick={commitDraft}
              className="px-3 py-1 bg-accent text-white rounded-md text-xs font-medium transition-colors duration-75 hover:bg-accent-hover"
            >
              완료
            </button>
          )}
          <button
            onClick={cancelDraft}
            className="px-3 py-1 bg-surface-3 text-text-secondary rounded-md text-xs transition-colors duration-75 hover:bg-border-subtle"
          >
            취소
          </button>
        </div>
      )}
    </div>
  );
}
