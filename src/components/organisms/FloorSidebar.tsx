"use client";

import { useRef } from "react";
import { useEditorStore } from "@/store/editorStore";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-muted mb-2">
      {children}
    </p>
  );
}

export default function FloorSidebar() {
  const floors            = useEditorStore(s => s.project.floors);
  const activeFloorId     = useEditorStore(s => s.project.viewState.activeFloorId);
  const addFloor          = useEditorStore(s => s.addFloor);
  const removeFloor       = useEditorStore(s => s.removeFloor);
  const setActiveFloor    = useEditorStore(s => s.setActiveFloor);
  const updateFloor       = useEditorStore(s => s.updateFloor);
  const setReferenceImage = useEditorStore(s => s.setReferenceImage);
  const saveToLocalStorage    = useEditorStore(s => s.saveToLocalStorage);
  const loadFromLocalStorage  = useEditorStore(s => s.loadFromLocalStorage);
  const exportJSON        = useEditorStore(s => s.exportJSON);
  const importJSON        = useEditorStore(s => s.importJSON);
  const exportSVG         = useEditorStore(s => s.exportSVG);

  const importFileRef = useRef<HTMLInputElement>(null);
  const imageFileRef  = useRef<HTMLInputElement>(null);

  function handleImportJSON(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const result = importJSON(ev.target?.result as string);
      if (!result.ok) alert(`가져오기 실패: ${result.error}`);
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  function handleExportJSON() {
    const json = exportJSON();
    const blob = new Blob([json], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = "building-guide.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleReferenceImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !activeFloorId) return;
    const reader = new FileReader();
    reader.onload = ev => setReferenceImage(activeFloorId, ev.target?.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  const activeFloor = floors.find(f => f.floorId === activeFloorId);

  return (
    <aside className="w-48 flex flex-col bg-surface-0 border-r border-border-default shrink-0">

      {/* Floor list */}
      <div className="p-3 border-b border-border-default">
        <div className="flex items-center justify-between mb-2">
          <SectionLabel>층</SectionLabel>
          <button
            onClick={addFloor}
            className="text-[11px] px-2 py-0.5 rounded-md bg-surface-3 text-text-secondary hover:bg-border-subtle transition-colors duration-75"
          >
            + 추가
          </button>
        </div>
        <ul className="space-y-0.5">
          {[...floors].reverse().map(floor => {
            const isActive = floor.floorId === activeFloorId;
            return (
              <li
                key={floor.floorId}
                onClick={() => setActiveFloor(floor.floorId)}
                className={[
                  "flex items-center justify-between px-2.5 py-2 rounded-md cursor-pointer text-sm transition-colors duration-75",
                  isActive
                    ? "bg-accent text-white"
                    : "hover:bg-surface-3 text-text-primary",
                ].join(" ")}
              >
                <span className="font-medium truncate">{floor.floorName}</span>
                <span className={[
                  "text-[11px] shrink-0 ml-1",
                  isActive ? "text-white/60" : "text-text-muted",
                ].join(" ")}>
                  {floor.floorHeight}m
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Active floor settings */}
      {activeFloor && (
        <div className="p-3 border-b border-border-default space-y-3">
          <SectionLabel>층 설정</SectionLabel>

          <div className="space-y-1">
            <label className="text-[11px] text-text-muted">이름</label>
            <input
              className="w-full px-2.5 py-1.5 text-sm border border-border-default rounded-md bg-surface-3
                         text-text-primary placeholder:text-text-disabled
                         focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15
                         transition-colors duration-75"
              value={activeFloor.floorName}
              onChange={e => updateFloor(activeFloor.floorId, { floorName: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-text-muted">높이 (m)</label>
            <input
              type="number"
              min={0.5}
              step={0.5}
              className="w-full px-2.5 py-1.5 text-sm border border-border-default rounded-md bg-surface-3
                         text-text-primary
                         focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15
                         transition-colors duration-75"
              value={activeFloor.floorHeight}
              onChange={e => updateFloor(activeFloor.floorId, { floorHeight: parseFloat(e.target.value) || 3 })}
            />
          </div>

          <button
            onClick={() => imageFileRef.current?.click()}
            className="w-full text-[11px] px-2 py-1.5 bg-surface-3 hover:bg-border-subtle rounded-md
                       text-text-secondary transition-colors duration-75"
          >
            {activeFloor.referenceImage ? "도면 이미지 변경" : "도면 이미지 업로드"}
          </button>

          {activeFloor.referenceImage && (
            <button
              onClick={() => setReferenceImage(activeFloor.floorId, null)}
              className="w-full text-[11px] px-2 py-1.5 rounded-md text-destructive
                         hover:bg-destructive-bg transition-colors duration-75"
            >
              도면 이미지 제거
            </button>
          )}

          {floors.length > 1 && (
            <button
              onClick={() => removeFloor(activeFloor.floorId)}
              className="w-full text-[11px] px-2 py-1.5 rounded-md text-destructive
                         hover:bg-destructive-bg transition-colors duration-75"
            >
              이 층 삭제
            </button>
          )}
        </div>
      )}

      {/* File actions */}
      <div className="p-3 mt-auto space-y-1">
        <SectionLabel>파일</SectionLabel>
        <button
          onClick={saveToLocalStorage}
          className="w-full text-[11px] px-2 py-1.5 bg-accent text-white rounded-md
                     hover:bg-accent-hover transition-colors duration-75 font-medium"
        >
          저장 (로컬)
        </button>
        {[
          { label: "불러오기 (로컬)", action: () => loadFromLocalStorage() },
          { label: "JSON 내보내기",   action: handleExportJSON },
          { label: "JSON 가져오기",   action: () => importFileRef.current?.click() },
          { label: "SVG 내보내기",    action: () => exportSVG() },
        ].map(({ label, action }) => (
          <button
            key={label}
            onClick={action}
            className="w-full text-[11px] px-2 py-1.5 bg-surface-3 hover:bg-border-subtle
                       rounded-md text-text-secondary transition-colors duration-75"
          >
            {label}
          </button>
        ))}
      </div>

      <input ref={importFileRef} type="file" accept=".json"    className="hidden" onChange={handleImportJSON} />
      <input ref={imageFileRef}  type="file" accept="image/*"  className="hidden" onChange={handleReferenceImage} />
    </aside>
  );
}
