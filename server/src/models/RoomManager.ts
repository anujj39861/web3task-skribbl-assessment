import { Server } from 'socket.io';
import { Room } from './Room.js';
import { Player } from './Player.js';
import { RoomSettings } from '../shared/types.js';
import { generateRoomId } from '../utils/idGen.js';
import { ClientToServerEvents, ServerToClientEvents } from '../shared/events.js';

// singleton that manages all active rooms
// keeps track of which socket is in which room for quick lookups
export class RoomManager {
  private static instance: RoomManager;
  private rooms: Map<string, Room> = new Map();
  private socketToRoom: Map<string, string> = new Map(); // socketId -> roomId mapping
  private io!: Server<ClientToServerEvents, ServerToClientEvents>;

  private constructor() {}

  public static getInstance(): RoomManager {
    if (!RoomManager.instance) {
      RoomManager.instance = new RoomManager();
    }
    return RoomManager.instance;
  }

  public init(io: Server<ClientToServerEvents, ServerToClientEvents>): void {
    this.io = io;
  }

  public createRoom(
    hostPlayer: Player,
    settings: Partial<RoomSettings> = {}
  ): Room {
    // keep generating until we get a unique ID (collision is super rare but just in case)
    let roomId = generateRoomId(6);
    while (this.rooms.has(roomId)) {
      roomId = generateRoomId(6);
    }

    const room = new Room(roomId, hostPlayer, settings, this.io);
    this.rooms.set(roomId, room);
    this.socketToRoom.set(hostPlayer.socketId, roomId);

    console.log(`[RoomManager] Room created: ${roomId} by ${hostPlayer.name}`);
    return room;
  }

  public getRoom(roomId: string): Room | undefined {
    // always uppercase the room id so joins are case-insensitive
    return this.rooms.get(roomId.toUpperCase());
  }

  public getRoomBySocket(socketId: string): Room | undefined {
    const roomId = this.socketToRoom.get(socketId);
    if (!roomId) return undefined;
    return this.rooms.get(roomId);
  }

  public registerSocketToRoom(socketId: string, roomId: string): void {
    this.socketToRoom.set(socketId, roomId.toUpperCase());
  }

  // handles cleanup when a socket disconnects
  public unregisterSocket(socketId: string): Room | undefined {
    const roomId = this.socketToRoom.get(socketId);
    if (!roomId) return undefined;

    this.socketToRoom.delete(socketId);
    const room = this.rooms.get(roomId);

    if (room) {
      const { removedPlayer, newHostId } = room.removePlayer(socketId);

      // If room is empty, garbage collect it
      if (room.players.length === 0) {
        console.log(`[RoomManager] Room ${roomId} is empty, deleting`);
        this.rooms.delete(roomId);
      } else if (removedPlayer) {
        // let everyone else know someone left
        room.broadcast('player_left', {
          playerId: removedPlayer.id,
          players: room.players.map(p => p.toJSON()),
          newHostId
        });
      }
    }

    return room;
  }

  public getAllRooms(): Room[] {
    return Array.from(this.rooms.values());
  }
}
