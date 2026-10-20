import { Socket, Server } from 'socket.io';
import { ClientToServerEvents, ServerToClientEvents } from '../shared/events.js';
import { RoomManager } from '../models/RoomManager.js';
import { Player } from '../models/Player.js';
import { generateId } from '../utils/idGen.js';

// handles room creation, joining, leaving, and kicking
export function registerRoomHandlers(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  socket: Socket<ClientToServerEvents, ServerToClientEvents>
): void {
  const roomManager = RoomManager.getInstance();

  socket.on('create_room', ({ hostName, avatar, settings }, callback) => {
    try {
      const playerId = generateId();
      const hostPlayer = new Player(playerId, socket.id, hostName || 'Host', avatar, true);
      const room = roomManager.createRoom(hostPlayer, settings);

      // join the socket.io room so broadcasts work
      socket.join(room.id);
      console.log(`[Room] ${hostName} created room ${room.id}`);

      socket.emit('room_data', {
        roomId: room.id,
        settings: room.settings,
        players: room.players.map(p => p.toJSON()),
        selfId: hostPlayer.id,
        isHost: true
      });

      if (callback) {
        callback({ success: true, roomId: room.id });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create room';
      console.error('[Room] Error creating room:', message);
      if (callback) callback({ success: false, error: message });
    }
  });

  socket.on('join_room', ({ roomId, playerName, avatar }, callback) => {
    try {
      const room = roomManager.getRoom(roomId);
      if (!room) {
        if (callback) callback({ success: false, error: 'Room not found' });
        return;
      }

      if (room.players.length >= room.settings.maxPlayers) {
        if (callback) callback({ success: false, error: 'Room is full' });
        return;
      }

      const playerId = generateId();
      let newPlayer = new Player(playerId, socket.id, playerName || 'Player', avatar, false);

      const added = room.addPlayer(newPlayer);
      if (!added) {
        if (callback) callback({ success: false, error: 'Could not join room' });
        return;
      }

      roomManager.registerSocketToRoom(socket.id, room.id);
      socket.join(room.id);
      console.log(`[Room] ${playerName} joined room ${room.id}`);

      // send room data to the joining player
      socket.emit('room_data', {
        roomId: room.id,
        settings: room.settings,
        players: room.players.map(p => p.toJSON()),
        selfId: newPlayer.id,
        isHost: false
      });

      // if game is already in progress, sync the canvas so they can see what's drawn
      if (room.game.phase === 'DRAWING' && room.game.strokes.length > 0) {
        socket.emit('draw_sync_all', { strokes: room.game.strokes });
      }

      // let everyone else in the room know someone joined
      socket.to(room.id).emit('player_joined', {
        player: newPlayer.toJSON(),
        players: room.players.map(p => p.toJSON())
      });

      room.game.broadcastState();

      if (callback) callback({ success: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to join room';
      console.error('[Room] Error joining room:', message);
      if (callback) callback({ success: false, error: message });
    }
  });

  // only the host can kick players
  socket.on('kick_player', ({ playerId }) => {
    const room = roomManager.getRoomBySocket(socket.id);
    if (!room) return;

    const caller = room.getPlayerBySocket(socket.id);
    if (!caller || !caller.isHost) return; // nice try buddy

    const target = room.getPlayer(playerId);
    if (!target || target.isHost) return; // can't kick yourself lol

    console.log(`[Room] Host kicked player ${target.name} from room ${room.id}`);
    io.in(target.socketId).socketsLeave(room.id);
    roomManager.unregisterSocket(target.socketId);
  });

  socket.on('leave_room', () => {
    roomManager.unregisterSocket(socket.id);
  });
}
