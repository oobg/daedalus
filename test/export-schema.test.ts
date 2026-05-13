import assert from "node:assert/strict";
import test from "node:test";

import {
  PROJECT_EXPORT_FORMAT_VERSION,
  buildProjectExportEnvelope,
  type ProjectExportMetadata,
} from "../src/features/project-export/export-schema.ts";

interface TestProject extends ProjectExportMetadata {
  floors: Array<{
    floorId: string;
    floorName: string;
    floorHeight: number;
    referenceImage: string | null;
  }>;
  viewState: {
    activeFloorId: string;
    zoom: number;
  };
}

test("buildProjectExportEnvelope creates a versioned top-level JSON export envelope", () => {
  const project: TestProject = {
    projectId: "project-alpha",
    projectName: "Project Alpha",
    objectVersion: 3,
    floors: [
      {
        floorId: "floor-1",
        floorName: "Ground Floor",
        floorHeight: 3.5,
        referenceImage: "floor-plan://project-alpha/floor-1/ground.png",
      },
    ],
    viewState: {
      activeFloorId: "floor-1",
      zoom: 1.25,
    },
  };

  const envelope = buildProjectExportEnvelope(
    project,
    new Date("2026-05-13T10:30:00.000Z"),
  );

  assert.deepEqual(envelope, {
    exportFormatVersion: PROJECT_EXPORT_FORMAT_VERSION,
    exportedAt: "2026-05-13T10:30:00.000Z",
    projectMetadata: {
      projectId: "project-alpha",
      projectName: "Project Alpha",
      objectVersion: 3,
    },
    project,
  });
});

test("buildProjectExportEnvelope clones the project payload while preserving required metadata", () => {
  const project: TestProject = {
    projectId: "project-beta",
    projectName: "Project Beta",
    objectVersion: 2,
    floors: [],
    viewState: {
      activeFloorId: "floor-2",
      zoom: 1,
    },
  };

  const envelope = buildProjectExportEnvelope(project);

  assert.notEqual(envelope.project, project);
  assert.deepEqual(envelope.projectMetadata, {
    projectId: project.projectId,
    projectName: project.projectName,
    objectVersion: project.objectVersion,
  });

  project.projectName = "Mutated Project Beta";
  project.viewState.zoom = 2;

  assert.equal(envelope.project.projectName, "Project Beta");
  assert.equal(envelope.project.viewState.zoom, 1);
});
