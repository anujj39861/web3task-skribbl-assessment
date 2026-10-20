import { io, Socket } from 'socket.io-client';
import { ClientToServerEvents, ServerToClientEvents } from './shared/events';

// figured this out from the socket.io docs - in prod we use same origin,
// but locally we need to hit port 3001 where the server runs
const SERVER_URL = import.meta.env.VITE_SERVER_URL || (
  window.location.hostname === 'localhost' ? 'http://localhost:3001' : window.location.origin
);

// learned from the socket.io docs that typed sockets give you autocomplete on events
export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(SERVER_URL, {
  autoConnect: true,
  transports: ['websocket', 'polling'], // websocket first for speed, polling as fallback
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

// handy for debugging connection issues in the browser console
console.log('[Socket] connecting to:', SERVER_URL);

// TODO: maybe add a toast notification when the socket disconnects?
socket.on('connect', () => console.log('[Socket] connected! id:', socket.id));
socket.on('disconnect', (reason) => console.log('[Socket] disconnected:', reason));
