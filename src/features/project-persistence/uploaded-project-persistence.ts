import type { SerializedProjectData } from "../project-export/project-serializer.ts";
import {
  saveProjectToLocalStorage,
  type LocalProjectStorage,
} from "./local-project-storage.ts";

export interface PersistedUploadedProjectRecordMetadata {
  projectId: string;
  projectName: string;
  objectVersion: number;
  storageKey: string;
  savedAt: string;
}

export function persistUploadedProject(
  project: SerializedProjectData,
  storage: LocalProjectStorage,
  now: Date = new Date(),
): PersistedUploadedProjectRecordMetadata {
  const record = saveProjectToLocalStorage(project, storage, now);

  return {
    projectId: project.projectId,
    projectName: project.projectName,
    objectVersion: project.objectVersion,
    storageKey: record.storageKey,
    savedAt: record.savedAt,
  };
}
