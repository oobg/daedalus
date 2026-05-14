export interface ReferenceImageCanvasLayoutInput {
  canvasWidth: number;
  canvasHeight: number;
  imageWidth: number;
  imageHeight: number;
}

export interface ReferenceImageCanvasLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LockedReferenceImageLayerPolicy {
  layerListening: false;
  imageListening: false;
  imageDraggable: false;
  selectable: false;
  movable: false;
  editableObjectExport: false;
}

export const LOCKED_REFERENCE_IMAGE_LAYER_POLICY: LockedReferenceImageLayerPolicy = {
  layerListening: false,
  imageListening: false,
  imageDraggable: false,
  selectable: false,
  movable: false,
  editableObjectExport: false,
};

export function calculateReferenceImageCanvasLayout(
  input: ReferenceImageCanvasLayoutInput,
): ReferenceImageCanvasLayout | null {
  const { canvasWidth, canvasHeight, imageWidth, imageHeight } = input;

  if (
    !isPositiveFinite(canvasWidth) ||
    !isPositiveFinite(canvasHeight) ||
    !isPositiveFinite(imageWidth) ||
    !isPositiveFinite(imageHeight)
  ) {
    return null;
  }

  const scale = Math.min(canvasWidth / imageWidth, canvasHeight / imageHeight);
  const width = imageWidth * scale;
  const height = imageHeight * scale;

  return {
    x: (canvasWidth - width) / 2,
    y: (canvasHeight - height) / 2,
    width,
    height,
  };
}

function isPositiveFinite(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}
