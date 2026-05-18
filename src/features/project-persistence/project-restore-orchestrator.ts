import {
  importUploadedProject,
  type ImportUploadedProjectResult,
} from "../project-export/import-uploaded-project.ts";
import {
  restoreProjectFromImport,
  type EditorProjectState,
  type SerializedProjectData,
} from "../project-export/project-serializer.ts";
import { validateUploadedProjectSchema } from "../project-export/validate-uploaded-project-schema.ts";
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
  const validatedProject = normalizeSavedProjectForRestore(project);

  return {
    project: restoreProjectFromImport(validatedProject),
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

function normalizeSavedProjectForRestore(
  project: SerializedProjectData,
): SerializedProjectData {
  const validated = validateUploadedProjectSchema(
    project as unknown as Record<string, unknown>,
  );

  if (validated.ok) {
    return validated.value;
  }

  const failureSummary = validated.errors
    .map(({ path, message }) => `${path}: ${message}`)
    .join("; ");

  throw new Error(`Saved project data is invalid: ${failureSummary}`);
}
