import type { EditorFloor } from "../../domain/editor-state.ts";

export interface FloorGuideSvgExportOptions {
  width?: number;
  height?: number;
}

const DEFAULT_EXPORT_WIDTH = 800;
const DEFAULT_EXPORT_HEIGHT = 600;

export function buildFloorGuideSvgExport(
  floor: EditorFloor,
  options: FloorGuideSvgExportOptions = {},
): string {
  const width = options.width ?? DEFAULT_EXPORT_WIDTH;
  const height = options.height ?? DEFAULT_EXPORT_HEIGHT;
  const metadata = {
    floorId: floor.floorId,
    floorName: floor.floorName,
    floorHeight: floor.floorHeight,
  };

  const paths = floor.rooms.map((room) => {
    const points =
      room.roomPolygon
        .map((point, index) => (
          `${index === 0 ? "M" : "L"}${point.x.toFixed(1)},${point.y.toFixed(1)}`
        ))
        .join(" ") + " Z";

    return `  <path d="${points}" fill="#e8e8e0" stroke="#888" stroke-width="2"><title>${escapeXmlText(room.roomName)}</title></path>`;
  });

  const labels = floor.rooms.map((room) => {
    const labelPosition = room.labelPosition;
    if (labelPosition == null) {
      return "";
    }

    return `  <text x="${labelPosition.x.toFixed(1)}" y="${labelPosition.y.toFixed(1)}" text-anchor="middle" font-size="12" fill="#444">${escapeXmlText(room.roomName)}</text>`;
  });

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" data-floor-id="${escapeXmlAttribute(floor.floorId)}" data-floor-height="${floor.floorHeight}">`,
    `  <metadata id="daedalus-floor-metadata">${escapeXmlText(JSON.stringify(metadata))}</metadata>`,
    `  <rect width="${width}" height="${height}" fill="#fafaf8"/>`,
    ...paths,
    ...labels,
    `</svg>`,
  ].join("\n");
}

function escapeXmlText(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeXmlAttribute(value: string): string {
  return escapeXmlText(value)
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
