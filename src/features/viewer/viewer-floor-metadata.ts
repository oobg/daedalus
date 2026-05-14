export interface ViewerFloorMetadataInput {
  floorHeight: number;
  roomCount: number;
}

export function formatViewerFloorMetadata({
  floorHeight,
  roomCount,
}: ViewerFloorMetadataInput): string {
  return `층고 ${formatFloorHeight(floorHeight)}m · ${roomCount}실`;
}

function formatFloorHeight(floorHeight: number): string {
  return Number.isInteger(floorHeight) ? String(floorHeight) : String(floorHeight);
}
