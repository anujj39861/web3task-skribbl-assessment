// All the shared types between client and server
// Keeping these in one place so both sides stay in sync

export type GamePhase =
  | 'LOBBY'
  | 'WORD_SELECTION'
  | 'DRAWING'
  | 'ROUND_END'
  | 'GAME_OVER';

export interface RoomSettings {
  maxPlayers: number;        // min 2, max 20
  rounds: number;            // usually 2-10
  drawTime: number;          // seconds - how long each drawer gets
  wordCount: number;         // how many word choices the drawer sees (usually 3)
  hints: number;             // number of letter hints to reveal during drawing
  customWords?: string[];    // optional custom word list from the host
  isPrivate: boolean;
}

export interface PlayerData {
  id: string;
  socketId: string;
  name: string;
  avatar: string;            // dicebear avatar URL
  score: number;
  isHost: boolean;
  hasGuessed: boolean;
  guessedAt?: number;        // when they guessed (used for scoring order)
}

// coordinates are normalized to 0-1 range so different screen sizes 
// still render the drawing correctly
export interface DrawPoint {
  x: number;   // 0 to 1
  y: number;   // 0 to 1
}

export interface DrawStroke {
  points: DrawPoint[];
  color: string;
  size: number;              // also normalized
  isEraser?: boolean;
}

export interface ChatMessage {
  id: string;
  playerId?: string;
  playerName: string;
  text: string;
  type: 'chat' | 'system' | 'correct' | 'close';
  timestamp: number;
}

export interface LeaderboardEntry {
  playerId: string;
  playerName: string;
  avatar: string;
  score: number;
  rank: number;
}

// this is what gets broadcast to all clients every time game state changes
// note: we never send the actual word to guessers, only the mask
export interface PublicGameState {
  phase: GamePhase;
  round: number;
  totalRounds: number;
  drawerId: string | null;
  drawerName: string | null;
  wordMask: string;          // e.g. "_ _ a _ _"
  wordLength: number;
  hintsRevealed: number;
  timeLeft: number;
  scores: Record<string, number>;
}
