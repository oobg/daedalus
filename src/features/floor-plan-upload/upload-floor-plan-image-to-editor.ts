import type { EditorFloor, EditorProject } from "../../domain/editor-state.ts";
import { updateEditorFloor } from "../../domain/editor-state.ts";
import {
  saveAcceptedFloorPlanImage,
  type FloorPlanImageStorage,
  type StoredFloorPlanImageAsset,
} from "./floor-plan-image-storage.ts";
import { validateFloorPlanUploadPayload } from "./validate-floor-plan-upload-payload.ts";

export interface UploadFloorPlanImageToEditorInput {
  project: EditorProject;
  selectedFloorId: string | null | undefined;
  upload: File | null | undefined;
}

export interface UploadFloorPlanImageToEditorResult {
  project: EditorProject;
  floor: EditorFloor;
  persistedUpload: StoredFloorPlanImageAsset;
}

export async function uploadFloorPlanImageToEditor(
  input: UploadFloorPlanImageToEditorInput,
  storage: FloorPlanImageStorage,
): Promise<UploadFloorPlanImageToEditorResult> {
  const validation = await validateFloorPlanUploadPayload({
    projectId: input.project.projectId,
    floorId: input.selectedFloorId ?? "",
    upload: input.upload,
  });

  if (!validation.ok) {
    throw new Error(
      `Cannot upload floor plan image: ${validation.code} (${validation.message})`,
    );
  }

  const persistedUpload = await saveAcceptedFloorPlanImage(
    {
      projectId: validation.value.projectId,
      floorId: validation.value.floorId,
      file: validation.value.upload,
    },
    storage,
  );
  const project = updateEditorFloor(input.project, validation.value.floorId, {
    referenceImage: persistedUpload.assetRef,
  });
  const floor = project.floors.find(
    (candidate) => candidate.floorId === validation.value.floorId,
  );

  if (floor == null) {
    throw new Error(`Floor "${validation.value.floorId}" was not found.`);
  }

  return {
    project,
    floor,
    persistedUpload,
  };
}
