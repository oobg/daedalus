const PROJECT_STORAGE_KEY_PREFIX = "daedalus.project";

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

  return record;
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
}

function sanitizeStorageSegment(value: string): string {
  return value.trim().replace(/[^a-zA-Z0-9._-]+/g, "-");
}
