import type {
  EditorFloorState,
  EditorOpening,
  EditorProjectState,
  EditorRoom,
  EditorSharedBoundary,
  EditorVerticalConnector,
  EditorWallSegment,
} from "./project-serializer.ts";
import type {
  EditorProjectAnnotation,
  EditorProjectAsset,
} from "./project-non-geometry-serializer.ts";

export interface ProjectBoundaryLink {
  boundary: EditorSharedBoundary;
  floor: EditorFloorState;
  room: EditorRoom;
  adjacentRoom: EditorRoom | null;
  adjacentFloor: EditorFloorState | null;
}

export interface ProjectOpeningLink {
  opening: EditorOpening;
  floor: EditorFloorState;
  room: EditorRoom;
  wall: EditorWallSegment | null;
}

export interface ProjectVerticalConnectorLink {
  connector: EditorVerticalConnector;
  floor: EditorFloorState;
  room: EditorRoom | null;
  targetFloor: EditorFloorState | null;
}

export interface ProjectAssetLink {
  asset: EditorProjectAsset;
  floor: EditorFloorState | null;
}

export interface ProjectAnnotationLink {
  annotation: EditorProjectAnnotation;
  floor: EditorFloorState | null;
  room: EditorRoom | null;
}

export interface ProjectRelationshipGraph {
  floorById: ReadonlyMap<string, EditorFloorState>;
  roomById: ReadonlyMap<string, EditorRoom>;
  roomFloorById: ReadonlyMap<string, EditorFloorState>;
  boundaryByEdgeId: ReadonlyMap<string, ProjectBoundaryLink>;
  openingById: ReadonlyMap<string, ProjectOpeningLink>;
  openingByEdgeId: ReadonlyMap<string, readonly ProjectOpeningLink[]>;
  connectorById: ReadonlyMap<string, ProjectVerticalConnectorLink>;
  assetById: ReadonlyMap<string, ProjectAssetLink>;
  annotationById: ReadonlyMap<string, ProjectAnnotationLink>;
}

const PROJECT_RELATIONSHIP_GRAPH = Symbol("projectRelationshipGraph");

type ProjectWithRelationshipGraph = EditorProjectState & {
  [PROJECT_RELATIONSHIP_GRAPH]?: ProjectRelationshipGraph;
};

export function relinkProjectRelationships(
  project: EditorProjectState,
): EditorProjectState {
  const floorById = new Map<string, EditorFloorState>();
  const roomById = new Map<string, EditorRoom>();
  const roomFloorById = new Map<string, EditorFloorState>();
  const boundaryByEdgeId = new Map<string, ProjectBoundaryLink>();
  const openingById = new Map<string, ProjectOpeningLink>();
  const openingsByEdgeId = new Map<string, ProjectOpeningLink[]>();
  const connectorById = new Map<string, ProjectVerticalConnectorLink>();
  const assetById = new Map<string, ProjectAssetLink>();
  const annotationById = new Map<string, ProjectAnnotationLink>();

  for (const floor of project.floors) {
    floorById.set(floor.id, floor);
  }

  for (const floor of project.floors) {
    for (const room of floor.rooms) {
      roomById.set(room.roomId, room);
      roomFloorById.set(room.roomId, floor);
    }
  }

  for (const floor of project.floors) {
    for (const room of floor.rooms) {
      const wallsByEdgeId = new Map(
        room.walls.map((wall) => [wall.edgeId, wall] as const),
      );

      for (const boundary of room.sharedBoundaries) {
        const adjacentRoom = roomById.get(boundary.adjacentRoomId) ?? null;
        boundaryByEdgeId.set(boundary.edgeId, {
          boundary,
          floor,
          room,
          adjacentRoom,
          adjacentFloor:
            adjacentRoom == null
              ? null
              : (roomFloorById.get(adjacentRoom.roomId) ?? null),
        });
      }

      for (const opening of room.openings) {
        const link: ProjectOpeningLink = {
          opening,
          floor,
          room,
          wall: wallsByEdgeId.get(opening.attachedEdgeId) ?? null,
        };

        openingById.set(opening.openingId, link);

        const openingsForEdge = openingsByEdgeId.get(opening.attachedEdgeId);

        if (openingsForEdge == null) {
          openingsByEdgeId.set(opening.attachedEdgeId, [link]);
        } else {
          openingsForEdge.push(link);
        }
      }
    }

    for (const connector of floor.verticalConnectors) {
      connectorById.set(connector.connectorId, {
        connector,
        floor,
        room: roomById.get(connector.roomId) ?? null,
        targetFloor: floorById.get(connector.targetFloorId) ?? null,
      });
    }
  }

  for (const asset of project.assets ?? []) {
    assetById.set(asset.assetId, {
      asset,
      floor: asset.floorId == null ? null : (floorById.get(asset.floorId) ?? null),
    });
  }

  for (const annotation of project.annotations ?? []) {
    annotationById.set(annotation.annotationId, {
      annotation,
      floor: floorById.get(annotation.floorId) ?? null,
      room:
        annotation.targetRoomId == null
          ? null
          : (roomById.get(annotation.targetRoomId) ?? null),
    });
  }

  const relationshipGraph: ProjectRelationshipGraph = {
    floorById,
    roomById,
    roomFloorById,
    boundaryByEdgeId,
    openingById,
    openingByEdgeId: new Map(
      Array.from(openingsByEdgeId, ([edgeId, links]) => [edgeId, links.slice()]),
    ),
    connectorById,
    assetById,
    annotationById,
  };

  Object.defineProperty(project as ProjectWithRelationshipGraph, PROJECT_RELATIONSHIP_GRAPH, {
    value: relationshipGraph,
    configurable: true,
    enumerable: false,
    writable: true,
  });

  return project;
}

export function getProjectRelationshipGraph(
  project: EditorProjectState,
): ProjectRelationshipGraph {
  const graph = (project as ProjectWithRelationshipGraph)[PROJECT_RELATIONSHIP_GRAPH];

  if (graph != null) {
    return graph;
  }

  relinkProjectRelationships(project);

  return (project as ProjectWithRelationshipGraph)[PROJECT_RELATIONSHIP_GRAPH]!;
}
