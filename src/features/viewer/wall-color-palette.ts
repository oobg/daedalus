export type WallColorPaletteVariant = "interior" | "exterior";

export interface WallColorPalette {
  color: string;
  emissive: string;
}

const INTERIOR_WALL_COLOR_PALETTE = Object.freeze<WallColorPalette>({
  color: "#B7AEA1",
  emissive: "#8D7F6B",
});

const EXTERIOR_WALL_COLOR_PALETTE = Object.freeze<WallColorPalette>({
  color: "#A79C8D",
  emissive: "#7F7363",
});

export function getWallColorPalette(
  variant: WallColorPaletteVariant = "interior",
): Readonly<WallColorPalette> {
  return variant === "exterior"
    ? EXTERIOR_WALL_COLOR_PALETTE
    : INTERIOR_WALL_COLOR_PALETTE;
}
