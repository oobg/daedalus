export interface EditorPoint {
  x: number;
  y: number;
}

export interface EditorProjectAsset {
  assetId: string;
  assetType: "reference-image" | "icon" | "texture" | "document";
  floorId: string | null;
  fileName: string;
  mimeType: string;
  size: number;
  storageKey: string;
  assetRef: string;
}

export interface EditorProjectAnnotation {
  annotationId: string;
  floorId: string;
  annotationType: "label" | "note" | "arrow" | "warning";
  text: string;
  targetRoomId: string | null;
  position: EditorPoint;
  color: string;
  isVisible: boolean;
}

export interface EditorProjectEditorConfig {
  selectedTool: "select" | "room" | "opening" | "annotation";
  snapToGrid: boolean;
  gridSize: number;
  showGrid: boolean;
  showReferenceImages: boolean;
  showRoomLabels: boolean;
}

export interface EditorProjectNonGeometryData {
  assets?: EditorProjectAsset[];
  annotations?: EditorProjectAnnotation[];
  editorConfig?: Partial<EditorProjectEditorConfig>;
}

export interface SerializedPoint {
  x: number;
  y: number;
}

export interface SerializedProjectAsset {
  assetId: string;
  assetType: "reference-image" | "icon" | "texture" | "document";
  floorId: string | null;
  fileName: string;
  mimeType: string;
  size: number;
  storageKey: string;
  assetRef: string;
}

export interface SerializedProjectAnnotation {
  annotationId: string;
  floorId: string;
  annotationType: "label" | "note" | "arrow" | "warning";
  text: string;
  targetRoomId: string | null;
  position: SerializedPoint;
  color: string;
  isVisible: boolean;
}

export interface SerializedProjectEditorConfig {
  selectedTool: "select" | "room" | "opening" | "annotation";
  snapToGrid: boolean;
  gridSize: number;
  showGrid: boolean;
  showReferenceImages: boolean;
  showRoomLabels: boolean;
}

export interface SerializedProjectNonGeometryData {
  assets: SerializedProjectAsset[];
  annotations: SerializedProjectAnnotation[];
  editorConfig: SerializedProjectEditorConfig;
}

export const DEFAULT_SERIALIZED_PROJECT_EDITOR_CONFIG: SerializedProjectEditorConfig =
  {
    selectedTool: "select",
    snapToGrid: false,
    gridSize: 16,
    showGrid: true,
    showReferenceImages: true,
    showRoomLabels: true,
  };

export function serializeProjectNonGeometryData(
  data: EditorProjectNonGeometryData,
): SerializedProjectNonGeometryData {
  return {
    assets: (data.assets ?? []).map(serializeAsset),
    annotations: (data.annotations ?? []).map(serializeAnnotation),
    editorConfig: serializeEditorConfig(data.editorConfig),
  };
}

export function restoreProjectNonGeometryData(
  data: SerializedProjectNonGeometryData,
): Required<EditorProjectNonGeometryData> {
  return {
    assets: data.assets.map(restoreAsset),
    annotations: data.annotations.map(restoreAnnotation),
    editorConfig: restoreEditorConfig(data.editorConfig),
  };
}

function serializeAsset(asset: EditorProjectAsset): SerializedProjectAsset {
  return {
    assetId: asset.assetId,
    assetType: asset.assetType,
    floorId: asset.floorId,
    fileName: asset.fileName,
    mimeType: asset.mimeType,
    size: asset.size,
    storageKey: asset.storageKey,
    assetRef: asset.assetRef,
  };
}

function serializeAnnotation(
  annotation: EditorProjectAnnotation,
): SerializedProjectAnnotation {
  return {
    annotationId: annotation.annotationId,
    floorId: annotation.floorId,
    annotationType: annotation.annotationType,
    text: annotation.text,
    targetRoomId: annotation.targetRoomId,
    position: serializePoint(annotation.position),
    color: annotation.color,
    isVisible: annotation.isVisible,
  };
}

function serializeEditorConfig(
  editorConfig: Partial<EditorProjectEditorConfig> | undefined,
): SerializedProjectEditorConfig {
  return {
    selectedTool:
      editorConfig?.selectedTool ??
      DEFAULT_SERIALIZED_PROJECT_EDITOR_CONFIG.selectedTool,
    snapToGrid:
      editorConfig?.snapToGrid ??
      DEFAULT_SERIALIZED_PROJECT_EDITOR_CONFIG.snapToGrid,
    gridSize:
      editorConfig?.gridSize ?? DEFAULT_SERIALIZED_PROJECT_EDITOR_CONFIG.gridSize,
    showGrid:
      editorConfig?.showGrid ?? DEFAULT_SERIALIZED_PROJECT_EDITOR_CONFIG.showGrid,
    showReferenceImages:
      editorConfig?.showReferenceImages ??
      DEFAULT_SERIALIZED_PROJECT_EDITOR_CONFIG.showReferenceImages,
    showRoomLabels:
      editorConfig?.showRoomLabels ??
      DEFAULT_SERIALIZED_PROJECT_EDITOR_CONFIG.showRoomLabels,
  };
}

function serializePoint(point: EditorPoint): SerializedPoint {
  return {
    x: point.x,
    y: point.y,
  };
}

function restoreAsset(asset: SerializedProjectAsset): EditorProjectAsset {
  return {
    assetId: asset.assetId,
    assetType: asset.assetType,
    floorId: asset.floorId,
    fileName: asset.fileName,
    mimeType: asset.mimeType,
    size: asset.size,
    storageKey: asset.storageKey,
    assetRef: asset.assetRef,
  };
}

function restoreAnnotation(
  annotation: SerializedProjectAnnotation,
): EditorProjectAnnotation {
  return {
    annotationId: annotation.annotationId,
    floorId: annotation.floorId,
    annotationType: annotation.annotationType,
    text: annotation.text,
    targetRoomId: annotation.targetRoomId,
    position: restorePoint(annotation.position),
    color: annotation.color,
    isVisible: annotation.isVisible,
  };
}

function restoreEditorConfig(
  editorConfig: SerializedProjectEditorConfig,
): EditorProjectEditorConfig {
  return {
    selectedTool: editorConfig.selectedTool,
    snapToGrid: editorConfig.snapToGrid,
    gridSize: editorConfig.gridSize,
    showGrid: editorConfig.showGrid,
    showReferenceImages: editorConfig.showReferenceImages,
    showRoomLabels: editorConfig.showRoomLabels,
  };
}

function restorePoint(point: SerializedPoint): EditorPoint {
  return {
    x: point.x,
    y: point.y,
  };
}
