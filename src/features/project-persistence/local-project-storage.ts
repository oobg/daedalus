const PROJECT_STORAGE_KEY_PREFIX = "daedalus.project";
const ACTIVE_PROJECT_ID_STORAGE_KEY =
  `${PROJECT_STORAGE_KEY_PREFIX}:active-project-id`;

export interface LocalProjectStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem?(key: string): void;
}

export interface ProjectSnapshot {
  projectId: string;
  objectVersion: number;
}

export interface StoredProjectRecord<TProject extends ProjectSnapshot> {
  storageKey: string;
  savedAt: string;
  project: TProject;
}

export function getActiveProjectIdStorageKey(): string {
  return ACTIVE_PROJECT_ID_STORAGE_KEY;
}

export function getProjectStorageKey(projectId: string): string {
  return `${PROJECT_STORAGE_KEY_PREFIX}:${sanitizeStorageSegment(projectId)}`;
}

export function saveProjectToLocalStorage<TProject extends ProjectSnapshot>(
  project: TProject,
  storage: LocalProjectStorage,
  now: Date = new Date(),
): StoredProjectRecord<TProject> {
  const record: StoredProjectRecord<TProject> = {
    storageKey: getProjectStorageKey(project.projectId),
    savedAt: now.toISOString(),
    project: structuredClone(project),
  };

  storage.setItem(record.storageKey, JSON.stringify(record));
  storage.setItem(ACTIVE_PROJECT_ID_STORAGE_KEY, project.projectId);

  return record;
}

export function loadActiveProjectIdFromLocalStorage(
  storage: LocalProjectStorage,
): string | null {
  const storedProjectId = storage.getItem(ACTIVE_PROJECT_ID_STORAGE_KEY);

  if (storedProjectId == null) {
    return null;
  }

  const projectId = storedProjectId.trim();

  return projectId.length > 0 ? projectId : null;
}

export function loadProjectFromLocalStorage<TProject extends ProjectSnapshot>(
  projectId: string,
  storage: LocalProjectStorage,
): StoredProjectRecord<TProject> | null {
  const serializedRecord = storage.getItem(getProjectStorageKey(projectId));

  if (serializedRecord == null) {
    return null;
  }

  const parsed = JSON.parse(serializedRecord) as StoredProjectRecord<TProject>;

  if (
    parsed == null ||
    typeof parsed !== "object" ||
    parsed.project == null ||
    typeof parsed.project !== "object" ||
    typeof parsed.project.projectId !== "string" ||
    typeof parsed.project.objectVersion !== "number" ||
    typeof parsed.savedAt !== "string" ||
    typeof parsed.storageKey !== "string"
  ) {
    throw new Error(`Stored project "${projectId}" is invalid.`);
  }

  return parsed;
}

export function clearProjectFromLocalStorage(
  projectId: string,
  storage: LocalProjectStorage,
): void {
  storage.removeItem?.(getProjectStorageKey(projectId));

  if (loadActiveProjectIdFromLocalStorage(storage) === projectId) {
    storage.removeItem?.(ACTIVE_PROJECT_ID_STORAGE_KEY);
  }
}

function sanitizeStorageSegment(value: string): string {
  return value.trim().replace(/[^a-zA-Z0-9._-]+/g, "-");
}
