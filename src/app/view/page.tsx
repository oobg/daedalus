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
      floors: data.floors,
      activeFloorId: data.viewState?.activeFloorId ?? data.floors[0]?.floorId ?? null,
    };
  } catch {
    return null;
  }
}

export default function ViewPage() {
  const [project, setProject] = useState<ProjectSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Try loading from localStorage on mount (shared via editor)
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
      const raw = ev.target?.result as string;
      const parsed = parseProject(raw);
      if (parsed) {
        setProject(parsed);
        setError(null);
      } else {
        setError("올바른 building-guide.json 파일이 아닙니다.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }, []);

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#f2f1ed] gap-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-[#333] mb-2">Space Raven 뷰어</h1>
          <p className="text-sm text-[#a8a8a2]">JSON 파일을 불러오거나, 편집기에서 '뷰어로 공유'를 통해 접근하세요.</p>
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded">{error}</p>
        )}

        <button
          onClick={() => fileRef.current?.click()}
          className="px-6 py-3 bg-[#4a7c6f] text-white rounded-lg text-sm hover:bg-[#3d6b60] transition-colors"
        >
          JSON 파일 불러오기
        </button>

        <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleFile} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#f2f1ed]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-[#e0ddd7] shrink-0">
        <span className="text-sm font-semibold text-[#4a7c6f]">Space Raven — 읽기 전용 뷰어</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#a8a8a2]">{project.floors.length}개 층</span>
          <button
            onClick={() => fileRef.current?.click()}
            className="text-xs px-3 py-1 bg-[#f2f1ed] hover:bg-[#eeeae3] rounded text-[#6b6b65]"
          >
            다른 파일 열기
          </button>
          <button
            onClick={() => setProject(null)}
            className="text-xs px-3 py-1 bg-[#f2f1ed] hover:bg-[#eeeae3] rounded text-[#6b6b65]"
          >
            닫기
          </button>
        </div>
      </div>

      {/* Floor legend */}
      <div className="flex items-center gap-3 px-4 py-1.5 bg-[#f2f1ed] border-b border-[#e0ddd7] text-xs text-[#a8a8a2] shrink-0 overflow-x-auto">
        {[...project.floors].reverse().map(floor => (
          <span key={floor.floorId} className="whitespace-nowrap">
            {floor.floorName}
            <span className="ml-1 opacity-60">{floor.floorHeight}m · {floor.rooms.length}실</span>
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
