export interface HandleHitPoint {
  readonly x: number;
  readonly y: number;
}

export interface VertexHitHandle {
  readonly id: string;
  readonly roomId: string;
  readonly vertexIndex: number;
  readonly position: HandleHitPoint;
}

export interface EdgeHitHandle {
  readonly id: string;
  readonly roomId: string;
  readonly edgeIndex: number;
  readonly position: HandleHitPoint;
}

export type HandleHitTestResult =
  | { readonly kind: 'vertex'; readonly handle: VertexHitHandle }
  | { readonly kind: 'edge'; readonly handle: EdgeHitHandle };

export const DEFAULT_HANDLE_HIT_RADIUS = 8;

export function hitTestRoomHandles(
  point: HandleHitPoint,
  vertexHandles: readonly VertexHitHandle[],
  edgeHandles: readonly EdgeHitHandle[],
  hitRadius = DEFAULT_HANDLE_HIT_RADIUS,
): HandleHitTestResult | null {
  for (const handle of vertexHandles) {
    if (distanceBetween(point, handle.position) <= hitRadius) {
      return { kind: 'vertex', handle };
    }
  }

  for (const handle of edgeHandles) {
    if (distanceBetween(point, handle.position) <= hitRadius) {
      return { kind: 'edge', handle };
    }
  }

  return null;
}

export function findNearestHandle(
  point: HandleHitPoint,
  vertexHandles: readonly VertexHitHandle[],
  edgeHandles: readonly EdgeHitHandle[],
  hitRadius = DEFAULT_HANDLE_HIT_RADIUS,
): HandleHitTestResult | null {
  let nearestResult: HandleHitTestResult | null = null;
  let nearestDistance = hitRadius;

  for (const handle of vertexHandles) {
    const distance = distanceBetween(point, handle.position);
    if (distance <= nearestDistance) {
      nearestDistance = distance;
      nearestResult = { kind: 'vertex', handle };
    }
  }

  if (nearestResult !== null) {
    return nearestResult;
  }

  for (const handle of edgeHandles) {
    const distance = distanceBetween(point, handle.position);
    if (distance <= nearestDistance) {
      nearestDistance = distance;
      nearestResult = { kind: 'edge', handle };
    }
  }

  return nearestResult;
}

function distanceBetween(a: HandleHitPoint, b: HandleHitPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
