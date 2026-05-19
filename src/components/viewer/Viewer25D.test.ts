import assert from "node:assert/strict";
import test from "node:test";
import type React from "react";

type HtmlHandleProps = { position: [number, number, number]; children?: React.ReactElement };
type ButtonProps = Record<string, unknown>;

function handleId(el: React.ReactElement): string | undefined {
  const htmlProps = el.props as HtmlHandleProps;
  const btn = htmlProps.children;
  return btn ? (btn.props as ButtonProps)["data-world-handle-id"] as string : undefined;
}

function handlePos(el: React.ReactElement): [number, number, number] {
  return (el.props as HtmlHandleProps).position;
}

import { createEditorProject } from "../../domain/editor-state.ts";
import {
  DEFAULT_WALL_HEIGHT_SCALE,
  inspectWallTopology,
  resolveViewer25DFloorRenderPlacements,
} from "./viewer25dGeometry.ts";
import {
  createViewer25DTopDownHandleOverlayScene,
  mountViewer25DTopDownHandleOverlayScene,
} from "./viewer25dTopDownHandleOverlayScene.ts";
import {
  createViewer25DSceneGraph,
  resolveViewer25DSceneGeometrySource,
} from "./viewer25dSceneGraph.ts";
import { collectWorldSpaceHtmlHandleElements } from "./worldSpaceEditHandles.ts";
import { createEditorStore } from "../../store/createEditorStore.ts";
import { resolveViewer25DSharedSceneInstance } from "./viewer25dSharedScene.ts";
import {
  createTopDownWallBandPath as createTopDownWallBandRenderPath,
  createTopDownWallBandShape,
} from "../../features/viewer/top-down-wall-band.ts";
import { createWallJunctionAssembly } from "../../features/viewer/wall-junction-assembly.ts";
import { ShapeUtils } from "three";

function normalizeExtractedLoop(
  points: readonly { x: number; y: number }[],
): { x: number; y: number }[] {
  if (points.length === 0) {
    return [];
  }

  const normalized = points.map((point) => ({
    x: Number(point.x.toFixed(6)),
    y: Number(point.y.toFixed(6)),
  }));

  const firstPoint = normalized[0];
  const lastPoint = normalized.at(-1);

  if (
    lastPoint != null
    && firstPoint.x === lastPoint.x
    && firstPoint.y === lastPoint.y
  ) {
    normalized.pop();
  }

  return normalized;
}

function normalizeLoopStart(
  points: readonly { x: number; y: number }[],
): { x: number; y: number }[] {
  if (points.length === 0) {
    return [];
  }

  let startIndex = 0;

  for (let index = 1; index < points.length; index += 1) {
    const candidate = points[index];
    const current = points[startIndex];

    if (
      candidate.x < current.x ||
      (candidate.x === current.x && candidate.y < current.y)
    ) {
      startIndex = index;
    }
  }

  return points.map((_, index) => points[(startIndex + index) % points.length]);
}

function reverseLoop(
  points: readonly { x: number; y: number }[],
): { x: number; y: number }[] {
  if (points.length <= 1) {
    return [...points];
  }

  return [points[0], ...points.slice(1).reverse()];
}

function isPointOnSegment(
  point: { x: number; y: number },
  start: { x: number; y: number },
  end: { x: number; y: number },
): boolean {
  const cross =
    (point.y - start.y) * (end.x - start.x) -
    (point.x - start.x) * (end.y - start.y);

  if (Math.abs(cross) > 1e-6) {
    return false;
  }

  const dot =
    (point.x - start.x) * (end.x - start.x) +
    (point.y - start.y) * (end.y - start.y);

  if (dot < -1e-6) {
    return false;
  }

  const squaredLength =
    (end.x - start.x) * (end.x - start.x) +
    (end.y - start.y) * (end.y - start.y);

  return dot <= squaredLength + 1e-6;
}

function isPointInsideOrOnPolygon(
  point: { x: number; y: number },
  polygon: readonly { x: number; y: number }[],
): boolean {
  let isInside = false;

  for (
    let index = 0, previousIndex = polygon.length - 1;
    index < polygon.length;
    previousIndex = index, index += 1
  ) {
    const start = polygon[previousIndex];
    const end = polygon[index];

    if (isPointOnSegment(point, start, end)) {
      return true;
    }

    const crossesScanline = (start.y > point.y) !== (end.y > point.y);

    if (!crossesScanline) {
      continue;
    }

    const intersectionX =
      ((end.x - start.x) * (point.y - start.y)) / (end.y - start.y) +
      start.x;

    if (intersectionX >= point.x - 1e-6) {
      isInside = !isInside;
    }
  }

  return isInside;
}

function assertLoopMatchesOutline(
  actual: readonly { x: number; y: number }[],
  expected: readonly { x: number; y: number }[],
): void {
  const normalizedActual = normalizeLoopStart(actual);
  const normalizedExpected = normalizeLoopStart(expected);

  try {
    assert.deepEqual(normalizedActual, normalizedExpected);
  } catch {
    assert.deepEqual(normalizedActual, normalizeLoopStart(reverseLoop(expected)));
  }
}

test("top-down wall band path preserves the room outline and returns as one continuous filled draw path", () => {
  const wallBand = createTopDownWallBandRenderPath(
    [
      { x: 0, y: 0 },
      { x: 4.2, y: 0 },
      { x: 4.2, y: 3.1 },
      { x: 0, y: 3.1 },
      { x: 0, y: 0 },
    ],
    0.045,
  );

  assert.ok(wallBand);
  assert.deepEqual(wallBand.outerOutline, [
    { x: 0, y: 0 },
    { x: 4.2, y: 0 },
    { x: 4.2, y: 3.1 },
    { x: 0, y: 3.1 },
  ]);
  assert.deepEqual(
    wallBand.drawPath,
    [...wallBand.outerOutline, ...[...wallBand.innerContour].reverse()],
  );
});

test("Viewer25D edit-mode quadrilateral wall render produces one continuous polygon wall band with no cross artifact", () => {
  const wallBand = createTopDownWallBandRenderPath(
    [
      { x: 0, y: 0 },
      { x: 4.2, y: 0 },
      { x: 4.2, y: 3.1 },
      { x: 0, y: 3.1 },
      { x: 0, y: 0 },
    ],
    0.045,
  );

  assert.ok(wallBand);
  assert.deepEqual(wallBand.outerOutline, [
    { x: 0, y: 0 },
    { x: 4.2, y: 0 },
    { x: 4.2, y: 3.1 },
    { x: 0, y: 3.1 },
  ]);

  const topology = inspectWallTopology(wallBand.drawPath);

  assert.equal(topology.isContinuous, true);
  assert.equal(topology.isSelfIntersecting, false);

  const shape = createTopDownWallBandShape(wallBand);
  assert.ok(shape);
  const extractedPoints = shape.extractPoints(0);

  assert.equal(shape.holes.length, 1);
  assert.deepEqual(normalizeExtractedLoop(extractedPoints.shape), [
    { x: 0, y: 0 },
    { x: 4.2, y: 0 },
    { x: 4.2, y: -3.1 },
    { x: 0, y: -3.1 },
  ]);
  assert.deepEqual(
    normalizeExtractedLoop(extractedPoints.holes[0] ?? []),
    normalizeExtractedLoop(
      [...wallBand.innerContour].reverse().map((point) => ({
        x: point.x,
        y: -point.y,
      })),
    ),
  );
  assert.equal(
    ShapeUtils.isClockWise(extractedPoints.shape),
    true,
    "Expected the edit-mode wall to render as a single closed outer polygon band.",
  );
  assert.equal(
    ShapeUtils.isClockWise(extractedPoints.holes[0] ?? []),
    false,
    "Expected the inward wall thickness to remain a single interior hole instead of crossing the room center.",
  );
});

test("top-down wall band shape uses one outer polygon with one interior hole instead of intersecting wall strips", () => {
  const wallBand = createTopDownWallBandRenderPath(
    [
      { x: 0, y: 0 },
      { x: 4.8, y: 0 },
      { x: 4.8, y: 1.4 },
      { x: 2.6, y: 1.4 },
      { x: 2.6, y: 3.6 },
      { x: 0, y: 3.6 },
    ],
    0.045,
  );

  assert.ok(wallBand);

  const shape = createTopDownWallBandShape(wallBand);
  assert.ok(shape);
  const extractedPoints = shape.extractPoints(0);

  assert.equal(shape.holes.length, 1);
  assert.equal(
    ShapeUtils.isClockWise(extractedPoints.shape),
    true,
    "Expected the edit-mode wall fill to be represented by a single closed outer ring.",
  );
  assert.equal(
    ShapeUtils.isClockWise(extractedPoints.holes[0] ?? []),
    false,
    "Expected the interior thickness cutout to remain a single inward hole.",
  );
});

test("Viewer25D edit-mode wall band triangulation stays inside a skew quadrilateral shell without any cross-band bridge", () => {
  const wallBand = createTopDownWallBandRenderPath(
    [
      { x: 0.4, y: 0.2 },
      { x: 5.1, y: 0.7 },
      { x: 4.4, y: 3.9 },
      { x: 0.1, y: 3.2 },
      { x: 0.4, y: 0.2 },
    ],
    0.045,
  );

  assert.ok(wallBand);

  const shape = createTopDownWallBandShape(wallBand);
  assert.ok(shape);
  const extractedPoints = shape.extractPoints(0);
  const triangulationVertices = [
    ...normalizeExtractedLoop(extractedPoints.shape),
    ...extractedPoints.holes.flatMap((hole) => normalizeExtractedLoop(hole)),
  ];
  const triangles = ShapeUtils.triangulateShape(
    extractedPoints.shape,
    extractedPoints.holes,
  );

  assert.equal(triangles.length > 0, true);

  for (const triangle of triangles) {
    const vertices = triangle.map((index) => triangulationVertices[index]);
    const centroid = {
      x: (vertices[0].x + vertices[1].x + vertices[2].x) / 3,
      y: (vertices[0].y + vertices[1].y + vertices[2].y) / 3,
    };

    assert.equal(
      isPointInsideOrOnPolygon(centroid, extractedPoints.shape),
      true,
      "Expected every rendered wall-band triangle to remain inside the preserved outer quadrilateral outline.",
    );
    assert.equal(
      isPointInsideOrOnPolygon(centroid, extractedPoints.holes[0] ?? []),
      false,
      "Expected no rendered wall-band triangle centroid to bridge across the inward hole into a cross-shaped artifact.",
    );
  }
});

test("top-down wall band path accepts a generated closed quadrilateral wall band without reordering its closed preview loop", () => {
  const assembly = createWallJunctionAssembly(
    [
      { x: 0, y: 0 },
      { x: 4.2, y: 0 },
      { x: 4.2, y: 3.1 },
      { x: 0, y: 3.1 },
      { x: 0, y: 0 },
    ],
    {
      baseOffset: 0.014,
      curveSegments: 2,
      height: 1,
      minimumWallCornerRadius: 0.18,
      thickness: 0.045,
      topEdgeRadius: 0,
      wallCornerRadiusRatio: 3.5,
      wallCornerSegments: 2,
      wallCornerStyle: "rounded",
    },
  );

  assert.ok(assembly.wallBand);

  const wallBand = createTopDownWallBandRenderPath(assembly.wallBand);

  assert.ok(wallBand);
  assert.deepEqual(wallBand.outerOutline, assembly.wallBand.outerOutline);
  assert.deepEqual(wallBand.innerContour, assembly.wallBand.innerContour);
  assert.deepEqual(wallBand.drawPath, assembly.wallBand.stitchedLoop);

  const topology = inspectWallTopology(wallBand.drawPath);

  assert.equal(topology.isContinuous, true);
  assert.equal(topology.isSelfIntersecting, false);
});

test("top-down wall band shape preserves the original quadrilateral outline in 2.5D preview for clockwise closed polygons", () => {
  const wallBand = createTopDownWallBandRenderPath(
    [
      { x: 0, y: 0 },
      { x: 0, y: 3.1 },
      { x: 4.2, y: 3.1 },
      { x: 4.2, y: 0 },
      { x: 0, y: 0 },
    ],
    0.045,
  );

  assert.ok(wallBand);
  assert.deepEqual(wallBand.outerOutline, [
    { x: 0, y: 0 },
    { x: 0, y: 3.1 },
    { x: 4.2, y: 3.1 },
    { x: 4.2, y: 0 },
  ]);

  const shape = createTopDownWallBandShape(wallBand);
  assert.ok(shape);
  const extractedPoints = shape.extractPoints(0);
  assertLoopMatchesOutline(normalizeExtractedLoop(extractedPoints.shape), [
    { x: 0, y: -3.1 },
    { x: 4.2, y: -3.1 },
    { x: 4.2, y: 0 },
    { x: 0, y: 0 },
  ]);
  assert.equal(
    ShapeUtils.isClockWise(extractedPoints.shape),
    true,
    "Expected the 2.5D preview shape to normalize projected outer winding without changing the quadrilateral outline.",
  );
  assert.equal(
    ShapeUtils.isClockWise(extractedPoints.holes[0] ?? []),
    false,
    "Expected the inward wall cutout to remain an interior hole for clockwise quadrilateral outlines.",
  );
});

test("top-down wall band shape rejects a quadrilateral preview band when its inner contour escapes the preserved outer outline", () => {
  const shape = createTopDownWallBandShape({
    outerOutline: [
      { x: 0, y: 0 },
      { x: 4.2, y: 0 },
      { x: 4.2, y: 3.1 },
      { x: 0, y: 3.1 },
    ],
    innerContour: [
      { x: 4.6, y: 0.8 },
      { x: 5.3, y: 0.8 },
      { x: 5.3, y: 2.2 },
      { x: 4.6, y: 2.2 },
    ],
    drawPath: [
      { x: 0, y: 0 },
      { x: 4.2, y: 0 },
      { x: 4.2, y: 3.1 },
      { x: 0, y: 3.1 },
      { x: 4.6, y: 2.2 },
      { x: 5.3, y: 2.2 },
      { x: 5.3, y: 0.8 },
      { x: 4.6, y: 0.8 },
    ],
  });

  assert.equal(
    shape,
    null,
    "Expected the 2.5D preview renderer to reject wall bands whose inward contour would render outside the quadrilateral outline.",
  );
});

test("Viewer25D top-down overlay scene mounts Html edit handles for the shared canvas scene path", () => {
  const project = createEditorProject({
    projectId: "project-top-down-scene",
    floors: [
      {
        floorId: "floor-ground",
        floorName: "Ground",
        floorHeight: 3.2,
        rooms: [
          {
            roomId: "room-lobby",
            roomName: "Lobby",
            roomPolygon: [
              { x: 0, y: 0 },
              { x: 400, y: 0 },
              { x: 400, y: 300 },
              { x: 0, y: 300 },
            ],
            openings: [
              {
                id: "opening-window-east",
                type: "window",
                x: 400,
                y: 120,
                angle: Math.PI / 2,
              },
            ],
          },
        ],
        guideObjects: [
          {
            guideObjectId: "guide-desk",
            guideObjectType: "furniture",
            floorId: "floor-ground",
            roomId: "room-lobby",
            name: "Desk",
            position: { x: 180, y: 140 },
          },
        ],
        verticalConnectors: [
          {
            connectorId: "connector-core",
            connectorType: "stair",
            roomId: "room-lobby",
            targetFloorId: "floor-upper",
            position: { x: 260, y: 160 },
          },
        ],
      },
    ],
    exteriorPolygon: [
      { x: -100, y: -100 },
      { x: 500, y: -100 },
      { x: 500, y: 400 },
    ],
    viewState: {
      activeFloorId: "floor-ground",
      selectedRoomId: "room-lobby",
    },
  });
  const floorPlacements = resolveViewer25DFloorRenderPlacements(
    project.floors,
    DEFAULT_WALL_HEIGHT_SCALE,
  );
  const sceneTree = createViewer25DTopDownHandleOverlayScene({
    geometrySource: resolveViewer25DSceneGeometrySource({
      sceneGraph: createViewer25DSceneGraph({
        floors: project.floors,
        activeFloorId: project.viewState.activeFloorId,
        exteriorPolygon: project.exteriorPolygon,
        exteriorEdgeOpenings: project.exteriorEdgeOpenings,
        floorRenderOffsets: floorPlacements.map(
          (placement) => placement.renderVerticalOffset ?? 0,
        ),
      }),
      cameraMode: "top-down-orthographic",
    }),
    cameraMode: "top-down-orthographic",
  });
  const htmlHandles = collectWorldSpaceHtmlHandleElements(sceneTree);

  assert.deepEqual(
    htmlHandles.map(handleId),
    [
      "floor-ground:room-lobby:vertex:0",
      "floor-ground:room-lobby:vertex:1",
      "floor-ground:room-lobby:vertex:2",
      "floor-ground:room-lobby:vertex:3",
      "floor-ground:room-lobby:opening:opening-window-east",
      "floor-ground:guide-object:guide-desk",
      "floor-ground:vertical-connector:connector-core",
      "exterior:vertex:0",
      "exterior:vertex:1",
      "exterior:vertex:2",
    ],
  );
});

test("Viewer25D top-down overlay scene updates mounted Html handles when shared scene state changes after mount", () => {
  const store = createEditorStore({ storage: null });

  store.getState().replaceProject(
    createEditorProject({
      projectId: "project-top-down-overlay-sync",
      floors: [
        {
          floorId: "floor-ground",
          floorName: "Ground",
          floorHeight: 3.2,
          rooms: [
            {
              roomId: "room-lobby",
              roomName: "Lobby",
              roomPolygon: [
                { x: 0, y: 0 },
                { x: 400, y: 0 },
                { x: 400, y: 300 },
                { x: 0, y: 300 },
              ],
              openings: [
                {
                  id: "opening-door-east",
                  type: "door",
                  x: 400,
                  y: 140,
                  angle: Math.PI / 2,
                },
              ],
            },
          ],
        },
      ],
      exteriorPolygon: [
        { x: -100, y: -100 },
        { x: 500, y: -100 },
        { x: 500, y: 400 },
      ],
      viewState: {
        activeFloorId: "floor-ground",
        selectedRoomId: "room-lobby",
      },
    }),
  );

  const floorRenderOffsets = resolveViewer25DFloorRenderPlacements(
    store.getState().project.floors,
    DEFAULT_WALL_HEIGHT_SCALE,
  ).map((placement) => placement.renderVerticalOffset ?? 0);
  const emittedScenes = [];
  const mountedOverlayScene = mountViewer25DTopDownHandleOverlayScene({
    store,
    cameraMode: "top-down-orthographic",
    floorRenderOffsets,
    onSceneChange: (scene) => {
      emittedScenes.push(scene);
    },
  });

  assert.equal(emittedScenes.length, 1);
  const firstHandle = collectWorldSpaceHtmlHandleElements(mountedOverlayScene.getScene())[0];
  assert.ok(firstHandle);
  assert.equal(handlePos(firstHandle)[0], 0);
  assert.equal(
    collectWorldSpaceHtmlHandleElements(mountedOverlayScene.getScene()).some(
      (handle) => handleId(handle) === "floor-ground:room-lobby:opening:opening-door-east",
    ),
    true,
  );

  store.getState().updateRoom("floor-ground", "room-lobby", {
    roomPolygon: [
      { x: 120, y: 40 },
      { x: 400, y: 0 },
      { x: 400, y: 300 },
      { x: 0, y: 300 },
    ],
    openings: [],
  });

  assert.equal(emittedScenes.length, 2);

  const updatedHandles = collectWorldSpaceHtmlHandleElements(
    mountedOverlayScene.getScene(),
  );
  const updatedVertexHandle = updatedHandles.find(
    (handle) => handleId(handle) === "floor-ground:room-lobby:vertex:0",
  );

  assert.ok(updatedVertexHandle);
  assert.deepEqual(handlePos(updatedVertexHandle), [1.2, 0.02, 0.4]);
  assert.equal(
    updatedHandles.some(
      (handle) => handleId(handle) === "floor-ground:room-lobby:opening:opening-door-east",
    ),
    false,
  );

  mountedOverlayScene.dispose();
});

test("Viewer25D top-down overlay scene consumes the resolved shared geometry input", () => {
  const sceneGraph = createViewer25DSceneGraph({
    floors: [],
    activeFloorId: null,
    exteriorPolygon: null,
    exteriorEdgeOpenings: null,
    floorRenderOffsets: [],
  });
  const geometrySource = {
    sceneGraph,
    roomNodes: [
      Object.freeze({
        nodeId: "floor-test:room-test",
        floorId: "floor-test",
        roomId: "room-test",
        roomName: "Geometry Source Room",
        points: Object.freeze([
          Object.freeze({ x: 100, y: 200 }),
          Object.freeze({ x: 300, y: 200 }),
          Object.freeze({ x: 300, y: 400 }),
        ]),
        openings: Object.freeze([]),
        floorHeight: 3,
        floorRenderY: 0.9,
        colorIndex: 0,
        isActive: true,
      }),
    ],
    exteriorNode: null,
    exteriorOpeningNodes: Object.freeze([]),
    guideObjectNodes: Object.freeze([]),
    verticalConnectorNodes: Object.freeze([]),
  } as const;

  const sceneTree = createViewer25DTopDownHandleOverlayScene({
    geometrySource,
    cameraMode: "top-down-orthographic",
  });
  const htmlHandles = collectWorldSpaceHtmlHandleElements(sceneTree);

  assert.deepEqual(
    htmlHandles.map(handleId),
    [
      "floor-test:room-test:vertex:0",
      "floor-test:room-test:vertex:1",
      "floor-test:room-test:vertex:2",
    ],
  );
  assert.deepEqual(handlePos(htmlHandles[0]!), [1, 0.92, 2]);
});

test("Viewer25D camera mode switching preserves the exact shared THREE.Scene instance", () => {
  const sharedScene = resolveViewer25DSharedSceneInstance();

  const editScene = resolveViewer25DSharedSceneInstance(sharedScene);
  const previewScene = resolveViewer25DSharedSceneInstance(editScene);

  assert.equal(editScene, sharedScene);
  assert.equal(previewScene, sharedScene);
  assert.equal(sharedScene.name, "viewer25d-shared-scene");
});
