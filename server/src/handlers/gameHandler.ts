import { Socket, Server } from 'socket.io';
import { ClientToServerEvents, ServerToClientEvents } from '../shared/events.js';
import { RoomManager } from '../models/RoomManager.js';

// handles starting the game and word selection
export function registerGameHandlers(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  socket: Socket<ClientToServerEvents, ServerToClientEvents>
): void {
  const roomManager = RoomManager.getInstance();

  // only the host can start the game
  socket.on('start_game', () => {
    const room = roomManager.getRoomBySocket(socket.id);
    if (!room) return;

    const caller = room.getPlayerBySocket(socket.id);
    if (!caller || !caller.isHost) return;

    if (room.players.length < 2) {
      socket.emit('error_message', { message: 'Need at least 2 players to start the game!' });
      return;
    }

    console.log(`[Game] Host "${caller.name}" started game in room ${room.id}`);
    room.game.start();
  });

  // the drawer picks which word they want to draw
  socket.on('word_chosen', ({ word }) => {
    const room = roomManager.getRoomBySocket(socket.id);
    if (!room || room.game.phase !== 'WORD_SELECTION') return;

    const drawer = room.game.currentDrawer;
    if (!drawer || drawer.socketId !== socket.id) return;

    // console.log(`[Game] Drawer chose word: ${word}`); // don't log the word in production lol
    room.game.chooseWord(word);
  });
}
