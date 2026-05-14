import {
  addEditorRoom,
  createEditorRoom,
  removeEditorRoom,
  updateEditorRoom,
  type EditorFloor,
  type EditorGuideObject,
  type EditorOpening,
  type EditorPoint,
  type EditorProject,
  type EditorRoom,
  type EditorRoomInput,
  type SharedBoundaryRef,
} from "../../../domain/editor-state.ts";
import { createValidatedEditorOpening } from "../../../domain/opening.ts";

export type EditorMutationCommand =
  | AddRoomPolygonCommand
  | UpdateRoomPolygonCommand
  | RenameRoomCommand
  | RemoveRoomCommand
  | AddEdgeOpeningCommand
  | UpdateEdgeOpeningCommand
  | RemoveEdgeOpeningCommand
  | AddGuideObjectCommand
  | UpdateGuideObjectCommand
  | RemoveGuideObjectCommand;

export interface AddRoomPolygonCommand {
  readonly type: "room.add";
  readonly floorId: string;
  readonly room: EditorRoomInput;
}

export interface UpdateRoomPolygonCommand {
  readonly type: "room.polygon.update";
  readonly floorId: string;
  readonly roomId: string;
  readonly roomPolygon: readonly EditorPoint[];
  readonly sharedBoundaries?: readonly SharedBoundaryRef[];
}

export interface RenameRoomCommand {
  readonly type: "room.rename";
  readonly floorId: string;
  readonly roomId: string;
  readonly roomName: string;
}

export interface RemoveRoomCommand {
  readonly type: "room.remove";
  readonly floorId: string;
  readonly roomId: string;
}

export interface AddEdgeOpeningCommand {
  readonly type: "opening.add";
  readonly floorId: string;
  readonly roomId: string;
  readonly opening: EditorOpening;
}

export interface UpdateEdgeOpeningCommand {
  readonly type: "opening.update";
  readonly floorId: string;
  readonly roomId: string;
  readonly openingId: string;
  readonly patch: Partial<Omit<EditorOpening, "openingId">>;
}

export interface RemoveEdgeOpeningCommand {
  readonly type: "opening.remove";
  readonly floorId: string;
  readonly roomId: string;
  readonly openingId: string;
}

export interface AddGuideObjectCommand {
  readonly type: "object.add";
  readonly floorId: string;
  readonly object: EditorGuideObject;
}

export interface UpdateGuideObjectCommand {
  readonly type: "object.update";
  readonly floorId: string;
  readonly guideObjectId: string;
  readonly patch: Partial<Omit<EditorGuideObject, "guideObjectId" | "floorId">>;
}

export interface RemoveGuideObjectCommand {
  readonly type: "object.remove";
  readonly floorId: string;
  readonly guideObjectId: string;
}

export function executeEditorCommand(
  project: EditorProject,
  command: EditorMutationCommand,
): EditorProject {
  switch (command.type) {
    case "room.add":
      return addEditorRoom(project, command.floorId, command.room);
    case "room.polygon.update":
      return updateEditorRoom(project, command.floorId, command.roomId, {
        roomPolygon: command.roomPolygon,
        sharedBoundaries: command.sharedBoundaries,
      });
    case "room.rename":
      return updateEditorRoom(project, command.floorId, command.roomId, {
        roomName: command.roomName,
      });
    case "room.remove":
      return removeEditorRoom(project, command.floorId, command.roomId);
    case "opening.add":
      return updateRoomEdgeOpenings(project, command.floorId, command.roomId, (room) => [
        ...(room.edgeOpenings ?? []),
        createValidatedEditorOpening(command.opening),
      ]);
    case "opening.update":
      return updateRoomEdgeOpenings(project, command.floorId, command.roomId, (room) => {
        let updated = false;
        const edgeOpenings = (room.edgeOpenings ?? []).map((opening) => {
          if (opening.openingId !== command.openingId) {
            return opening;
          }

          updated = true;
          return createValidatedEditorOpening({
            ...opening,
            ...command.patch,
            openingId: opening.openingId,
          });
        });

        if (!updated) {
          throw new Error(
            `Opening "${command.openingId}" was not found on room "${command.roomId}".`,
          );
        }

        return edgeOpenings;
      });
    case "opening.remove":
      return updateRoomEdgeOpenings(project, command.floorId, command.roomId, (room) => {
        const edgeOpenings = room.edgeOpenings ?? [];
        const nextOpenings = edgeOpenings.filter(
          (opening) => opening.openingId !== command.openingId,
        );

        if (nextOpenings.length === edgeOpenings.length) {
          throw new Error(
            `Opening "${command.openingId}" was not found on room "${command.roomId}".`,
          );
        }

        return nextOpenings;
      });
    case "object.add":
      return addGuideObject(project, command.floorId, command.object);
    case "object.update":
      return updateGuideObject(
        project,
        command.floorId,
        command.guideObjectId,
        command.patch,
      );
    case "object.remove":
      return removeGuideObject(project, command.floorId, command.guideObjectId);
  }
}

export function executeEditorCommands(
  project: EditorProject,
  commands: readonly EditorMutationCommand[],
): EditorProject {
  return commands.reduce(executeEditorCommand, project);
}

function updateRoomEdgeOpenings(
  project: EditorProject,
  floorId: string,
  roomId: string,
  update: (room: EditorRoom) => readonly EditorOpening[],
): EditorProject {
  return updateRoom(project, floorId, roomId, (room) =>
    createEditorRoom({
      roomId: room.roomId,
      roomName: room.roomName,
      roomPolygon: room.roomPolygon,
      sharedBoundaries: room.sharedBoundaries,
      openings: room.openings,
      edgeOpenings: update(room),
      metadata: room.metadata,
    }),
  );
}

function addGuideObject(
  project: EditorProject,
  floorId: string,
  object: EditorGuideObject,
): EditorProject {
  assertGuideObjectDoesNotExist(project, object.guideObjectId);

  return updateFloor(project, floorId, (floor) => ({
    ...floor,
    guideObjects: [...(floor.guideObjects ?? []), { ...object, floorId }],
  }));
}

function updateGuideObject(
  project: EditorProject,
  floorId: string,
  guideObjectId: string,
  patch: Partial<Omit<EditorGuideObject, "guideObjectId" | "floorId">>,
): EditorProject {
  let updated = false;

  const nextProject = updateFloor(project, floorId, (floor) => ({
    ...floor,
    guideObjects: (floor.guideObjects ?? []).map((object) => {
      if (object.guideObjectId !== guideObjectId) {
        return object;
      }

      updated = true;
      return {
        ...object,
        ...patch,
        guideObjectId: object.guideObjectId,
        floorId: object.floorId,
      };
    }),
  }));

  if (!updated) {
    throw new Error(
      `Guide object "${guideObjectId}" was not found on floor "${floorId}".`,
    );
  }

  return nextProject;
}

function removeGuideObject(
  project: EditorProject,
  floorId: string,
  guideObjectId: string,
): EditorProject {
  let removed = false;

  const nextProject = updateFloor(project, floorId, (floor) => {
    const guideObjects = floor.guideObjects ?? [];
    const nextGuideObjects = guideObjects.filter((object) => {
      const shouldRemove = object.guideObjectId === guideObjectId;
      removed ||= shouldRemove;
      return !shouldRemove;
    });

    return {
      ...floor,
      guideObjects: nextGuideObjects,
    };
  });

  if (!removed) {
    throw new Error(
      `Guide object "${guideObjectId}" was not found on floor "${floorId}".`,
    );
  }

  return nextProject;
}

function updateRoom(
  project: EditorProject,
  floorId: string,
  roomId: string,
  update: (room: EditorRoom) => EditorRoom,
): EditorProject {
  let updated = false;

  const nextProject = updateFloor(project, floorId, (floor) => ({
    ...floor,
    rooms: floor.rooms.map((room) => {
      if (room.roomId !== roomId) {
        return room;
      }

      updated = true;
      return update(room);
    }),
  }));

  if (!updated) {
    throw new Error(`Room "${roomId}" was not found on floor "${floorId}".`);
  }

  return nextProject;
}

function updateFloor(
  project: EditorProject,
  floorId: string,
  update: (floor: EditorFloor) => EditorFloor,
): EditorProject {
  let updated = false;

  const floors = project.floors.map((floor) => {
    if (floor.floorId !== floorId) {
      return floor;
    }

    updated = true;
    return update(floor);
  });

  if (!updated) {
    throw new Error(`Floor "${floorId}" was not found.`);
  }

  return {
    ...project,
    floors,
  };
}

function assertGuideObjectDoesNotExist(
  project: EditorProject,
  guideObjectId: string,
): void {
  const exists = project.floors.some((floor) =>
    (floor.guideObjects ?? []).some(
      (object) => object.guideObjectId === guideObjectId,
    ),
  );

  if (exists) {
    throw new Error(`Guide object "${guideObjectId}" already exists.`);
  }
}
