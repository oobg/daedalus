export interface EditorRoom {
  readonly id: string;
  readonly isActive: boolean;
}

export interface RoomSelectionState<Room extends EditorRoom = EditorRoom> {
  readonly rooms: readonly Room[];
  readonly activeRoomId: string | null;
}

export interface SelectRoomResult<Room extends EditorRoom = EditorRoom> {
  readonly state: RoomSelectionState<Room>;
  readonly activeRoom: Room;
}

export const selectRoom = <Room extends EditorRoom>(
  state: RoomSelectionState<Room>,
  roomId: string,
): SelectRoomResult<Room> => {
  let activeRoom: Room | null = null;

  const rooms = state.rooms.map((room) => {
    const shouldBeActive = room.id === roomId;

    if (!shouldBeActive && room.isActive === false) {
      return room;
    }

    if (shouldBeActive && room.isActive === true) {
      activeRoom = room;
      return room;
    }

    const nextRoom = {
      ...room,
      isActive: shouldBeActive,
    };

    if (shouldBeActive) {
      activeRoom = nextRoom;
    }

    return nextRoom;
  });

  if (activeRoom === null) {
    throw new Error(`Room "${roomId}" was not found.`);
  }

  return {
    state: {
      rooms,
      activeRoomId: roomId,
    },
    activeRoom,
  };
};
