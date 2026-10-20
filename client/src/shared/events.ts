// Socket.IO event definitions
// These interfaces define what events the client and server can emit to each other
// Having these typed makes it way easier to catch bugs at compile time

import {
  RoomSettings,
  PlayerData,
  PublicGameState,
  DrawPoint,
  ChatMessage,
  LeaderboardEntry,
  DrawStroke
} from './types';

// Events the client sends TO the server
export interface ClientToServerEvents {
  // room management
  create_room: (
    payload: { hostName: string; avatar?: string; settings?: Partial<RoomSettings> },
    callback?: (response: { success: boolean; roomId?: string; error?: string }) => void
  ) => void;

  join_room: (
    payload: { roomId: string; playerName: string; avatar?: string },
    callback?: (response: { success: boolean; error?: string }) => void
  ) => void;

  leave_room: () => void;

  // game flow
  start_game: () => void;
  word_chosen: (payload: { word: string }) => void;

  // drawing events - these fire a LOT during active drawing
  draw_start: (payload: { x: number; y: number; color: string; size: number; isEraser?: boolean }) => void;
  draw_move: (payload: { x: number; y: number }) => void;
  draw_end: () => void;

  canvas_clear: () => void;
  draw_undo: () => void;

  // chat & guessing (both go through the same handler on the server)
  guess: (payload: { text: string }) => void;
  chat: (payload: { text: string }) => void;

  // host moderation
  kick_player: (payload: { playerId: string }) => void;
}

// Events the server sends TO the client
export interface ServerToClientEvents {
  // room state
  room_data: (payload: {
    roomId: string;
    settings: RoomSettings;
    players: PlayerData[];
    selfId: string;
    isHost: boolean;
  }) => void;

  player_joined: (payload: { player: PlayerData; players: PlayerData[] }) => void;
  player_left: (payload: { playerId: string; players: PlayerData[]; newHostId?: string }) => void;

  // game state updates
  game_state: (payload: PublicGameState) => void;

  round_start: (payload: {
    drawerId: string;
    drawerName: string;
    round: number;
    totalRounds: number;
    wordOptions?: string[];   // only the drawer gets this!
    drawTime: number;
    wordLength?: number;
  }) => void;

  word_chosen: (payload: { wordLength: number; blanks: string }) => void;

  timer_tick: (payload: { timeLeft: number }) => void;
  hint_update: (payload: { wordMask: string }) => void;

  // drawing relay - server just forwards these from the drawer to everyone else
  draw_start: (payload: { x: number; y: number; color: string; size: number; isEraser?: boolean }) => void;
  draw_move: (payload: { x: number; y: number }) => void;
  draw_end: () => void;
  draw_sync_all: (payload: { strokes: DrawStroke[] }) => void;

  canvas_clear: () => void;
  draw_undo: (payload: { strokes: DrawStroke[] }) => void;

  // guess results
  guess_result: (payload: {
    correct: boolean;
    playerId: string;
    playerName: string;
    points: number;
    isClose?: boolean;
  }) => void;

  chat_message: (payload: ChatMessage) => void;

  // round & game end
  round_end: (payload: {
    word: string;
    scores: Record<string, number>;
    players: PlayerData[];
    nextDrawerName?: string;
  }) => void;

  game_over: (payload: {
    winner: PlayerData;
    leaderboard: LeaderboardEntry[];
  }) => void;

  error_message: (payload: { message: string }) => void;
}
