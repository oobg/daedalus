import {
  importUploadedProject,
  type ImportUploadedProjectResult,
} from "../project-export/import-uploaded-project.ts";
import {
  restoreProjectFromImport,
  type EditorProjectState,
  type SerializedProjectData,
} from "../project-export/project-serializer.ts";
import {
  loadProjectFromLocalStorage,
  type LocalProjectStorage,
  type StoredProjectRecord,
} from "./local-project-storage.ts";

export interface RestoredEditorRuntimeState {
  project: EditorProjectState;
}

export interface RestoredStoredProjectState {
  savedAt: string;
  storageKey: string;
  state: RestoredEditorRuntimeState;
}

export type RestoreUploadedProjectStateResult =
  | {
      ok: true;
      state: RestoredEditorRuntimeState;
    }
  | Extract<ImportUploadedProjectResult, { ok: false }>;

export function restoreEditorRuntimeState(
  project: SerializedProjectData,
): RestoredEditorRuntimeState {
  return {
    project: restoreProjectFromImport(project),
  };
}

export function restoreUploadedProjectState(
  content: string,
): RestoreUploadedProjectStateResult {
  const imported = importUploadedProject(content);

  if (!imported.ok) {
    return imported;
  }

  return {
    ok: true,
    state: restoreEditorRuntimeState(imported.value),
  };
}

export function restoreStoredProjectState(
  projectId: string,
  storage: LocalProjectStorage,
): RestoredStoredProjectState | null {
  const storedRecord =
    loadProjectFromLocalStorage<SerializedProjectData>(projectId, storage);

  if (storedRecord == null) {
    return null;
  }

  return restoreStoredProjectRecord(storedRecord);
}

export function restoreStoredProjectRecord(
  record: StoredProjectRecord<SerializedProjectData>,
): RestoredStoredProjectState {
  return {
    savedAt: record.savedAt,
    storageKey: record.storageKey,
    state: restoreEditorRuntimeState(record.project),
  };
}
