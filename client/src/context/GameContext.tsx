import React, { createContext, useContext, useState, useEffect } from 'react';
import { socket } from '../socket';
import {
  PlayerData,
  RoomSettings,
  PublicGameState,
  ChatMessage,
  LeaderboardEntry
} from '../shared/types';

// all the stuff we expose through the context
// this grew pretty big... might want to split it later
interface GameContextType {
  roomId: string | null;
  selfId: string | null;
  isHost: boolean;
  players: PlayerData[];
  settings: RoomSettings | null;
  gameState: PublicGameState | null;
  chatMessages: ChatMessage[];
  wordOptions: string[] | null;
  roundEndData: {
    word: string;
    scores: Record<string, number>;
    nextDrawerName?: string;
  } | null;
  gameOverData: {
    winner: PlayerData;
    leaderboard: LeaderboardEntry[];
  } | null;
  isDrawer: boolean;
  hasGuessed: boolean;
  errorMessage: string | null;
  createRoom: (name: string, settings?: Partial<RoomSettings>) => void;
  joinRoom: (roomId: string, name: string) => void;
  startGame: () => void;
  chooseWord: (word: string) => void;
  sendGuessOrChat: (text: string) => void;
  leaveRoom: () => void;
  kickPlayer: (playerId: string) => void;
  clearError: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [selfId, setSelfId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [settings, setSettings] = useState<RoomSettings | null>(null);
  const [gameState, setGameState] = useState<PublicGameState | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [wordOptions, setWordOptions] = useState<string[] | null>(null);
  const [roundEndData, setRoundEndData] = useState<{
    word: string;
    scores: Record<string, number>;
    nextDrawerName?: string;
  } | null>(null);
  const [gameOverData, setGameOverData] = useState<{
    winner: PlayerData;
    leaderboard: LeaderboardEntry[];
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // derived state - easier to compute here than in every component
  const isDrawer = Boolean(selfId && gameState?.drawerId === selfId);
  const currentSelf = players.find(p => p.id === selfId);
  const hasGuessed = Boolean(currentSelf?.hasGuessed);

  useEffect(() => {
    // === Socket event listeners ===
    // these handle all the real-time updates from the server

    socket.on('room_data', data => {
      console.log('[GameContext] room_data received:', data.roomId);
      setRoomId(data.roomId);
      setSettings(data.settings);
      setPlayers(data.players);
      setSelfId(data.selfId);
      setIsHost(data.isHost);
      // reset chat and overlays when joining a new room
      setChatMessages([]);
      setGameOverData(null);
      setRoundEndData(null);
    });

    socket.on('player_joined', data => {
      setPlayers(data.players);
      // add a system message so everyone knows someone joined
      setChatMessages(prev => [
        ...prev,
        {
          id: Math.random().toString(), // good enough for chat msg ids
          playerName: 'System',
          text: `${data.player.name} joined the room!`,
          type: 'system',
          timestamp: Date.now()
        }
      ]);
    });

    socket.on('player_left', data => {
      setPlayers(data.players);
      // if the host left, we might become the new host
      if (data.newHostId && data.newHostId === selfId) {
        setIsHost(true);
      }
    });

    socket.on('game_state', state => {
      // console.log('[GameContext] game_state update:', state.phase);
      setGameState(state);
    });

    socket.on('round_start', data => {
      setRoundEndData(null); // clear previous round overlay
      if (data.wordOptions) {
        setWordOptions(data.wordOptions);
      } else {
        setWordOptions(null);
      }
    });

    socket.on('word_chosen', () => {
      setWordOptions(null);
    });

    // FIXME: this fires every second and causes a re-render each time
    // might want to optimize with useRef instead of state for the timer
    socket.on('timer_tick', data => {
      setGameState(prev => (prev ? { ...prev, timeLeft: data.timeLeft } : null));
    });

    socket.on('hint_update', data => {
      setGameState(prev => (prev ? { ...prev, wordMask: data.wordMask } : null));
    });

    // keep only last 100 messages so we don't eat up memory
    socket.on('chat_message', msg => {
      setChatMessages(prev => [...prev.slice(-100), msg]);
    });

    socket.on('round_end', data => {
      setRoundEndData(data);
      setPlayers(data.players);
      setWordOptions(null);
    });

    socket.on('game_over', data => {
      console.log('[GameContext] game over! winner:', data.winner.name);
      setGameOverData(data);
    });

    socket.on('error_message', data => {
      console.warn('[GameContext] error from server:', data.message);
      setErrorMessage(data.message);
    });

    // cleanup all listeners on unmount
    return () => {
      socket.off('room_data');
      socket.off('player_joined');
      socket.off('player_left');
      socket.off('game_state');
      socket.off('round_start');
      socket.off('word_chosen');
      socket.off('timer_tick');
      socket.off('hint_update');
      socket.off('chat_message');
      socket.off('round_end');
      socket.off('game_over');
      socket.off('error_message');
    };
  }, [selfId]);

  const createRoom = (hostName: string, customSettings?: Partial<RoomSettings>) => {
    socket.emit('create_room', { hostName, settings: customSettings }, response => {
      if (!response.success && response.error) {
        setErrorMessage(response.error);
      }
    });
  };

  const joinRoom = (code: string, playerName: string) => {
    // normalize the room code - always uppercase, no whitespace
    socket.emit('join_room', { roomId: code.trim().toUpperCase(), playerName }, response => {
      if (!response.success && response.error) {
        setErrorMessage(response.error);
      }
    });
  };

  const startGame = () => {
    socket.emit('start_game');
  };

  const chooseWord = (word: string) => {
    socket.emit('word_chosen', { word });
    setWordOptions(null); // hide the modal immediately, feels snappier
  };

  // this does double duty - sends a guess during drawing phase, or just a chat message otherwise
  const sendGuessOrChat = (text: string) => {
    if (!text.trim()) return;
    if (gameState?.phase === 'DRAWING' && !isDrawer && !hasGuessed) {
      socket.emit('guess', { text: text.trim() });
    } else {
      socket.emit('chat', { text: text.trim() });
    }
  };

  const leaveRoom = () => {
    socket.emit('leave_room');
    // reset everything locally
    setRoomId(null);
    setGameState(null);
    setPlayers([]);
  };

  const kickPlayer = (playerId: string) => {
    socket.emit('kick_player', { playerId });
  };

  const clearError = () => {
    setErrorMessage(null);
  };

  return (
    <GameContext.Provider
      value={{
        roomId,
        selfId,
        isHost,
        players,
        settings,
        gameState,
        chatMessages,
        wordOptions,
        roundEndData,
        gameOverData,
        isDrawer,
        hasGuessed,
        errorMessage,
        createRoom,
        joinRoom,
        startGame,
        chooseWord,
        sendGuessOrChat,
        leaveRoom,
        kickPlayer,
        clearError
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

// custom hook so we don't have to do useContext(GameContext) everywhere
export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
