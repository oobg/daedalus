"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { Download, ExternalLink, FileDown } from "lucide-react";
import Toolbar from "@/components/organisms/Toolbar";
import FloorSidebar from "@/components/organisms/FloorSidebar";
import PropertyPanel from "@/components/organisms/PropertyPanel";
import { Button } from "@/components/ui/button";
import { useActiveFloorReferenceImage, useEditorStore } from "@/store/editorStore";
import { projectEditorStateForRenderer, adaptProjectSnapshotToRenderScene } from "@/features/renderer";
import { buildFloorGuideSvgExport } from "@/features/project-export/floor-guide-svg-export";
import { cn } from "@/lib/utils";

const Canvas2D  = dynamic(() => import("@/components/editor/Canvas2D"),  { ssr: false });
const Viewer25D = dynamic(() => import("@/components/viewer/Viewer25D"), { ssr: false });

type ViewMode = "edit" | "preview";

export default function EditorPage() {
  const [viewMode, setViewMode]     = useState<ViewMode>("edit");
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const canvasContainerRef          = useRef<HTMLDivElement>(null);
  const stageRef                    = useRef(null);

  const floors               = useEditorStore(s => s.project.floors);
  const activeFloorId        = useEditorStore(s => s.project.viewState.activeFloorId);
  const exteriorPolygon      = useEditorStore(s => s.project.exteriorPolygon ?? null);
  const exteriorEdgeOpenings = useEditorStore(s => s.project.exteriorEdgeOpenings ?? []);
  const loadFromLocalStorage = useEditorStore(s => s.loadFromLocalStorage);
  const activeFloorReferenceImage = useActiveFloorReferenceImage();

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

  const handleExportSVG = useCallback(() => {
    const project  = useEditorStore.getState().project;
    const snapshot = projectEditorStateForRenderer(project);
    const scene    = adaptProjectSnapshotToRenderScene(snapshot);
    const floor    = scene.floors.find(f => f.floorId === activeFloorId) ?? scene.floors[0];
    if (!floor) return;
    const svgString = buildFloorGuideSvgExport(floor);
    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = "floor-guide.svg";
    a.click();
    URL.revokeObjectURL(url);
  }, [activeFloorId]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-surface-2">
      <Toolbar />

      {/* Mode bar */}
      <div className="flex items-center gap-2 px-4 h-9 bg-surface-0 border-b border-border-default shrink-0">

        {/* Mode tabs */}
        <div className="flex items-center gap-0.5 bg-surface-3 rounded-md p-0.5">
          {(["edit", "preview"] as ViewMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={cn(
                "px-3 py-1 rounded text-xs font-medium transition-colors duration-75",
                viewMode === mode
                  ? "bg-accent text-white shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              )}
            >
              {mode === "edit" ? "2D 편집" : "2.5D 미리보기"}
            </button>
          ))}
        </div>

        {/* Secondary actions */}
        <div className="ml-auto flex items-center gap-1">
          {viewMode === "edit" && (
            <>
              <Button variant="ghost" size="xs" onClick={handleExportPNG} className="gap-1.5">
                <Download size={11} strokeWidth={1.8} />
                PNG 저장
              </Button>
              <Button variant="ghost" size="xs" onClick={handleExportSVG} className="gap-1.5">
                <FileDown size={11} strokeWidth={1.8} />
                SVG 저장
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="xs"
            asChild
            className="gap-1.5"
          >
            <a
              href="/view"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => useEditorStore.getState().saveToLocalStorage()}
            >
              <ExternalLink size={11} strokeWidth={1.8} />
              뷰어로 공유
            </a>
          </Button>
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
              referenceImageSource={activeFloorReferenceImage?.source ?? null}
              stageRef={stageRef}
            />
          ) : (
            <Viewer25D floors={floors} activeFloorId={activeFloorId} exteriorPolygon={exteriorPolygon} exteriorEdgeOpenings={exteriorEdgeOpenings} />
          )}
        </main>

        {viewMode === "edit" && <PropertyPanel />}
      </div>
    </div>
  );
}
