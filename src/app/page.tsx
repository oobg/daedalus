"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import Toolbar from "@/components/organisms/Toolbar";
import FloorSidebar from "@/components/organisms/FloorSidebar";
import PropertyPanel from "@/components/organisms/PropertyPanel";
import { useEditorStore } from "@/store/editorStore";

const Canvas2D   = dynamic(() => import("@/components/editor/Canvas2D"),   { ssr: false });
const Viewer25D  = dynamic(() => import("@/components/viewer/Viewer25D"),  { ssr: false });

type ViewMode = "edit" | "preview";

export default function EditorPage() {
  const [viewMode, setViewMode]     = useState<ViewMode>("edit");
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const canvasContainerRef          = useRef<HTMLDivElement>(null);
  const stageRef                    = useRef(null);

  const floors         = useEditorStore(s => s.project.floors);
  const activeFloorId  = useEditorStore(s => s.project.viewState.activeFloorId);
  const exportJSON     = useEditorStore(s => s.exportJSON);
  const loadFromLocalStorage = useEditorStore(s => s.loadFromLocalStorage);

  useEffect(() => { loadFromLocalStorage(); }, [loadFromLocalStorage]);

  useEffect(() => {
    const el = canvasContainerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(entries => {
      const entry = entries[0];
      if (entry) setCanvasSize({
        width:  Math.floor(entry.contentRect.width),
        height: Math.floor(entry.contentRect.height),
      });
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const handleExportPNG = useCallback(() => {
    if (!stageRef.current) return;
    const stage = stageRef.current as { toDataURL: (opts: object) => string };
    const url   = stage.toDataURL({ pixelRatio: 2 });
    const a     = document.createElement("a");
    a.href      = url;
    a.download  = "floor-guide.png";
    a.click();
  }, []);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-surface-2">
      <Toolbar />

      {/* Mode bar */}
      <div className="flex items-center gap-1 px-3 h-9 bg-surface-2 border-b border-border-default shrink-0">
        {/* Mode tabs */}
        <div className="flex items-center gap-0.5 bg-surface-3 rounded-md p-0.5">
          {(["edit", "preview"] as ViewMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={[
                "px-3 py-0.5 rounded text-xs font-medium transition-colors duration-100",
                viewMode === mode
                  ? "bg-accent text-white shadow-sm"
                  : "text-text-secondary hover:text-text-primary",
              ].join(" ")}
            >
              {mode === "edit" ? "2D 편집" : "2.5D 미리보기"}
            </button>
          ))}
        </div>

        {/* Secondary actions */}
        <div className="ml-auto flex items-center gap-1">
          {viewMode === "edit" && (
            <button
              onClick={handleExportPNG}
              className="text-xs px-2.5 py-1 rounded-md text-text-secondary hover:bg-surface-3
                         hover:text-text-primary transition-colors duration-75"
            >
              2D PNG 저장
            </button>
          )}
          <a
            href="/view"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs px-2.5 py-1 rounded-md text-text-secondary hover:bg-surface-3
                       hover:text-text-primary transition-colors duration-75"
            onClick={() => useEditorStore.getState().saveToLocalStorage()}
          >
            뷰어로 공유 ↗
          </a>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        <FloorSidebar />

        <main
          ref={canvasContainerRef}
          className="flex-1 overflow-hidden relative bg-surface-2"
        >
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
