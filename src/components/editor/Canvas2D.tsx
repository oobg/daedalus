"use client";

// Canvas2D is loaded via dynamic({ ssr: false }) from page.tsx,
// so direct react-konva imports are safe — no SSR will run this module.
import { Stage, Layer, Rect, Line, Circle, Arc, Text, Image, Group } from "react-konva";
import { useRef, useCallback, useEffect, useState, useMemo } from "react";
import { useEditorStore, useActiveFloor } from "@/store/editorStore";
import type { KonvaEventObject } from "konva/lib/Node";
import type { RoomOpeningType, EditorPoint } from "@/domain/editor-state";

// ── Colors ───────────────────────────────────────────────────────────────────
const ROOM_FILL            = "#DDD8CF";
const ROOM_FILL_SELECTED   = "#EEEDFB";
const ROOM_STROKE          = "#B8B2A8";
const ROOM_STROKE_SELECTED = "#7267C0";
const DRAFT_COLOR          = "#7267C0";
const EXTERIOR_STROKE      = "#7A6B60";
const VERTEX_FILL          = "#FFFFFF";
const VERTEX_STROKE        = "#7267C0";

// Auto-close threshold for exterior polygon (pixels)
const CLOSE_THRESHOLD = 16;

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Snap raw point to horizontal/vertical axis from `from` (90° snapping). */
function applySnap(raw: EditorPoint, from: EditorPoint): EditorPoint {
  const dx = raw.x - from.x;
  const dy = raw.y - from.y;
  return Math.abs(dx) > Math.abs(dy)
    ? { x: raw.x, y: from.y }
    : { x: from.x, y: raw.y };
}

function useRefImage(src: string | null): HTMLImageElement | null {
  const imgRef = useRef<HTMLImageElement | null>(null);
  useEffect(() => {
    if (!src) { imgRef.current = null; return; }
    const img = new window.Image();
    img.src = src;
    img.onload = () => { imgRef.current = img; };
  }, [src]);
  return imgRef.current;
}

function pointInPolygon(pt: EditorPoint, poly: EditorPoint[]): boolean {
  let inside = false;
  const n = poly.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = poly[i].x, yi = poly[i].y;
    const xj = poly[j].x, yj = poly[j].y;
    if ((yi > pt.y) !== (yj > pt.y) &&
      pt.x < ((xj - xi) * (pt.y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

// ── Opening symbol renderers ──────────────────────────────────────────────────

function DoorSymbol({ x, y, alpha = 1 }: { x: number; y: number; alpha?: number }) {
  const r = 14;
  return (
    <Group x={x} y={y} opacity={alpha}>
      <Line points={[-r, 0, -r, -4]} stroke="#555" strokeWidth={2} />
      <Line points={[-r, 0, 0, 0]} stroke="#7267C0" strokeWidth={2} />
      <Arc innerRadius={0} outerRadius={r} angle={90} rotation={-90}
        x={-r} y={0} stroke="#7267C0" strokeWidth={1.5}
        fill="rgba(114,103,192,0.12)" />
    </Group>
  );
}

function WindowSymbol({ x, y, alpha = 1 }: { x: number; y: number; alpha?: number }) {
  const w = 20;
  return (
    <Group x={x} y={y} opacity={alpha}>
      <Rect x={-w / 2} y={-4} width={w} height={8} fill="#cce8f4" stroke="#5599cc" strokeWidth={1.5} />
      <Line points={[-w / 2, 0, w / 2, 0]} stroke="#5599cc" strokeWidth={1} />
    </Group>
  );
}

function StairSymbol({ x, y, alpha = 1 }: { x: number; y: number; alpha?: number }) {
  const steps = 4, totalH = 20, w = 16;
  const stepH = totalH / steps;
  return (
    <Group x={x} y={y} opacity={alpha}>
      <Rect x={-w / 2} y={-totalH / 2} width={w} height={totalH} fill="#f0efeb" stroke="#888" strokeWidth={1} />
      {Array.from({ length: steps + 1 }, (_, i) => (
        <Line key={i} points={[-w / 2, -totalH / 2 + i * stepH, w / 2, -totalH / 2 + i * stepH]}
          stroke="#555" strokeWidth={0.8} />
      ))}
      <Text text="▲" x={-4} y={-totalH / 2 + 2} fontSize={8} fill="#555" />
    </Group>
  );
}

function ElevatorSymbol({ x, y, alpha = 1 }: { x: number; y: number; alpha?: number }) {
  const s = 20;
  return (
    <Group x={x} y={y} opacity={alpha}>
      <Rect x={-s / 2} y={-s / 2} width={s} height={s} fill="#e8e8e0" stroke="#888" strokeWidth={1.5} />
      <Text text="⊟" x={-s / 2 + 2} y={-s / 2 + 2} fontSize={14} fill="#444" />
    </Group>
  );
}

function OpeningSymbol({ type, x, y, alpha = 1 }: { type: RoomOpeningType; x: number; y: number; alpha?: number }) {
  if (type === "door")     return <DoorSymbol     x={x} y={y} alpha={alpha} />;
  if (type === "window")   return <WindowSymbol   x={x} y={y} alpha={alpha} />;
  if (type === "stair")    return <StairSymbol     x={x} y={y} alpha={alpha} />;
  return                          <ElevatorSymbol x={x} y={y} alpha={alpha} />;
}

// ── Empty canvas hint ─────────────────────────────────────────────────────────

function EmptyHint({ width, height }: { width: number; height: number }) {
  const cx = width / 2, cy = height / 2;
  return (
    <Group listening={false}>
      <Rect x={cx - 20} y={cy - 52} width={40} height={40} fill="#EEEAE3" cornerRadius={8} />
      <Text x={cx - 20} y={cy - 44} width={40} height={24} text="▭"
        fontSize={18} fill="#C4C4BE" align="center" verticalAlign="middle" />
      <Text x={0} y={cy} width={width}
        text="'방' 또는 '외벽' 도구를 선택하고 캔버스를 클릭해 시작하세요"
        fontSize={14} fill="#A8A8A2" align="center"
        fontFamily="Pretendard, -apple-system, sans-serif" />
      <Text x={0} y={cy + 22} width={width}
        text="점 3개 이상 찍은 뒤 Enter 또는 더블클릭으로 완성합니다"
        fontSize={11} fill="#C4C4BE" align="center"
        fontFamily="Pretendard, -apple-system, sans-serif" />
    </Group>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface Props {
  width: number;
  height: number;
  stageRef?: React.RefObject<unknown>;
}

export default function Canvas2D({ width, height, stageRef }: Props) {
  const activeTool      = useEditorStore(s => s.activeTool);
  const isDrawing       = useEditorStore(s => s.isDrawing);
  const draftPoints     = useEditorStore(s => s.draftPoints);
  const selectedRoomId  = useEditorStore(s => s.project.viewState.selectedRoomId);
  const activeFloorId   = useEditorStore(s => s.project.viewState.activeFloorId);
  const exteriorPolygon = useEditorStore(s => s.project.exteriorPolygon ?? null);
  const addDraftPoint   = useEditorStore(s => s.addDraftPoint);
  const cancelDraft     = useEditorStore(s => s.cancelDraft);
  const commitDraft     = useEditorStore(s => s.commitDraft);
  const selectRoom      = useEditorStore(s => s.selectRoom);
  const updateRoom      = useEditorStore(s => s.updateRoom);
  const addOpening      = useEditorStore(s => s.addOpening);

  const floor    = useActiveFloor();
  const refImage = useRefImage(floor?.referenceImage ?? null);

  // ── Local state ─────────────────────────────────────────────────────────────
  const [cursorPos,  setCursorPos]  = useState<EditorPoint | null>(null);
  const [shiftHeld,  setShiftHeld]  = useState(false);

  // ── Derived ──────────────────────────────────────────────────────────────────
  const isOpeningActive =
    activeTool === "door" || activeTool === "window" ||
    activeTool === "stair" || activeTool === "elevator";

  const isDrawingTool = activeTool === "room" || activeTool === "exterior";

  /** Cursor position after 90° axis snap (only when Shift held + drawing). */
  const snappedCursorPos = useMemo((): EditorPoint | null => {
    if (!cursorPos) return null;
    if (!shiftHeld || !isDrawingTool || draftPoints.length === 0) return cursorPos;
    const last = draftPoints[draftPoints.length - 1];
    return applySnap(cursorPos, last);
  }, [cursorPos, shiftHeld, isDrawingTool, draftPoints]);

  /** Room under cursor — for opening placement preview. */
  const hoverRoomId = useMemo(() => {
    if (!cursorPos || !floor || !isOpeningActive) return null;
    return floor.rooms.find(r => pointInPolygon(cursorPos, r.roomPolygon))?.roomId ?? null;
  }, [cursorPos, floor, isOpeningActive]);

  /** True when cursor is close enough to close exterior polygon. */
  const isNearClose = useMemo(() => {
    if (activeTool !== "exterior" || !isDrawing || draftPoints.length < 3 || !snappedCursorPos) return false;
    const f = draftPoints[0];
    return Math.hypot(snappedCursorPos.x - f.x, snappedCursorPos.y - f.y) < CLOSE_THRESHOLD;
  }, [activeTool, isDrawing, draftPoints, snappedCursorPos]);

  const cursor =
    isDrawingTool ? "crosshair" :
    isOpeningActive ? (hoverRoomId ? "crosshair" : "not-allowed") :
    "default";

  // ── Event handlers ────────────────────────────────────────────────────────

  const handleMouseMove = useCallback((e: KonvaEventObject<MouseEvent>) => {
    const pos = e.target.getStage()?.getPointerPosition();
    if (pos) setCursorPos({ x: pos.x, y: pos.y });
  }, []);

  const handleMouseLeave = useCallback(() => setCursorPos(null), []);

  const handleStageClick = useCallback((e: KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;
    const raw = stage.getPointerPosition();
    if (!raw) return;

    // Apply shift snap when drawing
    const last = draftPoints.length > 0 ? draftPoints[draftPoints.length - 1] : null;
    const pos: EditorPoint = (shiftHeld && last)
      ? applySnap(raw, last)
      : { x: raw.x, y: raw.y };

    if (activeTool === "room") {
      if (e.evt.detail === 2 && draftPoints.length >= 3) { commitDraft(); return; }
      addDraftPoint(pos);
      return;
    }

    if (activeTool === "exterior") {
      if (e.evt.detail === 2 && draftPoints.length >= 3) { commitDraft(); return; }
      // Auto-close: click near first point
      if (draftPoints.length >= 3) {
        const f = draftPoints[0];
        if (Math.hypot(pos.x - f.x, pos.y - f.y) < CLOSE_THRESHOLD) {
          commitDraft();
          return;
        }
      }
      addDraftPoint(pos);
      return;
    }

    if (activeTool === "select") {
      selectRoom(null);
      return;
    }

    if (isOpeningActive && activeFloorId && floor) {
      const target = floor.rooms.find(r => pointInPolygon({ x: raw.x, y: raw.y }, r.roomPolygon));
      if (target) {
        addOpening(activeFloorId, target.roomId, activeTool as RoomOpeningType, raw.x, raw.y);
      }
    }
  }, [activeTool, shiftHeld, draftPoints, addDraftPoint, commitDraft,
      activeFloorId, floor, addOpening, selectRoom, isOpeningActive]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Shift")  setShiftHeld(true);
    if (e.key === "Escape") cancelDraft();
    if (e.key === "Enter" && draftPoints.length >= 3) commitDraft();
  }, [cancelDraft, commitDraft, draftPoints.length]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (e.key === "Shift") setShiftHeld(false);
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup",   handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup",   handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  // ── Derived render values ─────────────────────────────────────────────────

  if (!floor) return null;

  const hasRooms    = floor.rooms.length > 0;
  const hasExterior = exteriorPolygon && exteriorPolygon.length >= 3;
  const draftFlat   = draftPoints.flatMap(p => [p.x, p.y]);
  const selectedRoom = floor.rooms.find(r => r.roomId === selectedRoomId);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Stage
      ref={stageRef as React.RefObject<never>}
      width={width}
      height={height}
      onClick={handleStageClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ cursor }}
    >
      <Layer>
        {/* Background */}
        <Rect x={0} y={0} width={width} height={height} fill="#F7F6F2" />

        {/* Empty state hint */}
        {!hasRooms && !hasExterior && !isDrawing && <EmptyHint width={width} height={height} />}

        {/* Reference image */}
        {refImage && (
          <Image image={refImage} x={0} y={0} width={width} height={height} opacity={0.3} />
        )}

        {/* Exterior polygon (completed) — drawn below rooms */}
        {hasExterior && activeTool !== "exterior" && (
          <Line
            points={exteriorPolygon!.flatMap(p => [p.x, p.y])}
            closed
            fill="rgba(122,107,96,0.05)"
            stroke={EXTERIOR_STROKE}
            strokeWidth={2.5}
            dash={[10, 5]}
            listening={false}
          />
        )}
        {/* Also show while redrawing */}
        {hasExterior && activeTool === "exterior" && !isDrawing && (
          <Line
            points={exteriorPolygon!.flatMap(p => [p.x, p.y])}
            closed
            fill="rgba(122,107,96,0.05)"
            stroke={EXTERIOR_STROKE}
            strokeWidth={2.5}
            dash={[10, 5]}
            opacity={0.35}
            listening={false}
          />
        )}

        {/* Rooms */}
        {floor.rooms.map(room => {
          const isSelected = room.roomId === selectedRoomId;
          const flat = room.roomPolygon.flatMap(p => [p.x, p.y]);
          const lp   = room.labelPosition;
          return (
            <Group
              key={room.roomId}
              onClick={(e) => {
                if (activeTool === "select") { selectRoom(room.roomId); e.cancelBubble = true; }
              }}
            >
              <Line
                points={flat} closed
                fill={isSelected ? ROOM_FILL_SELECTED : ROOM_FILL}
                stroke={isSelected ? ROOM_STROKE_SELECTED : ROOM_STROKE}
                strokeWidth={isSelected ? 2 : 1.5}
                shadowEnabled={isSelected}
                shadowColor={ROOM_STROKE_SELECTED}
                shadowBlur={6}
                shadowOpacity={0.3}
              />
              {lp && (
                <Text
                  x={lp.x - 50} y={lp.y - 8} width={100}
                  text={room.roomName} fontSize={12}
                  fill={isSelected ? "#3a6c5f" : "#555548"}
                  align="center" listening={false}
                />
              )}
              {(room.openings ?? []).map(op => (
                <OpeningSymbol key={op.id} type={op.type} x={op.x} y={op.y} />
              ))}
            </Group>
          );
        })}

        {/* Vertex drag handles for selected room */}
        {activeTool === "select" && selectedRoom && activeFloorId &&
          selectedRoom.roomPolygon.map((pt, idx) => (
            <Circle
              key={`v-${selectedRoom.roomId}-${idx}`}
              x={pt.x} y={pt.y} radius={5}
              fill={VERTEX_FILL} stroke={VERTEX_STROKE} strokeWidth={2}
              draggable
              onMouseEnter={e => { const s = e.target.getStage(); if (s) s.container().style.cursor = "move"; }}
              onMouseLeave={e => { const s = e.target.getStage(); if (s) s.container().style.cursor = cursor; }}
              onDragEnd={e => {
                const newPoly = selectedRoom.roomPolygon.map((p, i) =>
                  i === idx ? { x: e.target.x(), y: e.target.y() } : p
                );
                updateRoom(activeFloorId, selectedRoom.roomId, { roomPolygon: newPoly });
              }}
            />
          ))
        }

        {/* Opening placement preview */}
        {isOpeningActive && cursorPos && hoverRoomId && (
          <OpeningSymbol type={activeTool as RoomOpeningType} x={cursorPos.x} y={cursorPos.y} alpha={0.55} />
        )}

        {/* Draft polygon */}
        {isDrawing && draftPoints.length > 0 && (
          <>
            {/* Placed edges */}
            {draftPoints.length >= 2 && (
              <Line
                points={draftFlat}
                stroke={activeTool === "exterior" ? EXTERIOR_STROKE : DRAFT_COLOR}
                strokeWidth={activeTool === "exterior" ? 2.5 : 2}
                dash={activeTool === "exterior" ? [10, 5] : [6, 3]}
                listening={false}
              />
            )}

            {/* Rubber band — last point → snapped cursor */}
            {snappedCursorPos && (
              <Line
                points={[
                  draftPoints[draftPoints.length - 1].x,
                  draftPoints[draftPoints.length - 1].y,
                  snappedCursorPos.x,
                  snappedCursorPos.y,
                ]}
                stroke={activeTool === "exterior" ? EXTERIOR_STROKE : DRAFT_COLOR}
                strokeWidth={1.5}
                dash={[4, 4]}
                opacity={0.5}
                listening={false}
              />
            )}

            {/* Draft vertices */}
            {draftPoints.map((p, i) => {
              const isFirst = i === 0;
              const closeHighlight = isFirst && isNearClose;
              return (
                <Circle
                  key={i}
                  x={p.x} y={p.y}
                  radius={closeHighlight ? 8 : 4}
                  fill={closeHighlight ? "rgba(74,124,111,0.25)" : (activeTool === "exterior" ? EXTERIOR_STROKE : DRAFT_COLOR)}
                  stroke={activeTool === "exterior" ? EXTERIOR_STROKE : DRAFT_COLOR}
                  strokeWidth={closeHighlight ? 2 : 0}
                  listening={false}
                />
              );
            })}

            {/* Snap guide — show snapped cursor dot when shift held */}
            {shiftHeld && snappedCursorPos && cursorPos &&
              (snappedCursorPos.x !== cursorPos.x || snappedCursorPos.y !== cursorPos.y) && (
              <Circle
                x={snappedCursorPos.x} y={snappedCursorPos.y}
                radius={3}
                fill={DRAFT_COLOR}
                opacity={0.7}
                listening={false}
              />
            )}
          </>
        )}
      </Layer>
    </Stage>
  );
}
