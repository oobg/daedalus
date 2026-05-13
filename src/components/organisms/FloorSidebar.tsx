"use client";

import { useRef } from "react";
import { useEditorStore } from "@/store/editorStore";

export default function FloorSidebar() {
  const floors = useEditorStore(s => s.project.floors);
  const activeFloorId = useEditorStore(s => s.project.viewState.activeFloorId);
  const addFloor = useEditorStore(s => s.addFloor);
  const removeFloor = useEditorStore(s => s.removeFloor);
  const setActiveFloor = useEditorStore(s => s.setActiveFloor);
  const updateFloor = useEditorStore(s => s.updateFloor);
  const setReferenceImage = useEditorStore(s => s.setReferenceImage);
  const saveToLocalStorage = useEditorStore(s => s.saveToLocalStorage);
  const loadFromLocalStorage = useEditorStore(s => s.loadFromLocalStorage);
  const exportJSON = useEditorStore(s => s.exportJSON);
  const importJSON = useEditorStore(s => s.importJSON);
  const exportSVG = useEditorStore(s => s.exportSVG);

  const importFileRef = useRef<HTMLInputElement>(null);
  const imageFileRef = useRef<HTMLInputElement>(null);

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
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "building-guide.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleReferenceImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !activeFloorId) return;
    const reader = new FileReader();
    reader.onload = ev => {
      setReferenceImage(activeFloorId, ev.target?.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  return (
    <aside className="w-52 flex flex-col bg-white border-r border-[#e0ddd7] shrink-0">
      {/* Floors */}
      <div className="p-3 border-b border-[#e0ddd7]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-[#a8a8a2] uppercase tracking-wide">층</span>
          <button
            onClick={addFloor}
            className="text-xs px-2 py-0.5 bg-[#f2f1ed] hover:bg-[#eeeae3] rounded"
          >
            + 추가
          </button>
        </div>
        <ul className="space-y-1">
          {[...floors].reverse().map(floor => (
            <li
              key={floor.floorId}
              onClick={() => setActiveFloor(floor.floorId)}
              className={`flex items-center justify-between px-2 py-1.5 rounded cursor-pointer text-sm group ${
                floor.floorId === activeFloorId
                  ? "bg-[#4a7c6f] text-white"
                  : "hover:bg-[#f2f1ed] text-[#333]"
              }`}
            >
              <span>{floor.floorName}</span>
              <span className={`text-xs opacity-60 ${floor.floorId === activeFloorId ? "text-white" : "text-[#888]"}`}>
                {floor.floorHeight}m
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Active floor properties */}
      {activeFloorId && (() => {
        const floor = floors.find(f => f.floorId === activeFloorId);
        if (!floor) return null;
        return (
          <div className="p-3 border-b border-[#e0ddd7] space-y-2">
            <p className="text-xs font-semibold text-[#a8a8a2] uppercase tracking-wide mb-1">층 설정</p>
            <div>
              <label className="text-xs text-[#a8a8a2]">이름</label>
              <input
                className="w-full mt-0.5 px-2 py-1 text-sm border border-[#e0ddd7] rounded bg-[#fafaf8] focus:outline-none focus:border-[#4a7c6f]"
                value={floor.floorName}
                onChange={e => updateFloor(floor.floorId, { floorName: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-[#a8a8a2]">높이 (m)</label>
              <input
                type="number"
                min={0.5}
                step={0.5}
                className="w-full mt-0.5 px-2 py-1 text-sm border border-[#e0ddd7] rounded bg-[#fafaf8] focus:outline-none focus:border-[#4a7c6f]"
                value={floor.floorHeight}
                onChange={e => updateFloor(floor.floorId, { floorHeight: parseFloat(e.target.value) || 3 })}
              />
            </div>
            <button
              onClick={() => imageFileRef.current?.click()}
              className="w-full text-xs px-2 py-1.5 bg-[#f2f1ed] hover:bg-[#eeeae3] rounded text-[#6b6b65]"
            >
              {floor.referenceImage ? "도면 이미지 변경" : "도면 이미지 업로드"}
            </button>
            {floor.referenceImage && (
              <button
                onClick={() => setReferenceImage(floor.floorId, null)}
                className="w-full text-xs px-2 py-1.5 bg-[#f2f1ed] hover:bg-red-50 rounded text-red-500"
              >
                도면 이미지 제거
              </button>
            )}
            {floors.length > 1 && (
              <button
                onClick={() => removeFloor(floor.floorId)}
                className="w-full text-xs px-2 py-1.5 hover:bg-red-50 rounded text-red-400"
              >
                이 층 삭제
              </button>
            )}
          </div>
        );
      })()}

      {/* Save/Load/Export */}
      <div className="p-3 mt-auto space-y-1.5">
        <p className="text-xs font-semibold text-[#a8a8a2] uppercase tracking-wide mb-2">파일</p>
        <button
          onClick={saveToLocalStorage}
          className="w-full text-xs px-2 py-1.5 bg-[#4a7c6f] text-white rounded hover:bg-[#3d6b60]"
        >
          저장 (로컬)
        </button>
        <button
          onClick={() => loadFromLocalStorage()}
          className="w-full text-xs px-2 py-1.5 bg-[#f2f1ed] hover:bg-[#eeeae3] rounded"
        >
          불러오기 (로컬)
        </button>
        <button
          onClick={handleExportJSON}
          className="w-full text-xs px-2 py-1.5 bg-[#f2f1ed] hover:bg-[#eeeae3] rounded"
        >
          JSON 내보내기
        </button>
        <button
          onClick={() => importFileRef.current?.click()}
          className="w-full text-xs px-2 py-1.5 bg-[#f2f1ed] hover:bg-[#eeeae3] rounded"
        >
          JSON 가져오기
        </button>
        <button
          onClick={() => exportSVG()}
          className="w-full text-xs px-2 py-1.5 bg-[#f2f1ed] hover:bg-[#eeeae3] rounded"
        >
          SVG 내보내기
        </button>
      </div>

      <input ref={importFileRef} type="file" accept=".json" className="hidden" onChange={handleImportJSON} />
      <input ref={imageFileRef} type="file" accept="image/*" className="hidden" onChange={handleReferenceImage} />
    </aside>
  );
}
