"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import type { EditorFloor } from "@/domain/editor-state";

const Viewer25D = dynamic(() => import("@/components/viewer/Viewer25D"), { ssr: false });

const STORAGE_KEY = "daedalus.project";

interface ProjectSnapshot {
  floors: EditorFloor[];
  activeFloorId: string | null;
}

function parseProject(json: string): ProjectSnapshot | null {
  try {
    const data = JSON.parse(json);
    if (!data || !Array.isArray(data.floors)) return null;
    return {
      floors:        data.floors,
      activeFloorId: data.viewState?.activeFloorId ?? data.floors[0]?.floorId ?? null,
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
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const raw    = ev.target?.result as string;
      const parsed = parseProject(raw);
      if (parsed) { setProject(parsed); setError(null); }
      else setError("올바른 building-guide.json 파일이 아닙니다.");
    };
    reader.readAsText(file);
    e.target.value = "";
  }, []);

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-surface-2 gap-6">
        <div className="text-center space-y-2">
          <h1 className="text-xl font-semibold text-text-primary tracking-tight">
            Space Raven 뷰어
          </h1>
          <p className="text-sm text-text-muted">
            JSON 파일을 불러오거나, 편집기에서 &apos;뷰어로 공유&apos;를 통해 접근하세요.
          </p>
        </div>

        {error && (
          <p className="text-xs text-destructive bg-destructive-bg px-4 py-2 rounded-md border border-destructive/15">
            {error}
          </p>
        )}

        <button
          onClick={() => fileRef.current?.click()}
          className="px-5 py-2.5 bg-accent text-white rounded-lg text-sm font-medium
                     hover:bg-accent-hover transition-colors duration-100 shadow-float"
        >
          JSON 파일 불러오기
        </button>

        <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleFile} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-surface-2">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-11 bg-surface-0
                      border-b border-border-default shrink-0">
        <span className="text-sm font-semibold text-accent tracking-tight">
          Space Raven
          <span className="ml-2 text-[11px] font-normal text-text-muted">읽기 전용 뷰어</span>
        </span>
        <div className="flex items-center gap-1">
          <span className="text-[11px] text-text-muted mr-1">
            {project.floors.length}개 층
          </span>
          <button
            onClick={() => fileRef.current?.click()}
            className="text-xs px-2.5 py-1 rounded-md text-text-secondary bg-surface-3
                       hover:bg-border-subtle transition-colors duration-75"
          >
            다른 파일 열기
          </button>
          <button
            onClick={() => setProject(null)}
            className="text-xs px-2.5 py-1 rounded-md text-text-secondary bg-surface-3
                       hover:bg-border-subtle transition-colors duration-75"
          >
            닫기
          </button>
        </div>
      </div>

      {/* Floor legend */}
      <div className="flex items-center gap-4 px-4 h-8 bg-surface-2
                      border-b border-border-default shrink-0 overflow-x-auto">
        {[...project.floors].reverse().map(floor => (
          <span key={floor.floorId} className="text-[11px] text-text-secondary whitespace-nowrap">
            {floor.floorName}
            <span className="ml-1 text-text-muted">
              {floor.floorHeight}m · {floor.rooms.length}실
            </span>
          </span>
        ))}
      </div>

      {/* 2.5D viewer */}
      <div className="flex-1 overflow-hidden">
        <Viewer25D floors={project.floors} activeFloorId={project.activeFloorId} />
      </div>

      <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleFile} />
    </div>
  );
}
