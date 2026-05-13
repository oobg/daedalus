"use client";

import { useEditorStore, useSelectedRoom, useActiveFloor } from "@/store/editorStore";

const OPENING_LABELS: Record<string, string> = {
  door:      "문",
  window:    "창문",
  stair:     "계단",
  elevator:  "엘리베이터",
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-muted">
      {children}
    </p>
  );
}

function PropertyRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-[11px] text-text-muted">{label}</label>
      <div className="text-sm text-text-primary">{children}</div>
    </div>
  );
}

export default function PropertyPanel() {
  const selectedRoom  = useSelectedRoom();
  const activeFloor   = useActiveFloor();
  const updateRoom    = useEditorStore(s => s.updateRoom);
  const removeRoom    = useEditorStore(s => s.removeRoom);
  const selectRoom    = useEditorStore(s => s.selectRoom);
  const removeOpening = useEditorStore(s => s.removeOpening);

  if (!selectedRoom || !activeFloor) {
    return (
      <aside className="w-56 bg-surface-0 border-l border-border-default shrink-0 flex items-center justify-center">
        <p className="text-[11px] text-text-disabled text-center px-4 leading-relaxed">
          방을 클릭하면<br />속성이 표시됩니다
        </p>
      </aside>
    );
  }

  const openings = selectedRoom.openings ?? [];

  return (
    <aside className="w-56 bg-surface-0 border-l border-border-default shrink-0 flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-3 pb-2 border-b border-border-subtle">
        <SectionLabel>방 속성</SectionLabel>
        <button
          onClick={() => selectRoom(null)}
          className="text-[11px] text-text-muted hover:text-text-primary transition-colors duration-75 leading-none"
          aria-label="닫기"
        >
          ✕
        </button>
      </div>

      <div className="p-3 space-y-4">
        {/* Name */}
        <div className="space-y-1">
          <label className="text-[11px] text-text-muted">이름</label>
          <input
            className="w-full px-2.5 py-1.5 text-sm border border-border-default rounded-md
                       bg-surface-3 text-text-primary placeholder:text-text-disabled
                       focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15
                       transition-colors duration-75"
            value={selectedRoom.roomName}
            onChange={e =>
              updateRoom(activeFloor.floorId, selectedRoom.roomId, { roomName: e.target.value })
            }
          />
        </div>

        {/* Area */}
        <PropertyRow label="면적">
          <span className="text-text-secondary">
            {selectedRoom.area > 0 ? `${selectedRoom.area.toFixed(1)} px²` : "—"}
          </span>
        </PropertyRow>

        {/* Vertex count */}
        <PropertyRow label="꼭짓점">
          <span className="text-text-secondary">{selectedRoom.roomPolygon.length}개</span>
        </PropertyRow>

        {/* Shared boundaries */}
        <PropertyRow label="공유 경계">
          <span className="text-text-secondary">
            {selectedRoom.sharedBoundaries.length > 0
              ? `${selectedRoom.sharedBoundaries.length}개`
              : "없음"}
          </span>
        </PropertyRow>

        {/* Openings */}
        {openings.length > 0 && (
          <div className="space-y-2">
            <SectionLabel>배치된 오브젝트</SectionLabel>
            <ul className="space-y-1">
              {openings.map(op => (
                <li
                  key={op.id}
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-md
                             bg-accent-subtle border border-accent/10"
                >
                  <span className="text-xs font-medium text-accent-text">
                    {OPENING_LABELS[op.type] ?? op.type}
                  </span>
                  <button
                    onClick={() => removeOpening(activeFloor.floorId, selectedRoom.roomId, op.id)}
                    className="text-[11px] text-text-muted hover:text-destructive transition-colors duration-75 ml-1"
                    aria-label="제거"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Delete room — pinned to bottom */}
      <div className="mt-auto p-3 border-t border-border-subtle">
        <button
          onClick={() => {
            removeRoom(activeFloor.floorId, selectedRoom.roomId);
            selectRoom(null);
          }}
          className="w-full text-xs px-2 py-1.5 rounded-md text-destructive
                     border border-destructive/20 hover:bg-destructive-bg
                     transition-colors duration-75"
        >
          방 삭제
        </button>
      </div>
    </aside>
  );
}
