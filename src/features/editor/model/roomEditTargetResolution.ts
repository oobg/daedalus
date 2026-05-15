import { isPointInRoomPolygon } from './roomHitTesting.ts';
import {
  hitTestRoomHandles,
  DEFAULT_HANDLE_HIT_RADIUS,
  type HandleHitPoint,
  type VertexHitHandle,
  type EdgeHitHandle,
} from './roomVertexHandleHitTesting.ts';

export type { HandleHitPoint, VertexHitHandle, EdgeHitHandle };

export interface EditTargetRoom {
  readonly roomId: string;
  readonly roomPolygon: readonly HandleHitPoint[];
}

export interface EditTargetHandleState {
  readonly vertexHandles: readonly VertexHitHandle[];
  readonly edgeHandles: readonly EdgeHitHandle[];
}

export type EditTargetResult =
  | { readonly kind: 'vertex-handle'; readonly handle: VertexHitHandle }
  | { readonly kind: 'edge-handle'; readonly handle: EdgeHitHandle }
  | { readonly kind: 'room'; readonly room: EditTargetRoom }
  | { readonly kind: 'none' };

export function resolveEditTarget(
  point: HandleHitPoint,
  rooms: readonly EditTargetRoom[],
  handles: EditTargetHandleState,
  hitRadius = DEFAULT_HANDLE_HIT_RADIUS,
): EditTargetResult {
  const handleHit = hitTestRoomHandles(
    point,
    handles.vertexHandles,
    handles.edgeHandles,
    hitRadius,
  );

  if (handleHit !== null) {
    return handleHit.kind === 'vertex'
      ? { kind: 'vertex-handle', handle: handleHit.handle }
      : { kind: 'edge-handle', handle: handleHit.handle };
  }

  for (let index = rooms.length - 1; index >= 0; index -= 1) {
    const room = rooms[index];
    if (isPointInRoomPolygon(point, room.roomPolygon)) {
      return { kind: 'room', room };
    }
  }

  return { kind: 'none' };
}
