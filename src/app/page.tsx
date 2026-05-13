"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import Toolbar from "@/components/organisms/Toolbar";
import FloorSidebar from "@/components/organisms/FloorSidebar";
import PropertyPanel from "@/components/organisms/PropertyPanel";
import { useEditorStore } from "@/store/editorStore";

const Canvas2D = dynamic(() => import("@/components/editor/Canvas2D"), { ssr: false });
const Viewer25D = dynamic(() => import("@/components/viewer/Viewer25D"), { ssr: false });

type ViewMode = "edit" | "preview";

export default function EditorPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("edit");
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef(null);

  const floors = useEditorStore(s => s.project.floors);
  const activeFloorId = useEditorStore(s => s.project.viewState.activeFloorId);
  const exportJSON = useEditorStore(s => s.exportJSON);
  const loadFromLocalStorage = useEditorStore(s => s.loadFromLocalStorage);

  // Load from localStorage on mount
  useEffect(() => {
    loadFromLocalStorage();
  }, [loadFromLocalStorage]);

  // Measure canvas container
  useEffect(() => {
    const el = canvasContainerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(entries => {
      const entry = entries[0];
      if (entry) {
        setCanvasSize({
          width: Math.floor(entry.contentRect.width),
          height: Math.floor(entry.contentRect.height),
        });
      }
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const handleExportPNG = useCallback(() => {
    if (!stageRef.current) return;
    const stage = stageRef.current as { toDataURL: (opts: object) => string };
    const url = stage.toDataURL({ pixelRatio: 2 });
    const a = document.createElement("a");
    a.href = url;
    a.download = "floor-guide.png";
    a.click();
  }, []);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Toolbar />

      {/* Mode switcher */}
      <div className="flex items-center gap-2 px-4 py-1.5 bg-[#f5f5f0] border-b border-[#d4d4c8]">
        <button
          onClick={() => setViewMode("edit")}
          className={`text-sm px-3 py-1 rounded ${viewMode === "edit" ? "bg-[#4a7c6f] text-white" : "text-[#555548] hover:bg-[#e8e8e0]"}`}
        >
          2D 편집
        </button>
        <button
          onClick={() => setViewMode("preview")}
          className={`text-sm px-3 py-1 rounded ${viewMode === "preview" ? "bg-[#4a7c6f] text-white" : "text-[#555548] hover:bg-[#e8e8e0]"}`}
        >
          2.5D 미리보기
        </button>
        <div className="ml-auto flex items-center gap-2">
          {viewMode === "edit" && (
            <button
              onClick={handleExportPNG}
              className="text-sm px-3 py-1 bg-[#f0efeb] hover:bg-[#e8e8e0] rounded text-[#555548]"
            >
              2D PNG 저장
            </button>
          )}
          <a
            href="/view"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm px-3 py-1 bg-[#f0efeb] hover:bg-[#e8e8e0] rounded text-[#555548]"
            onClick={() => {
              useEditorStore.getState().saveToLocalStorage();
            }}
          >
            뷰어로 공유 ↗
          </a>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <FloorSidebar />

        <main ref={canvasContainerRef} className="flex-1 overflow-hidden relative bg-[#f5f5f0]">
          {viewMode === "edit" ? (
            <Canvas2D
              width={canvasSize.width}
              height={canvasSize.height}
              stageRef={stageRef}
            />
          ) : (
            <Viewer25D floors={floors} activeFloorId={activeFloorId} />
          )}
        </main>

        {viewMode === "edit" && <PropertyPanel />}
      </div>
    </div>
  );
}
