import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { ClientToServerEvents, ServerToClientEvents } from './shared/events.js';
import { RoomManager } from './models/RoomManager.js';
import { registerRoomHandlers } from './handlers/roomHandler.js';
import { registerDrawHandlers } from './handlers/drawHandler.js';
import { registerGameHandlers } from './handlers/gameHandler.js';
import { registerChatHandlers } from './handlers/chatHandler.js';

// need these for __dirname in ESM - can't just use __dirname like in CommonJS
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

// Environment config (loaded via dotenv or defaults)
const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Setup CORS - had to add 127.0.0.1 because localhost wasn't always resolving
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', CLIENT_URL],
  credentials: true
}));
app.use(express.json());

// Setup Socket.IO Server
// learned from the socket.io docs that you need to pass cors config here too
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173', CLIENT_URL],
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 30000,
  pingInterval: 15000
});

// Initialize RoomManager with io instance (singleton pattern)
const roomManager = RoomManager.getInstance();
roomManager.init(io);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    activeRooms: roomManager.getAllRooms().length,
    timestamp: new Date().toISOString()
  });
});

// Serve frontend build if deployed full-stack
const clientDistPath = path.resolve(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));

// catch-all route - serves the SPA for any non-api routes
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
    return next();
  }
  res.sendFile(path.join(clientDistPath, 'index.html'), (err) => {
    if (err) {
      // if frontend isn't built yet, just show a message
      res.status(200).send('Skribbl.io Server running. Run frontend with: npm run dev:client');
    }
  });
});

// WebSocket connection lifecycle
// each connection gets all handlers registered on it
io.on('connection', (socket) => {
  console.log(`[Socket Connected] ID: ${socket.id}`);

  registerRoomHandlers(io, socket);
  registerDrawHandlers(io, socket);
  registerGameHandlers(io, socket);
  registerChatHandlers(io, socket);

  socket.on('disconnect', (reason) => {
    console.log(`[Socket Disconnected] ID: ${socket.id}, reason: ${reason}`);
    // clean up player from whatever room they were in
    roomManager.unregisterSocket(socket.id);
  });
});

// fire it up!
httpServer.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 skribbl.io Clone Server listening on :${PORT}`);
  console.log(`📡 WebSocket ready for connections`);
  console.log(`===============================================`);
});
