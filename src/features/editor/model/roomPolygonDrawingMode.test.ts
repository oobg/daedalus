import assert from 'node:assert/strict';
import test from 'node:test';

import {
  captureRoomPolygonCanvasClick,
  getRoomPolygonDraftRenderState,
  isRoomPolygonDrawingTool,
} from './roomPolygonDrawingMode.ts';

test('isRoomPolygonDrawingTool identifies the room polygon drawing mode', () => {
  assert.equal(isRoomPolygonDrawingTool('room'), true);
  assert.equal(isRoomPolygonDrawingTool('select'), false);
  assert.equal(isRoomPolygonDrawingTool('exterior'), false);
});

test('captureRoomPolygonCanvasClick starts a room polygon draft from the first canvas click', () => {
  const capture = captureRoomPolygonCanvasClick(
    {
      activeTool: 'room',
      isDrawing: false,
      draftPoints: [],
    },
    { x: 24, y: 36 },
  );

  assert.equal(capture.handled, true);
  assert.deepEqual(capture.state, {
    activeTool: 'room',
    isDrawing: true,
    draftPoints: [{ x: 24, y: 36 }],
  });
});

test('captureRoomPolygonCanvasClick appends canvas click positions as ordered draft vertices', () => {
  const firstCapture = captureRoomPolygonCanvasClick(
    {
      activeTool: 'room',
      isDrawing: false,
      draftPoints: [],
    },
    { x: 24, y: 36 },
  );

  const secondCapture = captureRoomPolygonCanvasClick(
    firstCapture.state,
    { x: 72, y: 36 },
  );

  const thirdCapture = captureRoomPolygonCanvasClick(
    secondCapture.state,
    { x: 72, y: 90 },
  );

  assert.equal(firstCapture.handled, true);
  assert.equal(thirdCapture.state.isDrawing, true);
  assert.deepEqual(thirdCapture.state.draftPoints, [
    { x: 24, y: 36 },
    { x: 72, y: 36 },
    { x: 72, y: 90 },
  ]);
});

test('captureRoomPolygonCanvasClick does not mutate earlier captured draft vertices', () => {
  const initialDraft = [{ x: 10, y: 20 }];

  const capture = captureRoomPolygonCanvasClick(
    {
      activeTool: 'room',
      isDrawing: true,
      draftPoints: initialDraft,
    },
    { x: 30, y: 40 },
  );

  assert.notEqual(capture.state.draftPoints, initialDraft);
  assert.deepEqual(initialDraft, [{ x: 10, y: 20 }]);
  assert.deepEqual(capture.state.draftPoints, [
    { x: 10, y: 20 },
    { x: 30, y: 40 },
  ]);
});

test('captureRoomPolygonCanvasClick ignores canvas clicks outside room drawing mode', () => {
  const state = {
    activeTool: 'select',
    isDrawing: false,
    draftPoints: [{ x: 1, y: 2 }],
  };

  const capture = captureRoomPolygonCanvasClick(state, { x: 5, y: 6 });

  assert.equal(capture.handled, false);
  assert.equal(capture.state, state);
  assert.deepEqual(capture.state.draftPoints, [{ x: 1, y: 2 }]);
});

test('captureRoomPolygonCanvasClick rejects non-finite placement attempts without mutating the draft', () => {
  const state = {
    activeTool: 'room',
    isDrawing: true,
    draftPoints: [{ x: 1, y: 2 }],
  };

  const capture = captureRoomPolygonCanvasClick(state, {
    x: Number.POSITIVE_INFINITY,
    y: 4,
  });

  assert.deepEqual(capture, {
    handled: true,
    state,
    error: 'invalid_point',
  });
});

test('captureRoomPolygonCanvasClick rejects duplicate vertex placement attempts', () => {
  const state = {
    activeTool: 'room',
    isDrawing: true,
    draftPoints: [
      { x: 1, y: 2 },
      { x: 4, y: 2 },
    ],
  };

  const capture = captureRoomPolygonCanvasClick(state, { x: 1, y: 2 });

  assert.deepEqual(capture, {
    handled: true,
    state,
    error: 'duplicate_point',
  });
});

test('captureRoomPolygonCanvasClick completes a room polygon when the first vertex is clicked again', () => {
  const state = {
    activeTool: 'room',
    isDrawing: true,
    draftPoints: [
      { x: 24, y: 36 },
      { x: 72, y: 36 },
      { x: 72, y: 90 },
    ],
  };

  const capture = captureRoomPolygonCanvasClick(state, { x: 24, y: 36 });

  assert.deepEqual(capture, {
    handled: true,
    completed: true,
    state: {
      ...state,
      isDrawing: false,
    },
  });
});

test('captureRoomPolygonCanvasClick keeps early first-vertex repeats as duplicate attempts', () => {
  const state = {
    activeTool: 'room',
    isDrawing: true,
    draftPoints: [
      { x: 24, y: 36 },
      { x: 72, y: 36 },
    ],
  };

  const capture = captureRoomPolygonCanvasClick(state, { x: 24, y: 36 });

  assert.deepEqual(capture, {
    handled: true,
    state,
    error: 'duplicate_point',
  });
});

test('getRoomPolygonDraftRenderState exposes placed vertices and in-progress edge points', () => {
  const renderState = getRoomPolygonDraftRenderState(
    [
      { x: 24, y: 36 },
      { x: 72, y: 36 },
    ],
    { x: 72, y: 90 },
  );

  assert.deepEqual(renderState, {
    vertexPoints: [
      { x: 24, y: 36 },
      { x: 72, y: 36 },
    ],
    placedEdgePoints: [24, 36, 72, 36],
    activeEdgePoints: [72, 36, 72, 90],
  });
});

test('getRoomPolygonDraftRenderState omits the active edge until the pointer has a canvas position', () => {
  const renderState = getRoomPolygonDraftRenderState(
    [{ x: 24, y: 36 }],
    null,
  );

  assert.deepEqual(renderState, {
    vertexPoints: [{ x: 24, y: 36 }],
    placedEdgePoints: [24, 36],
    activeEdgePoints: [],
  });
});
