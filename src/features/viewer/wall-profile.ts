import * as THREE from "three";

const MIN_SEGMENT_LENGTH = 0.001;
const MIN_CURVE_SEGMENTS = 2;

export interface WallProfileOptions {
  thickness: number;
  height: number;
  topEdgeRadius?: number;
  curveSegments?: number;
}

export interface WallProfilePoint {
  x: number;
  y: number;
}

export function createWallProfileOutline(
  options: WallProfileOptions,
): WallProfilePoint[] {
  const thickness = validatePositiveDimension(options.thickness, "thickness");
  const height = validatePositiveDimension(options.height, "height");
  const radius = normalizeTopEdgeRadius(options.topEdgeRadius ?? 0, thickness, height);
  const curveSegments = normalizeCurveSegments(options.curveSegments ?? 6);
  const halfThickness = thickness / 2;

  if (radius === 0) {
    return [
      { x: -halfThickness, y: 0 },
      { x: halfThickness, y: 0 },
      { x: halfThickness, y: height },
      { x: -halfThickness, y: height },
    ];
  }

  const outline: WallProfilePoint[] = [
    { x: -halfThickness, y: 0 },
    { x: halfThickness, y: 0 },
    { x: halfThickness, y: height - radius },
  ];

  appendArcPoints(outline, {
    centerX: halfThickness - radius,
    centerY: height - radius,
    radius,
    startAngle: 0,
    endAngle: Math.PI / 2,
    steps: curveSegments,
  });

  outline.push({ x: -halfThickness + radius, y: height });

  appendArcPoints(outline, {
    centerX: -halfThickness + radius,
    centerY: height - radius,
    radius,
    startAngle: Math.PI / 2,
    endAngle: Math.PI,
    steps: curveSegments,
  });

  outline.push({ x: -halfThickness, y: height - radius });

  return dedupeSequentialPoints(outline);
}

export function createWallProfileShape(options: WallProfileOptions): THREE.Shape {
  const outline = createWallProfileOutline(options);
  const shape = new THREE.Shape();

  shape.moveTo(outline[0].x, outline[0].y);

  for (let index = 1; index < outline.length; index += 1) {
    const point = outline[index];
    shape.lineTo(point.x, point.y);
  }

  shape.closePath();

  return shape;
}

export function createWallSegmentGeometry(
  segmentLength: number,
  options: WallProfileOptions,
): THREE.ExtrudeGeometry {
  if (!Number.isFinite(segmentLength) || segmentLength <= MIN_SEGMENT_LENGTH) {
    throw new Error("Wall segment length must be a finite value greater than 0.001.");
  }

  const geometry = new THREE.ExtrudeGeometry(createWallProfileShape(options), {
    depth: segmentLength,
    steps: 1,
    bevelEnabled: false,
    curveSegments: normalizeCurveSegments(options.curveSegments ?? 6),
  });

  geometry.translate(0, 0, -segmentLength / 2);

  return geometry;
}

function appendArcPoints(
  target: WallProfilePoint[],
  options: {
    centerX: number;
    centerY: number;
    radius: number;
    startAngle: number;
    endAngle: number;
    steps: number;
  },
): void {
  const { centerX, centerY, radius, startAngle, endAngle, steps } = options;

  for (let step = 1; step <= steps; step += 1) {
    const t = step / steps;
    const angle = startAngle + (endAngle - startAngle) * t;

    target.push({
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
    });
  }
}

function dedupeSequentialPoints(points: WallProfilePoint[]): WallProfilePoint[] {
  return points.filter((point, index) => {
    if (index === 0) {
      return true;
    }

    const previous = points[index - 1];

    return (
      Math.abs(previous.x - point.x) > 1e-6 || Math.abs(previous.y - point.y) > 1e-6
    );
  });
}

function validatePositiveDimension(value: number, label: string): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`Wall ${label} must be a finite value greater than 0.`);
  }

  return value;
}

function normalizeTopEdgeRadius(
  value: number,
  thickness: number,
  height: number,
): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error("Wall top edge radius must be a finite value greater than or equal to 0.");
  }

  return Math.min(value, Math.min(thickness / 2, height));
}

function normalizeCurveSegments(value: number): number {
  if (!Number.isFinite(value) || value < MIN_CURVE_SEGMENTS) {
    throw new Error("Wall curve segments must be a finite integer greater than or equal to 2.");
  }

  return Math.floor(value);
}
