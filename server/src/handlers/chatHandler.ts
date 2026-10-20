import { Socket, Server } from 'socket.io';
import { ClientToServerEvents, ServerToClientEvents } from '../shared/events.js';
import { RoomManager } from '../models/RoomManager.js';

// handles chat messages / guesses from players
// both 'guess' and 'chat' events go through handleGuess
// because the game needs to check if a "chat" message is actually a correct guess
export function registerChatHandlers(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  socket: Socket<ClientToServerEvents, ServerToClientEvents>
): void {
  const roomManager = RoomManager.getInstance();

  socket.on('guess', ({ text }) => {
    const room = roomManager.getRoomBySocket(socket.id);
    if (!room) return;

    const player = room.getPlayerBySocket(socket.id);
    if (!player) return;

    // FIXME: should we sanitize/trim the text here before passing it in?
    room.game.handleGuess(player, text);
  });

  // this is basically the same as guess - we funnel all chat through the game
  // so it can detect correct answers even from the regular chat input
  socket.on('chat', ({ text }) => {
    const room = roomManager.getRoomBySocket(socket.id);
    if (!room) return;

    const player = room.getPlayerBySocket(socket.id);
    if (!player) return;

    room.game.handleGuess(player, text);
  });
}
