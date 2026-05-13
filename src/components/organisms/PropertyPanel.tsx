"use client";

import { useEditorStore, useSelectedRoom, useActiveFloor } from "@/store/editorStore";

const OPENING_LABELS: Record<string, string> = {
  door: "문",
  window: "창문",
  stair: "계단",
  elevator: "엘리베이터",
};

export default function PropertyPanel() {
  const selectedRoom = useSelectedRoom();
  const activeFloor = useActiveFloor();
  const updateRoom = useEditorStore(s => s.updateRoom);
  const removeRoom = useEditorStore(s => s.removeRoom);
  const selectRoom = useEditorStore(s => s.selectRoom);
  const removeOpening = useEditorStore(s => s.removeOpening);

  if (!selectedRoom || !activeFloor) {
    return (
      <aside className="w-52 bg-white border-l border-[#d4d4c8] p-4 shrink-0">
        <p className="text-xs text-[#888880] text-center mt-8">
          방을 클릭하면<br />속성이 표시됩니다
        </p>
      </aside>
    );
  }

  const openings = selectedRoom.openings ?? [];

  return (
    <aside className="w-52 bg-white border-l border-[#d4d4c8] p-3 shrink-0 space-y-3 overflow-y-auto">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-[#888880] uppercase tracking-wide">방 속성</p>
        <button
          onClick={() => selectRoom(null)}
          className="text-xs text-[#888880] hover:text-[#333]"
        >
          ✕
        </button>
      </div>

      <div>
        <label className="text-xs text-[#888880]">이름</label>
        <input
          className="w-full mt-0.5 px-2 py-1 text-sm border border-[#d4d4c8] rounded bg-[#fafaf8] focus:outline-none focus:border-[#4a7c6f]"
          value={selectedRoom.roomName}
          onChange={e =>
            updateRoom(activeFloor.floorId, selectedRoom.roomId, { roomName: e.target.value })
          }
        />
      </div>

      <div>
        <label className="text-xs text-[#888880]">면적</label>
        <p className="text-sm text-[#333] mt-0.5">
          {selectedRoom.area > 0 ? `${selectedRoom.area.toFixed(1)} px²` : "—"}
        </p>
      </div>

      <div>
        <label className="text-xs text-[#888880]">꼭짓점 수</label>
        <p className="text-sm text-[#333] mt-0.5">{selectedRoom.roomPolygon.length}개</p>
      </div>

      {openings.length > 0 && (
        <div>
          <label className="text-xs text-[#888880]">배치된 오브젝트</label>
          <ul className="mt-1 space-y-1">
            {openings.map(op => (
              <li
                key={op.id}
                className="flex items-center justify-between px-2 py-1 rounded bg-[#f5f5f0] text-xs text-[#444]"
              >
                <span>{OPENING_LABELS[op.type] ?? op.type}</span>
                <button
                  onClick={() => removeOpening(activeFloor.floorId, selectedRoom.roomId, op.id)}
                  className="text-red-400 hover:text-red-600 ml-1"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <label className="text-xs text-[#888880]">공유 경계</label>
        <p className="text-sm text-[#333] mt-0.5">
          {selectedRoom.sharedBoundaries.length > 0
            ? `${selectedRoom.sharedBoundaries.length}개`
            : "없음"}
        </p>
      </div>

      <button
        onClick={() => {
          removeRoom(activeFloor.floorId, selectedRoom.roomId);
          selectRoom(null);
        }}
        className="w-full text-xs px-2 py-1.5 hover:bg-red-50 rounded text-red-400 border border-red-100"
      >
        방 삭제
      </button>
    </aside>
  );
}
