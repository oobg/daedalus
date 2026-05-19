"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  EditorShell,
  type EditorViewMode,
} from "@/components/editor/EditorShell.ts";
import { resolveEditorSceneRootLifecycleState } from "@/components/editor/editorSceneRootLifecycle.ts";
import { useEditorStore } from "@/store/editorStore";
import { projectEditorStateForRenderer, adaptProjectSnapshotToRenderScene } from "@/features/renderer";
import { buildFloorGuideSvgExport } from "@/features/project-export/floor-guide-svg-export";

const Toolbar      = dynamic(() => import("@/components/organisms/Toolbar"),      { ssr: false });
const FloorSidebar = dynamic(() => import("@/components/organisms/FloorSidebar"), { ssr: false });
const PropertyPanel = dynamic(() => import("@/components/organisms/PropertyPanel"), { ssr: false });
const Viewer25D    = dynamic(() => import("@/components/viewer/Viewer25D"),        { ssr: false });

export default function EditorPage() {
  const [viewMode, setViewMode] = useState<EditorViewMode>("edit");
  const viewerSceneRoot = resolveEditorSceneRootLifecycleState(viewMode);

  const floors               = useEditorStore(s => s.project.floors);
  const activeFloorId        = useEditorStore(s => s.project.viewState.activeFloorId);
  const exteriorPolygon      = useEditorStore(s => s.project.exteriorPolygon ?? null);
  const exteriorEdgeOpenings = useEditorStore(s => s.project.exteriorEdgeOpenings ?? []);
  const loadFromLocalStorage = useEditorStore(s => s.loadFromLocalStorage);

  useEffect(() => { loadFromLocalStorage(); }, [loadFromLocalStorage]);

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
    <EditorShell
      toolbar={<Toolbar />}
      floorSidebar={<FloorSidebar />}
      propertyPanel={<PropertyPanel />}
      viewerSurface={(
        <Viewer25D
          key={viewerSceneRoot.sceneRootKey}
          floors={floors}
          activeFloorId={activeFloorId}
          exteriorPolygon={exteriorPolygon}
          exteriorEdgeOpenings={exteriorEdgeOpenings}
          cameraMode={viewerSceneRoot.cameraMode}
        />
      )}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      onExportSvg={handleExportSVG}
      onShare={() => useEditorStore.getState().saveToLocalStorage()}
    />
  );
}
