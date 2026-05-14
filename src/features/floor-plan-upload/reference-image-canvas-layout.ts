export interface ReferenceImageCanvasLayoutInput {
  floorSpaceWidth: number;
  floorSpaceHeight: number;
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
  editable: false;
  selectable: false;
  movable: false;
  interceptsPointerEvents: false;
  editableObjectExport: false;
}

export const LOCKED_REFERENCE_IMAGE_LAYER_POLICY: LockedReferenceImageLayerPolicy = {
  layerListening: false,
  imageListening: false,
  imageDraggable: false,
  editable: false,
  selectable: false,
  movable: false,
  interceptsPointerEvents: false,
  editableObjectExport: false,
};

export const DEFAULT_EDITOR_FLOOR_SPACE = {
  width: 800,
  height: 600,
} as const;

export function calculateReferenceImageCanvasLayout(
  input: ReferenceImageCanvasLayoutInput,
): ReferenceImageCanvasLayout | null {
  const { floorSpaceWidth, floorSpaceHeight, imageWidth, imageHeight } = input;

  if (
    !isPositiveFinite(floorSpaceWidth) ||
    !isPositiveFinite(floorSpaceHeight) ||
    !isPositiveFinite(imageWidth) ||
    !isPositiveFinite(imageHeight)
  ) {
    return null;
  }

  const scale = Math.min(floorSpaceWidth / imageWidth, floorSpaceHeight / imageHeight);
  const width = imageWidth * scale;
  const height = imageHeight * scale;

  return {
    x: (floorSpaceWidth - width) / 2,
    y: (floorSpaceHeight - height) / 2,
    width,
    height,
  };
}

function isPositiveFinite(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}
