"use client";

import { useEditorStore } from "@/store/editorStore";
import type { ToolType } from "@/store/editorStore";

const TOOLS: { id: ToolType; label: string; icon: string }[] = [
  { id: "select", label: "선택", icon: "↖" },
  { id: "room", label: "방", icon: "▭" },
  { id: "door", label: "문", icon: "⬛" },
  { id: "window", label: "창문", icon: "🪟" },
  { id: "stair", label: "계단", icon: "⇑" },
  { id: "elevator", label: "엘리베이터", icon: "⊟" },
];

export default function Toolbar() {
  const activeTool = useEditorStore(s => s.activeTool);
  const setActiveTool = useEditorStore(s => s.setActiveTool);
  const isDrawing = useEditorStore(s => s.isDrawing);
  const draftPoints = useEditorStore(s => s.draftPoints);
  const commitDraft = useEditorStore(s => s.commitDraft);
  const cancelDraft = useEditorStore(s => s.cancelDraft);

  return (
    <div className="flex items-center gap-1 px-3 py-2 bg-white border-b border-[#d4d4c8] select-none">
      <span className="text-sm font-semibold text-[#4a7c6f] mr-3">Space Raven</span>

      {TOOLS.map(tool => (
        <button
          key={tool.id}
          onClick={() => setActiveTool(tool.id)}
          className={`px-3 py-1.5 rounded text-sm transition-colors ${
            activeTool === tool.id
              ? "bg-[#4a7c6f] text-white"
              : "bg-transparent text-[#555548] hover:bg-[#f0efeb]"
          }`}
          title={tool.label}
        >
          <span className="mr-1">{tool.icon}</span>
          {tool.label}
        </button>
      ))}

      {isDrawing && (
        <div className="ml-auto flex items-center gap-2 text-sm text-[#555548]">
          <span className="text-[#888880]">점 {draftPoints.length}개 찍힘 — Enter로 완료, Esc로 취소</span>
          {draftPoints.length >= 3 && (
            <button
              onClick={commitDraft}
              className="px-3 py-1 bg-[#4a7c6f] text-white rounded text-sm"
            >
              완료
            </button>
          )}
          <button
            onClick={cancelDraft}
            className="px-3 py-1 bg-[#e8e8e0] text-[#555548] rounded text-sm"
          >
            취소
          </button>
        </div>
      )}
    </div>
  );
}
