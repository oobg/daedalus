import assert from "node:assert/strict";
import test from "node:test";

import { createEditorProject } from "../../../domain/editor-state.ts";
import {
  applyValidatedFloorHeightChange,
  applyValidatedSelectedFloorHeightChange,
  formatFloorHeightEditorValue,
  parseFloorHeightEditorValue,
} from "./floorHeightEditing.ts";

test("parseFloorHeightEditorValue accepts positive floor heights for source updates", () => {
  assert.equal(parseFloorHeightEditorValue("3"), 3);
  assert.equal(parseFloorHeightEditorValue(" 4.25 "), 4.25);
  assert.equal(parseFloorHeightEditorValue("0.5"), 0.5);
});

test("parseFloorHeightEditorValue rejects empty, non-numeric, and non-positive edits", () => {
  for (const value of ["", " ", "height", "0", "-1", "NaN", "Infinity"]) {
    assert.equal(parseFloorHeightEditorValue(value), null);
  }
});

test("formatFloorHeightEditorValue mirrors valid source floor heights into the editor field", () => {
  assert.equal(formatFloorHeightEditorValue(3), "3");
  assert.equal(formatFloorHeightEditorValue(4.25), "4.25");
  assert.equal(formatFloorHeightEditorValue(Number.NaN), "");
  assert.equal(formatFloorHeightEditorValue(0), "");
});

test("applyValidatedFloorHeightChange updates one target floor only", () => {
  const project = createEditorProject({
    projectId: "project-floor-height-edit",
    floors: [
      {
        floorId: "floor-1",
        floorName: "Ground",
        floorHeight: 3,
      },
      {
        floorId: "floor-2",
        floorName: "Mezzanine",
        floorHeight: 4,
        referenceImage: "floor-plan://project-floor-height-edit/floor-2.png",
      },
      {
        floorId: "floor-3",
        floorName: "Roof",
        floorHeight: 2.5,
      },
    ],
  });

  const nextProject = applyValidatedFloorHeightChange(project, "floor-2", 5.25);

  assert.notEqual(nextProject, project);
  assert.equal(nextProject.floors[0], project.floors[0]);
  assert.notEqual(nextProject.floors[1], project.floors[1]);
  assert.equal(nextProject.floors[2], project.floors[2]);
  assert.deepEqual(nextProject.floors.map((floor) => floor.floorHeight), [3, 5.25, 2.5]);
  assert.equal(nextProject.floors[1].floorName, "Mezzanine");
  assert.equal(
    nextProject.floors[1].referenceImage,
    "floor-plan://project-floor-height-edit/floor-2.png",
  );
  assert.deepEqual(project.floors.map((floor) => floor.floorHeight), [3, 4, 2.5]);
});

test("applyValidatedFloorHeightChange rejects invalid height input without mutating the project", () => {
  const project = createEditorProject({
    projectId: "project-floor-height-invalid",
    floors: [
      {
        floorId: "floor-1",
        floorHeight: 3,
      },
      {
        floorId: "floor-2",
        floorHeight: 4,
      },
    ],
  });

  assert.throws(
    () => applyValidatedFloorHeightChange(project, "floor-2", 0),
    /Floor height must be greater than 0\./,
  );
  assert.deepEqual(project.floors.map((floor) => floor.floorHeight), [3, 4]);
});

test("applyValidatedSelectedFloorHeightChange updates the active floor only", () => {
  const project = createEditorProject({
    projectId: "project-selected-floor-height-edit",
    floors: [
      {
        floorId: "floor-1",
        floorName: "Ground",
        floorHeight: 3,
      },
      {
        floorId: "floor-2",
        floorName: "Mezzanine",
        floorHeight: 4,
        referenceImage: "floor-plan://project-selected-floor-height-edit/floor-2.png",
      },
      {
        floorId: "floor-3",
        floorName: "Roof",
        floorHeight: 2.5,
      },
    ],
    viewState: {
      activeFloorId: "floor-2",
    },
  });

  const nextProject = applyValidatedSelectedFloorHeightChange(project, 5.5);

  assert.notEqual(nextProject, project);
  assert.equal(nextProject.floors[0], project.floors[0]);
  assert.notEqual(nextProject.floors[1], project.floors[1]);
  assert.equal(nextProject.floors[2], project.floors[2]);
  assert.deepEqual(nextProject.floors.map((floor) => floor.floorHeight), [3, 5.5, 2.5]);
  assert.equal(nextProject.floors[1].floorName, "Mezzanine");
  assert.equal(
    nextProject.floors[1].referenceImage,
    "floor-plan://project-selected-floor-height-edit/floor-2.png",
  );
  assert.deepEqual(project.floors.map((floor) => floor.floorHeight), [3, 4, 2.5]);
});

test("applyValidatedSelectedFloorHeightChange rejects updates when no active floor is selected", () => {
  const project = createEditorProject({
    projectId: "project-selected-floor-height-missing-active-floor",
    floors: [],
    viewState: {
      activeFloorId: null,
    },
  });

  assert.throws(
    () => applyValidatedSelectedFloorHeightChange(project, 4),
    /Cannot update floor height without an active floor\./,
  );
  assert.deepEqual(project.floors, []);
});
