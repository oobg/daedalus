export type ViewerLightingConfigurationVariant = "miniatureArchitecture";

export interface AmbientViewerLightConfiguration {
  type: "ambient";
  color: string;
  intensity: number;
  colorTemperatureKelvin: number;
}

export interface DirectionalViewerLightConfiguration {
  type: "directional";
  color: string;
  intensity: number;
  colorTemperatureKelvin: number;
  position: readonly [number, number, number];
  castShadow: boolean;
  shadowMapSize: readonly [number, number];
  shadowCameraNear: number;
  shadowCameraFar: number;
  shadowBias: number;
}

export interface HemisphereViewerLightConfiguration {
  type: "hemisphere";
  skyColor: string;
  groundColor: string;
  intensity: number;
  colorTemperatureKelvin: number;
  position: readonly [number, number, number];
}

export interface ViewerLightingConfiguration {
  ambientLight: Readonly<AmbientViewerLightConfiguration>;
  bounceLight: Readonly<HemisphereViewerLightConfiguration>;
  diffuseLight: Readonly<DirectionalViewerLightConfiguration>;
}

const MINIATURE_ARCHITECTURE_LIGHTING_CONFIGURATION = Object.freeze<ViewerLightingConfiguration>({
  ambientLight: Object.freeze<AmbientViewerLightConfiguration>({
    type: "ambient",
    color: "#FFF8F0",
    intensity: 0.85,
    colorTemperatureKelvin: 4300,
  }),
  bounceLight: Object.freeze<HemisphereViewerLightConfiguration>({
    type: "hemisphere",
    skyColor: "#F6E6D6",
    groundColor: "#C9AE8F",
    intensity: 0.28,
    colorTemperatureKelvin: 3600,
    position: [0, 5.5, 0],
  }),
  diffuseLight: Object.freeze<DirectionalViewerLightConfiguration>({
    type: "directional",
    color: "#F7E7D2",
    intensity: 0.45,
    colorTemperatureKelvin: 3900,
    position: [4, 12, 6],
    castShadow: true,
    shadowMapSize: [1024, 1024],
    shadowCameraNear: 0.5,
    shadowCameraFar: 40,
    shadowBias: -0.001,
  }),
});

export function getViewerLightingConfiguration(
  variant: ViewerLightingConfigurationVariant = "miniatureArchitecture",
): Readonly<ViewerLightingConfiguration> {
  return MINIATURE_ARCHITECTURE_LIGHTING_CONFIGURATION;
}
