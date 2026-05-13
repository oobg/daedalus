export const PROJECT_EXPORT_FORMAT_VERSION = 1;

export interface ProjectExportMetadata {
  projectId: string;
  projectName: string;
  objectVersion: number;
}

export interface ProjectExportEnvelope<
  TProject extends ProjectExportMetadata,
> {
  exportFormatVersion: typeof PROJECT_EXPORT_FORMAT_VERSION;
  exportedAt: string;
  projectMetadata: ProjectExportMetadata;
  project: TProject;
}

export function buildProjectExportEnvelope<
  TProject extends ProjectExportMetadata,
>(
  project: TProject,
  now: Date = new Date(),
): ProjectExportEnvelope<TProject> {
  return {
    exportFormatVersion: PROJECT_EXPORT_FORMAT_VERSION,
    exportedAt: now.toISOString(),
    projectMetadata: {
      projectId: project.projectId,
      projectName: project.projectName,
      objectVersion: project.objectVersion,
    },
    project: structuredClone(project),
  };
}
