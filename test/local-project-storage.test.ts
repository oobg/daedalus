import assert from "node:assert/strict";
import test from "node:test";

import {
  clearProjectFromLocalStorage,
  getProjectStorageKey,
  loadProjectFromLocalStorage,
  saveProjectToLocalStorage,
  type LocalProjectStorage,
  type ProjectSnapshot,
} from "../src/features/project-persistence/local-project-storage.ts";

interface TestProject extends ProjectSnapshot {
  projectName: string;
  floors: Array<{
    id: string;
    name: string;
    height: number;
    referenceImage: string | null;
  }>;
  viewState: {
    activeFloorId: string;
    zoom: number;
  };
}

class InMemoryLocalProjectStorage implements LocalProjectStorage {
  private readonly entries = new Map<string, string>();

  getItem(key: string): string | null {
    return this.entries.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.entries.set(key, value);
  }

  removeItem(key: string): void {
    this.entries.delete(key);
  }
}

test("saveProjectToLocalStorage stores a project snapshot under a deterministic key", () => {
  const storage = new InMemoryLocalProjectStorage();
  const project: TestProject = {
    projectId: "project alpha / ground",
    objectVersion: 1,
    projectName: "Project Alpha",
    floors: [
      {
        id: "floor-1",
        name: "Ground Floor",
        height: 3.5,
        referenceImage: "floor-plan://project-alpha/floor-1/ground.png",
      },
    ],
    viewState: {
      activeFloorId: "floor-1",
      zoom: 1.25,
    },
  };

  const saved = saveProjectToLocalStorage(
    project,
    storage,
    new Date("2026-05-13T10:00:00.000Z"),
  );

  assert.equal(saved.storageKey, getProjectStorageKey(project.projectId));
  assert.equal(saved.savedAt, "2026-05-13T10:00:00.000Z");
  assert.deepEqual(saved.project, project);

  const loaded = loadProjectFromLocalStorage<TestProject>(
    project.projectId,
    storage,
  );

  assert.deepEqual(loaded, saved);
});

test("saveProjectToLocalStorage overwrites an existing saved project for the same project id", () => {
  const storage = new InMemoryLocalProjectStorage();
  const initialProject: TestProject = {
    projectId: "project-alpha",
    objectVersion: 1,
    projectName: "Project Alpha",
    floors: [],
    viewState: {
      activeFloorId: "floor-1",
      zoom: 1,
    },
  };
  const updatedProject: TestProject = {
    ...initialProject,
    projectName: "Project Alpha Updated",
    floors: [
      {
        id: "floor-2",
        name: "Second Floor",
        height: 4,
        referenceImage: null,
      },
    ],
  };

  saveProjectToLocalStorage(
    initialProject,
    storage,
    new Date("2026-05-13T10:00:00.000Z"),
  );
  const saved = saveProjectToLocalStorage(
    updatedProject,
    storage,
    new Date("2026-05-13T10:05:00.000Z"),
  );

  const loaded = loadProjectFromLocalStorage<TestProject>(
    updatedProject.projectId,
    storage,
  );

  assert.deepEqual(loaded, saved);
  assert.equal(loaded?.project.projectName, "Project Alpha Updated");
  assert.deepEqual(loaded?.project.floors, updatedProject.floors);
});

test("loadProjectFromLocalStorage returns null when no saved project exists", () => {
  const storage = new InMemoryLocalProjectStorage();

  assert.equal(loadProjectFromLocalStorage("missing-project", storage), null);
});

test("loadProjectFromLocalStorage rejects corrupted saved data", () => {
  const storage = new InMemoryLocalProjectStorage();
  storage.setItem(
    getProjectStorageKey("project-alpha"),
    JSON.stringify({
      storageKey: getProjectStorageKey("project-alpha"),
      savedAt: "2026-05-13T10:00:00.000Z",
      project: {
        objectVersion: 1,
      },
    }),
  );

  assert.throws(
    () => loadProjectFromLocalStorage("project-alpha", storage),
    /Stored project "project-alpha" is invalid/,
  );
});

test("clearProjectFromLocalStorage removes a saved project snapshot", () => {
  const storage = new InMemoryLocalProjectStorage();
  const project: TestProject = {
    projectId: "project-alpha",
    objectVersion: 1,
    projectName: "Project Alpha",
    floors: [],
    viewState: {
      activeFloorId: "floor-1",
      zoom: 1,
    },
  };

  saveProjectToLocalStorage(project, storage);
  clearProjectFromLocalStorage(project.projectId, storage);

  assert.equal(loadProjectFromLocalStorage(project.projectId, storage), null);
});
