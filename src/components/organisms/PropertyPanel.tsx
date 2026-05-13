"use client";

import { X, Trash2 } from "lucide-react";
import { useEditorStore, useSelectedRoom, useActiveFloor } from "@/store/editorStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const OPENING_LABELS: Record<string, string> = {
  door:     "문",
  window:   "창문",
  stair:    "계단",
  elevator: "엘리베이터",
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-micro text-text-muted uppercase tracking-[0.08em] font-semibold">
      {children}
    </p>
  );
}

function PropertyRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-[11px] text-text-muted">{label}</span>
      <span className="text-xs text-text-secondary tabular-nums">{children}</span>
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
      <aside className="w-52 bg-surface-0 border-l border-border-default shrink-0 flex items-center justify-center">
        <p className="text-[11px] text-text-disabled text-center px-4 leading-relaxed">
          방을 클릭하면<br />속성이 표시됩니다
        </p>
      </aside>
    );
  }

  const openings = selectedRoom.openings ?? [];

  return (
    <aside className="w-52 bg-surface-0 border-l border-border-default shrink-0 flex flex-col overflow-y-auto">

      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-3 pb-2">
        <SectionLabel>방 속성</SectionLabel>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => selectRoom(null)}
          aria-label="닫기"
          className="h-5 w-5"
        >
          <X size={12} strokeWidth={2} />
        </Button>
      </div>

      <Separator />

      <div className="p-3 space-y-4">

        {/* Name */}
        <div className="space-y-1.5">
          <label className="text-[11px] text-text-muted">이름</label>
          <Input
            value={selectedRoom.roomName}
            onChange={e =>
              updateRoom(activeFloor.floorId, selectedRoom.roomId, { roomName: e.target.value })
            }
          />
        </div>

        {/* Metrics */}
        <div className="rounded-md bg-surface-2 border border-border-subtle px-2.5 py-1.5 space-y-0.5">
          <PropertyRow label="면적">
            {selectedRoom.area > 0 ? `${selectedRoom.area.toFixed(1)} px²` : "—"}
          </PropertyRow>
          <PropertyRow label="꼭짓점">
            {selectedRoom.roomPolygon.length}개
          </PropertyRow>
          <PropertyRow label="공유 경계">
            {selectedRoom.sharedBoundaries.length > 0
              ? `${selectedRoom.sharedBoundaries.length}개`
              : "없음"}
          </PropertyRow>
        </div>

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
                  <Badge variant="default">
                    {OPENING_LABELS[op.type] ?? op.type}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeOpening(activeFloor.floorId, selectedRoom.roomId, op.id)}
                    aria-label="제거"
                    className="h-5 w-5 hover:text-destructive"
                  >
                    <X size={10} strokeWidth={2} />
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Delete room — pinned to bottom */}
      <div className="mt-auto p-3 pt-0">
        <Separator className="mb-3" />
        <Button
          variant="danger"
          size="sm"
          className="w-full gap-1.5"
          onClick={() => {
            removeRoom(activeFloor.floorId, selectedRoom.roomId);
            selectRoom(null);
          }}
        >
          <Trash2 size={11} strokeWidth={1.8} />
          방 삭제
        </Button>
      </div>
    </aside>
  );
}
