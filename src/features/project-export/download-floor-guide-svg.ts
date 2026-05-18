import type { EditorProject } from "../../domain/editor-state.ts";
import { adaptProjectSnapshotToRenderScene, projectEditorStateForRenderer } from "../renderer/index.ts";
import { buildFloorGuideSvgExport } from "./floor-guide-svg-export.ts";

export function downloadFloorGuideSvg(
  project: EditorProject,
  floorId?: string,
): boolean {
  const targetFloorId = floorId ?? project.viewState.activeFloorId;
  const snapshot = projectEditorStateForRenderer(project);
  const scene = adaptProjectSnapshotToRenderScene(snapshot);
  const floor = scene.floors.find((candidate) => candidate.floorId === targetFloorId);

  if (!floor) {
    return false;
  }

  const svg = buildFloorGuideSvgExport(floor);
  const blob = new Blob([svg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${floor.floorName ?? "floor"}-guide.svg`;
  link.click();
  URL.revokeObjectURL(url);
  return true;
}
