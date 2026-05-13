import assert from 'node:assert/strict';
import test from 'node:test';

import {
  appendRoomDraftPoint,
  collectRoomDraftPoints,
  createRoomDraftPolygon,
  deleteRoomPolygonVertex,
  finalizeRoomDraftPolygon,
  insertRoomPolygonVertex,
  moveRoomPolygonVertex,
} from './roomDraft.ts';

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
    { x: 1, y: 1 },
  ]);

  assert.throws(
    () => finalizeRoomDraftPolygon(draft),
    /at least 3 distinct vertices/,
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
  });
  assert.deepEqual(polygon.points, [
    { x: 0, y: 0 },
    { x: 8, y: 0 },
    { x: 4, y: 6 },
    { x: 0, y: 0 },
  ]);
});
