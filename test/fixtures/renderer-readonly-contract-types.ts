import {
  adaptReadonlyEditorStateProjectionToRenderScene,
  createReadonlyEditorStateProjection,
  type ReadonlyRendererSnapshotProject,
} from "../../src/features/renderer/index.ts";
import { createEditorProject } from "../../src/domain/editor-state.ts";

const projection = createReadonlyEditorStateProjection(
  createEditorProject({
    projectId: "project-typecheck",
    floors: [
      {
        floorId: "floor-1",
        rooms: [
          {
            roomId: "room-1",
            roomPolygon: [
              { x: 0, y: 0 },
              { x: 5, y: 0 },
              { x: 5, y: 4 },
              { x: 0, y: 4 },
              { x: 0, y: 0 },
            ],
          },
        ],
      },
    ],
  }),
);

consumeRendererSnapshot(projection.project);
adaptReadonlyEditorStateProjectionToRenderScene(projection);

function consumeRendererSnapshot(project: ReadonlyRendererSnapshotProject): void {
  const room = project.floors[0].rooms[0];

  // @ts-expect-error Renderer consumers must not mutate polygon collections.
  room.roomPolygon.push({ x: 2, y: 2 });

  // @ts-expect-error Renderer consumers must not mutate polygon points.
  room.roomPolygon[0].x = 42;

  // @ts-expect-error Renderer consumers must not swap room snapshots in-place.
  project.floors[0].rooms[0] = room;
}
