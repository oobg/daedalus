"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { Grid2x2, FolderOpen, X } from "lucide-react";
import type { EditorFloor, EditorPoint } from "@/domain/editor-state";
import { Button } from "@/components/ui/button";
import { formatViewerFloorMetadata } from "@/features/viewer/viewer-floor-metadata";
import { validateUploadedProjectFile } from "@/features/project-export/validate-uploaded-project-file";

const Viewer25D = dynamic(() => import("@/components/viewer/Viewer25D"), { ssr: false });

const STORAGE_KEY = "daedalus.project";

interface ProjectSnapshot {
  floors: EditorFloor[];
  activeFloorId: string | null;
  exteriorPolygon: EditorPoint[] | null;
}

function parseProject(json: string): ProjectSnapshot | null {
  try {
    const data = JSON.parse(json);
    if (!data || !Array.isArray(data.floors)) return null;
    return {
      floors:          data.floors,
      activeFloorId:   data.viewState?.activeFloorId ?? data.floors[0]?.floorId ?? null,
      exteriorPolygon: data.exteriorPolygon ?? null,
    };
  } catch {
    return null;
  }
}

export default function ViewPage() {
  const [project, setProject] = useState<ProjectSnapshot | null>(null);
  const [error,   setError]   = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = parseProject(raw);
      if (parsed) setProject(parsed);
    }
  }, []);

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const validation = validateUploadedProjectFile(file);

    if (!validation.ok) {
      setError(validation.message);
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = ev => {
      const raw    = ev.target?.result as string;
      const parsed = parseProject(raw);
      if (parsed) { setProject(parsed); setError(null); }
      else setError("올바른 building-guide.json 파일이 아닙니다.");
    };
    reader.readAsText(validation.file);
    e.target.value = "";
  }, []);

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-surface-2 gap-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shadow-md">
            <Grid2x2 size={20} className="text-white" strokeWidth={1.8} />
          </div>
          <div className="text-center space-y-1.5">
            <h1 className="text-lg font-semibold text-text-primary tracking-tight">
              Space Raven 뷰어
            </h1>
            <p className="text-sm text-text-muted max-w-xs leading-relaxed">
              JSON 파일을 불러오거나, 편집기에서 &apos;뷰어로 공유&apos;를 통해 접근하세요.
            </p>
          </div>
        </div>

        {error && (
          <p className="text-xs text-destructive bg-destructive-bg px-4 py-2 rounded-md border border-destructive/15">
            {error}
          </p>
        )}

        <Button variant="primary" size="md" className="gap-2 shadow-float" onClick={() => fileRef.current?.click()}>
          <FolderOpen size={14} strokeWidth={1.8} />
          JSON 파일 불러오기
        </Button>

        <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleFile} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-surface-2">

      {/* Header */}
      <div className="flex items-center justify-between px-4 h-11 bg-surface-0
                      border-b border-border-default shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-accent flex items-center justify-center">
            <Grid2x2 size={11} className="text-white" strokeWidth={2} />
          </div>
          <span className="text-[13px] font-semibold text-text-primary tracking-tight">
            Space Raven
          </span>
          <span className="text-[11px] text-text-muted">읽기 전용 뷰어</span>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-[11px] text-text-muted mr-1 tabular-nums">
            {project.floors.length}개 층
          </span>
          <Button variant="ghost" size="xs" className="gap-1.5" onClick={() => fileRef.current?.click()}>
            <FolderOpen size={10} strokeWidth={1.8} />
            다른 파일 열기
          </Button>
          <Button variant="ghost" size="xs" className="gap-1.5" onClick={() => setProject(null)}>
            <X size={10} strokeWidth={2} />
            닫기
          </Button>
        </div>
      </div>

      {/* Floor legend */}
      <div className="flex items-center gap-4 px-4 h-8 bg-surface-0
                      border-b border-border-default shrink-0 overflow-x-auto">
        {[...project.floors].reverse().map(floor => (
          <span key={floor.floorId} className="text-[11px] text-text-secondary whitespace-nowrap">
            {floor.floorName}
            <span className="ml-1 text-text-muted tabular-nums">
              {formatViewerFloorMetadata({
                floorHeight: floor.floorHeight,
                roomCount: floor.rooms.length,
              })}
            </span>
          </span>
        ))}
      </div>

      {/* 2.5D viewer */}
      <div className="flex-1 overflow-hidden">
        <Viewer25D
          floors={project.floors}
          activeFloorId={project.activeFloorId}
          exteriorPolygon={project.exteriorPolygon}
        />
      </div>

      <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleFile} />
    </div>
  );
}
