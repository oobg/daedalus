import {
  buildProjectExportEnvelope,
  type ProjectExportEnvelope,
} from "./export-schema.ts";
import {
  serializeProjectForExport,
  type EditorProjectState,
  type SerializedProjectData,
} from "./project-serializer.ts";

export type SerializedProjectExportPayload =
  ProjectExportEnvelope<SerializedProjectData>;

export function assembleProjectExportPayload(
  project: EditorProjectState,
  now: Date = new Date(),
): SerializedProjectExportPayload {
  const serializedProject = serializeProjectForExport(project);

  return buildProjectExportEnvelope(serializedProject, now);
}
