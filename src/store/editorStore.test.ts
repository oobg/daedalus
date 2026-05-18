import assert from "node:assert/strict";
import test from "node:test";

import { createEditorStore } from "./createEditorStore.ts";

class MemoryStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

test("createEditorStore creates the initial floor with the default floor height", () => {
  const store = createEditorStore({ storage: new MemoryStorage() });
  const activeFloorId = store.getState().project.viewState.activeFloorId;
  const activeFloor = store
    .getState()
    .project.floors.find((floor) => floor.floorId === activeFloorId);

  assert.ok(activeFloor);
  assert.equal(activeFloor.floorHeight, 3);
});

test("addFloor persists the created floor height in local storage", () => {
  const storage = new MemoryStorage();
  const store = createEditorStore({ storage });

  store.getState().addFloor();

  const persistedProject = JSON.parse(storage.getItem("daedalus.project") ?? "null");

  assert.ok(persistedProject);
  assert.equal(persistedProject.floors.length, 2);
  assert.equal(persistedProject.floors[1].floorHeight, 3);
});

test("updateFloor persists an edited floor height and loadFromLocalStorage restores it", () => {
  const storage = new MemoryStorage();
  const store = createEditorStore({ storage });
  const initialProject = store.getState().project;
  const activeFloorId = initialProject.viewState.activeFloorId;

  assert.ok(activeFloorId);

  store.getState().updateFloor(activeFloorId, { floorHeight: 5.5 });

  const updatedFloor = store
    .getState()
    .project.floors.find((floor) => floor.floorId === activeFloorId);

  assert.ok(updatedFloor);
  assert.equal(updatedFloor.floorHeight, 5.5);

  const persistedProject = JSON.parse(storage.getItem("daedalus.project") ?? "null");

  assert.ok(persistedProject);
  assert.equal(persistedProject.floors[0].floorHeight, 5.5);

  const restoredStore = createEditorStore({ storage });

  assert.equal(restoredStore.getState().loadFromLocalStorage(), true);

  const restoredFloor = restoredStore
    .getState()
    .project.floors.find((floor) => floor.floorId === activeFloorId);

  assert.ok(restoredFloor);
  assert.equal(restoredFloor.floorHeight, 5.5);
});

test("updateFloorHeight updates only the targeted floor height in application state", () => {
  const storage = new MemoryStorage();
  const store = createEditorStore({ storage });
  const initialActiveFloorId = store.getState().project.viewState.activeFloorId;

  assert.ok(initialActiveFloorId);

  store.getState().updateFloor(initialActiveFloorId, {
    floorName: "Ground",
    referenceImage: "floor-plan://project/ground.png",
  });
  store.getState().addFloor();

  const secondFloorId =
    store
      .getState()
      .project.floors.find((floor) => floor.floorId !== initialActiveFloorId)?.floorId ?? null;

  assert.ok(secondFloorId);

  store.getState().updateFloor(secondFloorId, {
    floorName: "Mezzanine",
    floorHeight: 4,
    referenceImage: "floor-plan://project/mezzanine.png",
  });

  const previousProject = store.getState().project;
  const firstFloorBefore = previousProject.floors.find(
    (floor) => floor.floorId === initialActiveFloorId,
  );

  assert.ok(firstFloorBefore);

  store.getState().updateFloorHeight(secondFloorId, 5.5);

  const nextProject = store.getState().project;
  const firstFloorAfter = nextProject.floors.find(
    (floor) => floor.floorId === initialActiveFloorId,
  );
  const secondFloorAfter = nextProject.floors.find(
    (floor) => floor.floorId === secondFloorId,
  );

  assert.ok(firstFloorAfter);
  assert.ok(secondFloorAfter);
  assert.notEqual(nextProject, previousProject);
  assert.equal(firstFloorAfter.floorHeight, 3);
  assert.equal(firstFloorAfter.floorName, "Ground");
  assert.equal(firstFloorAfter.referenceImage, "floor-plan://project/ground.png");
  assert.equal(secondFloorAfter.floorHeight, 5.5);
  assert.equal(secondFloorAfter.floorName, "Mezzanine");
  assert.equal(secondFloorAfter.referenceImage, "floor-plan://project/mezzanine.png");
  assert.deepEqual(nextProject.floors.map((floor) => floor.floorHeight), [3, 5.5]);
});

test("setFloorReferenceImage updates only the specified floor reference and preserves other stored floor references", () => {
  const storage = new MemoryStorage();
  const store = createEditorStore({ storage });
  const firstFloorId = store.getState().project.viewState.activeFloorId;

  assert.ok(firstFloorId);

  store.getState().updateFloor(firstFloorId, {
    floorName: "Ground",
    referenceImage: "floor-plan://project/ground.png",
  });
  store.getState().addFloor();

  const secondFloorId =
    store
      .getState()
      .project.floors.find((floor) => floor.floorId !== firstFloorId)?.floorId ?? null;

  assert.ok(secondFloorId);

  store.getState().updateFloor(secondFloorId, {
    floorName: "Mezzanine",
    referenceImage: "floor-plan://project/mezzanine.png",
  });

  store
    .getState()
    .setFloorReferenceImage(secondFloorId, "floor-plan://project/mezzanine-updated.png");

  const nextProject = store.getState().project;
  const firstFloor = nextProject.floors.find((floor) => floor.floorId === firstFloorId);
  const secondFloor = nextProject.floors.find((floor) => floor.floorId === secondFloorId);

  assert.ok(firstFloor);
  assert.ok(secondFloor);
  assert.equal(firstFloor.referenceImage, "floor-plan://project/ground.png");
  assert.equal(
    secondFloor.referenceImage,
    "floor-plan://project/mezzanine-updated.png",
  );

  const persistedProject = JSON.parse(storage.getItem("daedalus.project") ?? "null");

  assert.ok(persistedProject);
  assert.equal(persistedProject.floors[0].referenceImage, "floor-plan://project/ground.png");
  assert.equal(
    persistedProject.floors[1].referenceImage,
    "floor-plan://project/mezzanine-updated.png",
  );
});

test("commitDraft creates a room polygon record and persists it as room source data", () => {
  const storage = new MemoryStorage();
  const store = createEditorStore({ storage });
  const initialProject = store.getState().project;
  const activeFloorId = initialProject.viewState.activeFloorId;

  assert.ok(activeFloorId);

  store.getState().setActiveTool("room");
  store.getState().addDraftPoint({ x: 10, y: 20 });
  store.getState().addDraftPoint({ x: 70, y: 20 });
  store.getState().addDraftPoint({ x: 70, y: 80 });
  store.getState().commitDraft();

  const nextState = store.getState();
  const floor = nextState.project.floors.find(
    (candidate) => candidate.floorId === activeFloorId,
  );

  assert.ok(floor);
  assert.equal(nextState.isDrawing, false);
  assert.deepEqual(nextState.draftPoints, []);
  assert.equal(floor.rooms.length, 1);
  assert.deepEqual(floor.rooms[0].roomPolygon, [
    { x: 10, y: 20 },
    { x: 70, y: 20 },
    { x: 70, y: 80 },
  ]);
  assert.equal(floor.rooms[0].roomName, "Room 1");
  assert.equal(floor.rooms[0].area, 1800);
  assert.deepEqual(floor.rooms[0].labelPosition, {
    x: 50,
    y: 40,
  });

  const serializedProject = storage.getItem("daedalus.project");
  assert.ok(serializedProject);

  const persistedProject = JSON.parse(serializedProject);
  assert.deepEqual(persistedProject.floors[0].rooms[0].roomPolygon, [
    { x: 10, y: 20 },
    { x: 70, y: 20 },
    { x: 70, y: 80 },
  ]);
  assert.equal(persistedProject.floors[0].rooms[0].area, 1800);
  assert.notEqual(persistedProject.floors[0].rooms[0].roomId, "");
});

test("updateRoom persists edited room polygons as the saved room source of truth", () => {
  const storage = new MemoryStorage();
  const store = createEditorStore({ storage });
  const initialProject = store.getState().project;
  const activeFloorId = initialProject.viewState.activeFloorId;

  assert.ok(activeFloorId);

  store.getState().setActiveTool("room");
  store.getState().addDraftPoint({ x: 10, y: 20 });
  store.getState().addDraftPoint({ x: 70, y: 20 });
  store.getState().addDraftPoint({ x: 70, y: 80 });
  store.getState().commitDraft();

  const createdRoom = store.getState().project.floors[0]?.rooms[0];
  assert.ok(createdRoom);

  store.getState().updateRoom(activeFloorId, createdRoom.roomId, {
    roomPolygon: [
      { x: 10, y: 20 },
      { x: 90, y: 20 },
      { x: 90, y: 100 },
      { x: 10, y: 100 },
    ],
  });

  const updatedRoom = store.getState().project.floors[0]?.rooms[0];
  assert.ok(updatedRoom);
  assert.deepEqual(updatedRoom.roomPolygon, [
    { x: 10, y: 20 },
    { x: 90, y: 20 },
    { x: 90, y: 100 },
    { x: 10, y: 100 },
  ]);
  assert.equal(updatedRoom.area, 6400);
  assert.deepEqual(updatedRoom.labelPosition, {
    x: 50,
    y: 60,
  });

  const serializedProject = storage.getItem("daedalus.project");
  assert.ok(serializedProject);

  const persistedProject = JSON.parse(serializedProject);
  assert.deepEqual(persistedProject.floors[0].rooms[0].roomPolygon, [
    { x: 10, y: 20 },
    { x: 90, y: 20 },
    { x: 90, y: 100 },
    { x: 10, y: 100 },
  ]);
  assert.equal(persistedProject.floors[0].rooms[0].area, 6400);
  assert.deepEqual(persistedProject.floors[0].rooms[0].labelPosition, {
    x: 50,
    y: 60,
  });
});

test("updateRoom normalizes duplicated closing vertices before persisting room polygons", () => {
  const storage = new MemoryStorage();
  const store = createEditorStore({ storage });
  const activeFloorId = store.getState().project.viewState.activeFloorId;

  assert.ok(activeFloorId);

  store.getState().setActiveTool("room");
  store.getState().addDraftPoint({ x: 10, y: 20 });
  store.getState().addDraftPoint({ x: 70, y: 20 });
  store.getState().addDraftPoint({ x: 70, y: 80 });
  store.getState().commitDraft();

  const createdRoom = store.getState().project.floors[0]?.rooms[0];
  assert.ok(createdRoom);

  store.getState().updateRoom(activeFloorId, createdRoom.roomId, {
    roomPolygon: [
      { x: 10, y: 20 },
      { x: 90, y: 20 },
      { x: 90, y: 100 },
      { x: 10, y: 100 },
      { x: 10, y: 20 },
    ],
  });

  const updatedRoom = store.getState().project.floors[0]?.rooms[0];
  assert.ok(updatedRoom);
  assert.deepEqual(updatedRoom.roomPolygon, [
    { x: 10, y: 20 },
    { x: 90, y: 20 },
    { x: 90, y: 100 },
    { x: 10, y: 100 },
  ]);
  assert.equal(updatedRoom.area, 6400);
  assert.deepEqual(updatedRoom.labelPosition, {
    x: 50,
    y: 60,
  });

  const serializedProject = storage.getItem("daedalus.project");
  assert.ok(serializedProject);

  const persistedProject = JSON.parse(serializedProject);
  assert.deepEqual(persistedProject.floors[0].rooms[0].roomPolygon, [
    { x: 10, y: 20 },
    { x: 90, y: 20 },
    { x: 90, y: 100 },
    { x: 10, y: 100 },
  ]);
  assert.equal(persistedProject.floors[0].rooms[0].area, 6400);
  assert.deepEqual(persistedProject.floors[0].rooms[0].labelPosition, {
    x: 50,
    y: 60,
  });
});

test("insertRoomVertexOnEdge persists an inserted edge vertex as room polygon source data", () => {
  const storage = new MemoryStorage();
  const store = createEditorStore({ storage });
  const activeFloorId = store.getState().project.viewState.activeFloorId;

  assert.ok(activeFloorId);

  store.getState().setActiveTool("room");
  store.getState().addDraftPoint({ x: 10, y: 20 });
  store.getState().addDraftPoint({ x: 90, y: 20 });
  store.getState().addDraftPoint({ x: 90, y: 100 });
  store.getState().addDraftPoint({ x: 10, y: 100 });
  store.getState().commitDraft();

  const createdRoom = store.getState().project.floors[0]?.rooms[0];
  assert.ok(createdRoom);

  store.getState().insertRoomVertexOnEdge(
    activeFloorId,
    createdRoom.roomId,
    1,
    { x: 110, y: 60 },
  );

  const updatedRoom = store.getState().project.floors[0]?.rooms[0];
  assert.ok(updatedRoom);
  assert.deepEqual(updatedRoom.roomPolygon, [
    { x: 10, y: 20 },
    { x: 90, y: 20 },
    { x: 110, y: 60 },
    { x: 90, y: 100 },
    { x: 10, y: 100 },
  ]);
  assert.equal(updatedRoom.area, 7200);
  assert.deepEqual(updatedRoom.labelPosition, {
    x: 62,
    y: 60,
  });

  const serializedProject = storage.getItem("daedalus.project");
  assert.ok(serializedProject);

  const persistedProject = JSON.parse(serializedProject);
  assert.deepEqual(persistedProject.floors[0].rooms[0].roomPolygon, [
    { x: 10, y: 20 },
    { x: 90, y: 20 },
    { x: 110, y: 60 },
    { x: 90, y: 100 },
    { x: 10, y: 100 },
  ]);
  assert.equal(persistedProject.floors[0].rooms[0].area, 7200);
  assert.deepEqual(persistedProject.floors[0].rooms[0].labelPosition, {
    x: 62,
    y: 60,
  });
});

test("replaceProject normalizes closed room polygons and recalculates derived room data", () => {
  const storage = new MemoryStorage();
  const store = createEditorStore({ storage });

  store.getState().replaceProject({
    projectId: "project-normalized",
    projectName: "Normalized Project",
    objectVersion: 1,
    floors: [
      {
        floorId: "floor-1",
        floorName: "1F",
        floorHeight: 3,
        referenceImage: null,
        rooms: [
          {
            roomId: "room-1",
            roomName: "Lobby",
            roomPolygon: [
              { x: 0, y: 0 },
              { x: 8, y: 0 },
              { x: 8, y: 4 },
              { x: 0, y: 4 },
              { x: 0, y: 0 },
            ],
            sharedBoundaries: [],
            area: 999,
            labelPosition: { x: 99, y: 99 },
            openings: [],
          },
        ],
      },
    ],
    viewState: {
      activeFloorId: "floor-1",
      selectedRoomId: null,
    },
    exteriorPolygon: null,
  });

  const replacedRoom = store.getState().project.floors[0]?.rooms[0];
  assert.ok(replacedRoom);
  assert.deepEqual(replacedRoom.roomPolygon, [
    { x: 0, y: 0 },
    { x: 8, y: 0 },
    { x: 8, y: 4 },
    { x: 0, y: 4 },
  ]);
  assert.equal(replacedRoom.area, 32);
  assert.deepEqual(replacedRoom.labelPosition, { x: 4, y: 2 });

  store.getState().saveToLocalStorage();

  const serializedProject = storage.getItem("daedalus.project");
  assert.ok(serializedProject);

  const persistedProject = JSON.parse(serializedProject);
  assert.deepEqual(persistedProject.floors[0].rooms[0].roomPolygon, [
    { x: 0, y: 0 },
    { x: 8, y: 0 },
    { x: 8, y: 4 },
    { x: 0, y: 4 },
  ]);
  assert.equal(persistedProject.floors[0].rooms[0].area, 32);
  assert.deepEqual(persistedProject.floors[0].rooms[0].labelPosition, {
    x: 4,
    y: 2,
  });
});

test("removeRoom deletes the room polygon record from persisted editor state", () => {
  const storage = new MemoryStorage();
  const store = createEditorStore({ storage });
  const initialProject = store.getState().project;
  const activeFloorId = initialProject.viewState.activeFloorId;

  assert.ok(activeFloorId);

  store.getState().setActiveTool("room");
  store.getState().addDraftPoint({ x: 10, y: 20 });
  store.getState().addDraftPoint({ x: 70, y: 20 });
  store.getState().addDraftPoint({ x: 70, y: 80 });
  store.getState().commitDraft();

  const createdRoom = store.getState().project.floors[0]?.rooms[0];
  assert.ok(createdRoom);

  store.getState().removeRoom(activeFloorId, createdRoom.roomId);

  const nextFloor = store
    .getState()
    .project.floors.find((candidate) => candidate.floorId === activeFloorId);

  assert.ok(nextFloor);
  assert.equal(nextFloor.rooms.length, 0);
  assert.equal(store.getState().project.viewState.selectedRoomId, null);

  const serializedProject = storage.getItem("daedalus.project");
  assert.ok(serializedProject);

  const persistedProject = JSON.parse(serializedProject);
  assert.deepEqual(persistedProject.floors[0].rooms, []);
});
