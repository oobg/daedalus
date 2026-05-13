"use client";

import { useRef } from "react";
import { Plus, Trash2, Image, Upload, Download, Save, FolderOpen, FileJson } from "lucide-react";
import { useEditorStore } from "@/store/editorStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-micro text-text-muted mb-2 uppercase tracking-[0.08em] font-semibold">
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
          <Button variant="ghost" size="xs" onClick={addFloor} className="gap-1 h-5 px-1.5">
            <Plus size={10} strokeWidth={2.5} />
            추가
          </Button>
        </div>

        <ul className="space-y-0.5">
          {[...floors].reverse().map(floor => {
            const isActive = floor.floorId === activeFloorId;
            return (
              <li
                key={floor.floorId}
                onClick={() => setActiveFloor(floor.floorId)}
                className={cn(
                  "flex items-center justify-between px-2.5 py-1.5 rounded-md cursor-pointer",
                  "text-sm transition-colors duration-75",
                  isActive
                    ? "bg-accent text-white"
                    : "hover:bg-surface-3 text-text-primary"
                )}
              >
                <span className="font-medium truncate">{floor.floorName}</span>
                <span className={cn(
                  "text-[11px] shrink-0 ml-1 tabular-nums",
                  isActive ? "text-white/60" : "text-text-muted"
                )}>
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
            <Input
              value={activeFloor.floorName}
              onChange={e => updateFloor(activeFloor.floorId, { floorName: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-text-muted">높이 (m)</label>
            <Input
              type="number"
              min={0.5}
              step={0.5}
              value={activeFloor.floorHeight}
              onChange={e =>
                updateFloor(activeFloor.floorId, { floorHeight: parseFloat(e.target.value) || 3 })
              }
            />
          </div>

          <Button
            variant="secondary"
            size="xs"
            className="w-full justify-start gap-1.5"
            onClick={() => imageFileRef.current?.click()}
          >
            <Image size={10} strokeWidth={1.8} />
            {activeFloor.referenceImage ? "도면 이미지 변경" : "도면 이미지 업로드"}
          </Button>

          {activeFloor.referenceImage && (
            <Button
              variant="danger"
              size="xs"
              className="w-full justify-start gap-1.5"
              onClick={() => setReferenceImage(activeFloor.floorId, null)}
            >
              <Trash2 size={10} strokeWidth={1.8} />
              도면 이미지 제거
            </Button>
          )}

          {floors.length > 1 && (
            <Button
              variant="danger"
              size="xs"
              className="w-full justify-start gap-1.5"
              onClick={() => removeFloor(activeFloor.floorId)}
            >
              <Trash2 size={10} strokeWidth={1.8} />
              이 층 삭제
            </Button>
          )}
        </div>
      )}

      {/* File actions */}
      <div className="p-3 mt-auto space-y-1.5">
        <SectionLabel>파일</SectionLabel>

        <Button variant="primary" size="xs" className="w-full justify-start gap-1.5" onClick={saveToLocalStorage}>
          <Save size={10} strokeWidth={2} />
          저장 (로컬)
        </Button>

        {([
          { label: "불러오기 (로컬)", Icon: FolderOpen, action: () => loadFromLocalStorage() },
          { label: "JSON 내보내기",   Icon: Download,   action: handleExportJSON },
          { label: "JSON 가져오기",   Icon: Upload,     action: () => importFileRef.current?.click() },
          { label: "SVG 내보내기",    Icon: FileJson,   action: () => exportSVG() },
        ] as const).map(({ label, Icon, action }) => (
          <Button
            key={label}
            variant="ghost"
            size="xs"
            className="w-full justify-start gap-1.5"
            onClick={action}
          >
            <Icon size={10} strokeWidth={1.8} />
            {label}
          </Button>
        ))}
      </div>

      <input ref={importFileRef} type="file" accept=".json"   className="hidden" onChange={handleImportJSON} />
      <input ref={imageFileRef}  type="file" accept="image/*" className="hidden" onChange={handleReferenceImage} />
    </aside>
  );
}
