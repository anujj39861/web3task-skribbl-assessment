import { Socket, Server } from 'socket.io';
import { ClientToServerEvents, ServerToClientEvents } from '../shared/events.js';
import { RoomManager } from '../models/RoomManager.js';
import { DrawStroke } from '../shared/types.js';

// handles all the real-time drawing events (start, move, end, undo, clear)
// these get called A LOT so keeping them lean
export function registerDrawHandlers(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  socket: Socket<ClientToServerEvents, ServerToClientEvents>
): void {
  const roomManager = RoomManager.getInstance();
  let currentStroke: DrawStroke | null = null;

  // player starts a new brush stroke
  socket.on('draw_start', ({ x, y, color, size, isEraser }) => {
    const room = roomManager.getRoomBySocket(socket.id);
    if (!room || room.game.phase !== 'DRAWING') return;

    // only the current drawer should be able to draw
    const drawer = room.game.currentDrawer;
    if (!drawer || drawer.socketId !== socket.id) return;

    currentStroke = {
      points: [{ x, y }],
      color,
      size,
      isEraser
    };

    // relay to everyone else in the room (except the drawer themselves)
    socket.to(room.id).emit('draw_start', { x, y, color, size, isEraser });
  });

  // player is moving the brush - this fires on every mousemove so it's super frequent
  socket.on('draw_move', ({ x, y }) => {
    const room = roomManager.getRoomBySocket(socket.id);
    if (!room || room.game.phase !== 'DRAWING') return;

    const drawer = room.game.currentDrawer;
    if (!drawer || drawer.socketId !== socket.id) return;

    if (currentStroke) {
      currentStroke.points.push({ x, y });
    }

    socket.to(room.id).emit('draw_move', { x, y });
  });

  // player lifts the pen - save the completed stroke
  socket.on('draw_end', () => {
    const room = roomManager.getRoomBySocket(socket.id);
    if (!room || room.game.phase !== 'DRAWING') return;

    const drawer = room.game.currentDrawer;
    if (!drawer || drawer.socketId !== socket.id) return;

    // only save strokes that actually have points (sometimes we get empty ones)
    if (currentStroke && currentStroke.points.length > 0) {
      room.addStroke(currentStroke);
      currentStroke = null;
    }

    socket.to(room.id).emit('draw_end');
  });

  // clear the whole canvas
  socket.on('canvas_clear', () => {
    const room = roomManager.getRoomBySocket(socket.id);
    if (!room || room.game.phase !== 'DRAWING') return;

    const drawer = room.game.currentDrawer;
    if (!drawer || drawer.socketId !== socket.id) return;

    room.clearCanvas();
    room.broadcast('canvas_clear');
  });

  // undo last stroke (ctrl+z basically)
  socket.on('draw_undo', () => {
    const room = roomManager.getRoomBySocket(socket.id);
    if (!room || room.game.phase !== 'DRAWING') return;

    const drawer = room.game.currentDrawer;
    if (!drawer || drawer.socketId !== socket.id) return;

    const remainingStrokes = room.undoStroke();
    room.broadcast('draw_undo', { strokes: remainingStrokes });
  });
}
