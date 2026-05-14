export type ViewerPresentationPresetVariant = "miniatureArchitecture";

export interface ViewerPresentationPreset {
  backgroundColor: string;
  fogColor: string;
  fogNear: number;
  fogFar: number;
  cameraPosition: readonly [number, number, number];
  cameraFov: number;
  pedestalHeight: number;
  pedestalCornerRadius: number;
  pedestalMargin: number;
  showGrid: boolean;
}

const MINIATURE_ARCHITECTURE_PRESENTATION = Object.freeze<ViewerPresentationPreset>({
  backgroundColor: "#F4EFE7",
  fogColor: "#F4EFE7",
  fogNear: 10,
  fogFar: 24,
  cameraPosition: [7.6, 7.8, 8.4],
  cameraFov: 34,
  pedestalHeight: 0.14,
  pedestalCornerRadius: 0.08,
  pedestalMargin: 1.2,
  showGrid: false,
});

export function getViewerPresentationPreset(
  variant: ViewerPresentationPresetVariant = "miniatureArchitecture",
): Readonly<ViewerPresentationPreset> {
  return MINIATURE_ARCHITECTURE_PRESENTATION;
}
