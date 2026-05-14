export function parseFloorHeightEditorValue(value: string): number | null {
  const trimmedValue = value.trim();

  if (trimmedValue.length === 0) {
    return null;
  }

  const floorHeight = Number(trimmedValue);

  return Number.isFinite(floorHeight) && floorHeight > 0 ? floorHeight : null;
}

export function formatFloorHeightEditorValue(floorHeight: number): string {
  return Number.isFinite(floorHeight) && floorHeight > 0 ? String(floorHeight) : "";
}
