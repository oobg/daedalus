import assert from "node:assert/strict";
import test from "node:test";

import { buildFloorGuideSvgExport } from "../src/features/project-export/floor-guide-svg-export.ts";
import type { EditorFloor } from "../src/domain/editor-state.ts";

test("buildFloorGuideSvgExport includes floor height in read-only SVG output metadata", () => {
  const floor: EditorFloor = {
    floorId: "floor-lobby",
    floorName: "Lobby & Public",
    floorHeight: 4.25,
    referenceImage: null,
    rooms: [
      {
        roomId: "room-lobby",
        roomName: "Lobby <Main>",
        roomPolygon: [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 10, y: 8 },
          { x: 0, y: 8 },
          { x: 0, y: 0 },
        ],
        sharedBoundaries: [],
        area: 80,
        labelPosition: { x: 5, y: 4 },
        openings: [],
      },
    ],
  };

  const svg = buildFloorGuideSvgExport(floor);

  assert.match(svg, /data-floor-id="floor-lobby"/);
  assert.match(svg, /data-floor-height="4.25"/);
  assert.match(
    svg,
    /<metadata id="daedalus-floor-metadata">.*"floorHeight":4\.25.*<\/metadata>/,
  );
  assert.match(svg, /Lobby &lt;Main&gt;/);
});
