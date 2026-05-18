import assert from 'node:assert/strict';
import test from 'node:test';

import {
  appendRoomDraftPoint,
  collectRoomDraftPoints,
  createRoomPolygonFromOrderedPoints,
  createRoomDraftPolygon,
  deleteRoomPolygonVertex,
  finalizeEditorRoomDraft,
  finalizeRoomDraftPolygon,
  instantiateEditorRoomFromDraft,
  insertRoomPolygonVertex,
  moveRoomPolygonVertex,
} from './roomDraft.ts';
import { createEditorRoom } from '../../../domain/editor-state.ts';

test('createRoomDraftPolygon starts with an empty ordered point list', () => {
  const draft = createRoomDraftPolygon('room-1');

  assert.equal(draft.roomId, 'room-1');
  assert.deepEqual(draft.points, []);
});

test('appendRoomDraftPoint preserves point insertion order across sequential captures', () => {
  const draft = createRoomDraftPolygon('room-1');

  const withFirstPoint = appendRoomDraftPoint(draft, { x: 10, y: 12 });
  const withSecondPoint = appendRoomDraftPoint(withFirstPoint, { x: 24, y: 18 });
  const withThirdPoint = appendRoomDraftPoint(withSecondPoint, { x: 30, y: 35 });

  assert.deepEqual(withThirdPoint.points, [
    { x: 10, y: 12 },
    { x: 24, y: 18 },
    { x: 30, y: 35 },
  ]);
});

test('appendRoomDraftPoint returns a new draft without mutating earlier captures', () => {
  const originalDraft = createRoomDraftPolygon('room-1');
  const updatedDraft = appendRoomDraftPoint(originalDraft, { x: 8, y: 9 });

  assert.notEqual(updatedDraft, originalDraft);
  assert.deepEqual(originalDraft.points, []);
  assert.deepEqual(updatedDraft.points, [{ x: 8, y: 9 }]);
});

test('collectRoomDraftPoints builds the same ordered polygon from a sequential point stream', () => {
  const collectedDraft = collectRoomDraftPoints('room-2', [
    { x: 1, y: 1 },
    { x: 5, y: 1 },
    { x: 5, y: 4 },
    { x: 1, y: 4 },
  ]);

  assert.deepEqual(collectedDraft, {
    roomId: 'room-2',
    points: [
      { x: 1, y: 1 },
      { x: 5, y: 1 },
      { x: 5, y: 4 },
      { x: 1, y: 4 },
    ],
  });
});

test('createRoomPolygonFromOrderedPoints converts ordered point input into a closed room polygon model', () => {
  const polygon = createRoomPolygonFromOrderedPoints('room-2b', [
    { x: 1, y: 1 },
    { x: 5, y: 1 },
    { x: 5, y: 4 },
    { x: 1, y: 4 },
  ]);

  assert.deepEqual(polygon, {
    roomId: 'room-2b',
    points: [
      { x: 1, y: 1 },
      { x: 5, y: 1 },
      { x: 5, y: 4 },
      { x: 1, y: 4 },
      { x: 1, y: 1 },
    ],
  });
});

test('createRoomPolygonFromOrderedPoints returns a normalized polygon model for valid clockwise input', () => {
  const polygon = createRoomPolygonFromOrderedPoints('room-2c', [
    { x: 8, y: 2 },
    { x: 8, y: 6 },
    { x: 2, y: 6 },
    { x: 2, y: 2 },
  ]);

  assert.deepEqual(polygon, {
    roomId: 'room-2c',
    points: [
      { x: 2, y: 2 },
      { x: 8, y: 2 },
      { x: 8, y: 6 },
      { x: 2, y: 6 },
      { x: 2, y: 2 },
    ],
  });
});

test('finalizeRoomDraftPolygon closes an open draft by appending the starting point', () => {
  const draft = collectRoomDraftPoints('room-3', [
    { x: 2, y: 2 },
    { x: 8, y: 2 },
    { x: 8, y: 6 },
    { x: 2, y: 6 },
  ]);

  const polygon = finalizeRoomDraftPolygon(draft);

  assert.deepEqual(polygon, {
    roomId: 'room-3',
    points: [
      { x: 2, y: 2 },
      { x: 8, y: 2 },
      { x: 8, y: 6 },
      { x: 2, y: 6 },
      { x: 2, y: 2 },
    ],
  });
});

test('finalizeRoomDraftPolygon preserves closure without duplicating an existing closing point', () => {
  const draft = collectRoomDraftPoints('room-4', [
    { x: 0, y: 0 },
    { x: 4, y: 0 },
    { x: 4, y: 3 },
    { x: 0, y: 0 },
  ]);

  const polygon = finalizeRoomDraftPolygon(draft);

  assert.deepEqual(polygon.points, [
    { x: 0, y: 0 },
    { x: 4, y: 0 },
    { x: 4, y: 3 },
    { x: 0, y: 0 },
  ]);
});

test('finalizeRoomDraftPolygon accepts drafts with exactly 3 distinct vertices', () => {
  const draft = collectRoomDraftPoints('room-5', [
    { x: 1, y: 1 },
    { x: 5, y: 1 },
    { x: 3, y: 4 },
  ]);

  const polygon = finalizeRoomDraftPolygon(draft);

  assert.deepEqual(polygon.points, [
    { x: 1, y: 1 },
    { x: 5, y: 1 },
    { x: 3, y: 4 },
    { x: 1, y: 1 },
  ]);
});

test('finalizeEditorRoomDraft converts a valid closed draft into editor room input', () => {
  const draft = collectRoomDraftPoints('room-13', [
    { x: 2, y: 2 },
    { x: 8, y: 2 },
    { x: 8, y: 6 },
    { x: 2, y: 6 },
  ]);

  const room = finalizeEditorRoomDraft(draft, 'Room 2');

  assert.deepEqual(room, {
    roomId: 'room-13',
    roomName: 'Room 2',
    roomPolygon: [
      { x: 2, y: 2 },
      { x: 8, y: 2 },
      { x: 8, y: 6 },
      { x: 2, y: 6 },
    ],
    sharedBoundaries: [],
  });
});

test('finalizeEditorRoomDraft can be committed into a derived editor room object', () => {
  const draft = collectRoomDraftPoints('room-14', [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 10, y: 10 },
    { x: 0, y: 10 },
  ]);

  const room = createEditorRoom(finalizeEditorRoomDraft(draft, 'Guide Room'));

  assert.deepEqual(room, {
    roomId: 'room-14',
    roomName: 'Guide Room',
    roomPolygon: [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ],
    sharedBoundaries: [],
    area: 100,
    labelPosition: {
      x: 5,
      y: 5,
    },
    openings: [],
  });
});

test('instantiateEditorRoomFromDraft creates a room object directly from the closed polygon draft', () => {
  const draft = collectRoomDraftPoints('room-14b', [
    { x: 0, y: 0 },
    { x: 6, y: 0 },
    { x: 6, y: 4 },
    { x: 0, y: 4 },
  ]);

  const room = instantiateEditorRoomFromDraft(draft, 'Guide Room B');

  assert.deepEqual(room, {
    roomId: 'room-14b',
    roomName: 'Guide Room B',
    roomPolygon: [
      { x: 0, y: 0 },
      { x: 6, y: 0 },
      { x: 6, y: 4 },
      { x: 0, y: 4 },
    ],
    sharedBoundaries: [],
    area: 24,
    labelPosition: {
      x: 3,
      y: 2,
    },
    openings: [],
  });
});

test('finalizeRoomDraftPolygon rejects drafts with fewer than 3 points', () => {
  const draft = collectRoomDraftPoints('room-6', [
    { x: 1, y: 1 },
    { x: 3, y: 1 },
  ]);

  assert.throws(
    () => finalizeRoomDraftPolygon(draft),
    /at least 3 points/,
  );
});

test('finalizeRoomDraftPolygon rejects drafts with fewer than 3 distinct vertices', () => {
  const draft = collectRoomDraftPoints('room-7', [
    { x: 1, y: 1 },
    { x: 4, y: 1 },
    { x: 4, y: 1 },
    { x: 1, y: 1 },
  ]);

  assert.throws(
    () => finalizeRoomDraftPolygon(draft),
    /at least 3 distinct vertices/,
  );
});

test('finalizeRoomDraftPolygon rejects drafts with non-finite vertex placements', () => {
  const draft = collectRoomDraftPoints('room-7b', [
    { x: 1, y: 1 },
    { x: 4, y: 1 },
    { x: 3, y: Number.NaN },
  ]);

  assert.throws(
    () => finalizeRoomDraftPolygon(draft),
    /finite x\/y coordinates/,
  );
});

test('moveRoomPolygonVertex updates the targeted vertex coordinates and preserves polygon closure', () => {
  const polygon = finalizeRoomDraftPolygon(
    collectRoomDraftPoints('room-8', [
      { x: 0, y: 0 },
      { x: 8, y: 0 },
      { x: 8, y: 4 },
      { x: 0, y: 4 },
    ]),
  );

  const result = moveRoomPolygonVertex(polygon, 1, { x: 10, y: 1 });

  assert.deepEqual(result, {
    ok: true,
    polygon: {
      roomId: 'room-8',
      points: [
        { x: 0, y: 0 },
        { x: 10, y: 1 },
        { x: 8, y: 4 },
        { x: 0, y: 4 },
        { x: 0, y: 0 },
      ],
    },
  });
});

test('moveRoomPolygonVertex rejects moves that would make the polygon self-intersect', () => {
  const polygon = finalizeRoomDraftPolygon(
    collectRoomDraftPoints('room-9', [
      { x: 0, y: 0 },
      { x: 8, y: 0 },
      { x: 8, y: 8 },
      { x: 0, y: 8 },
    ]),
  );

  const result = moveRoomPolygonVertex(polygon, 2, { x: -2, y: 2 });

  assert.deepEqual(result, {
    ok: false,
    error: 'invalid_polygon',
    validation: {
      code: 'polygon_area_must_be_non_zero',
      message: 'A room polygon must define a valid simple closed shape.',
    },
  });
  assert.deepEqual(polygon.points, [
    { x: 0, y: 0 },
    { x: 8, y: 0 },
    { x: 8, y: 8 },
    { x: 0, y: 8 },
    { x: 0, y: 0 },
  ]);
});

test('insertRoomPolygonVertex inserts a vertex after the targeted vertex and preserves polygon closure', () => {
  const polygon = finalizeRoomDraftPolygon(
    collectRoomDraftPoints('room-10', [
      { x: 0, y: 0 },
      { x: 8, y: 0 },
      { x: 8, y: 4 },
      { x: 0, y: 4 },
    ]),
  );

  const result = insertRoomPolygonVertex(polygon, 1, { x: 10, y: 2 });

  assert.deepEqual(result, {
    ok: true,
    polygon: {
      roomId: 'room-10',
      points: [
        { x: 0, y: 0 },
        { x: 8, y: 0 },
        { x: 10, y: 2 },
        { x: 8, y: 4 },
        { x: 0, y: 4 },
        { x: 0, y: 0 },
      ],
    },
  });
});

test('insertRoomPolygonVertex rejects inserts that would make the polygon self-intersect', () => {
  const polygon = finalizeRoomDraftPolygon(
    collectRoomDraftPoints('room-11', [
      { x: 0, y: 0 },
      { x: 8, y: 0 },
      { x: 8, y: 8 },
      { x: 0, y: 8 },
    ]),
  );

  const result = insertRoomPolygonVertex(polygon, 1, { x: -2, y: 2 });

  assert.deepEqual(result, {
    ok: false,
    error: 'invalid_polygon',
    validation: {
      code: 'polygon_self_intersects',
      message: 'A room polygon must not self-intersect.',
    },
  });
  assert.deepEqual(polygon.points, [
    { x: 0, y: 0 },
    { x: 8, y: 0 },
    { x: 8, y: 8 },
    { x: 0, y: 8 },
    { x: 0, y: 0 },
  ]);
});

test('deleteRoomPolygonVertex removes the targeted vertex and preserves polygon closure', () => {
  const polygon = finalizeRoomDraftPolygon(
    collectRoomDraftPoints('room-12', [
      { x: 0, y: 0 },
      { x: 8, y: 0 },
      { x: 8, y: 4 },
      { x: 4, y: 6 },
      { x: 0, y: 4 },
    ]),
  );

  const result = deleteRoomPolygonVertex(polygon, 0);

  assert.deepEqual(result, {
    ok: true,
    polygon: {
      roomId: 'room-12',
      points: [
        { x: 8, y: 0 },
        { x: 8, y: 4 },
        { x: 4, y: 6 },
        { x: 0, y: 4 },
        { x: 8, y: 0 },
      ],
    },
  });
});

test('deleteRoomPolygonVertex rejects deletes that would leave fewer than 3 distinct vertices', () => {
  const polygon = finalizeRoomDraftPolygon(
    collectRoomDraftPoints('room-13', [
      { x: 0, y: 0 },
      { x: 8, y: 0 },
      { x: 4, y: 6 },
    ]),
  );

  const result = deleteRoomPolygonVertex(polygon, 1);

  assert.deepEqual(result, {
    ok: false,
    error: 'invalid_polygon',
    validation: {
      code: 'polygon_requires_three_points',
      message: 'A room polygon requires at least 3 points.',
    },
  });
  assert.deepEqual(polygon.points, [
    { x: 0, y: 0 },
    { x: 8, y: 0 },
    { x: 4, y: 6 },
    { x: 0, y: 0 },
  ]);
});
