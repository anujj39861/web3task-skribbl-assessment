import React from 'react';
import { useGame } from '../../context/GameContext';
import { Clock, LogOut, CheckCircle2 } from 'lucide-react';

export const GameHeader: React.FC = () => {
  const { gameState, isDrawer, hasGuessed, leaveRoom, roomId } = useGame();

  if (!gameState) return null;

  const timeLeft = gameState.timeLeft ?? 0;
  // flash red when time is running out - 10s threshold feels right
  const isUrgent = timeLeft <= 10 && gameState.phase === 'DRAWING';

  // TODO: add sound effect when timer gets urgent

  return (
    <header className="bg-slate-800/90 backdrop-blur border border-slate-700/80 rounded-xl px-4 py-2.5 flex items-center justify-between shadow-lg select-none">
      {/* Left: Round & Room Code */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Room: <strong className="text-indigo-400 font-mono tracking-normal">{roomId}</strong>
          </span>
          <span className="text-sm font-bold font-game text-white">
            Round {gameState.round} / {gameState.totalRounds}
          </span>
        </div>
      </div>

      {/* Center: shows the word (for drawer) or blanks/hints (for guessers) */}
      <div className="flex flex-col items-center">
        {gameState.phase === 'DRAWING' ? (
          <div className="flex items-center gap-2">
            {isDrawer ? (
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Drawing:</span>
                {/* strip whitespace from word mask so it displays cleaner */}
                <span className="text-lg font-game font-bold tracking-wider text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-3 py-0.5 rounded-lg">
                  {gameState.wordMask.replace(/\s+/g, '')}
                </span>
              </div>
            ) : hasGuessed ? (
              <div className="flex items-center gap-2 text-emerald-400 font-game font-semibold text-sm bg-emerald-950/50 px-3 py-1 rounded-lg border border-emerald-500/30">
                <CheckCircle2 size={16} />
                <span>You guessed it!</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {/* the tracking-[0.25em] gives nice spacing between the blanks */}
                <span className="text-lg font-mono font-bold tracking-[0.25em] text-amber-300 bg-slate-900/80 px-4 py-1 rounded-lg border border-slate-700">
                  {gameState.wordMask || `_ `.repeat(gameState.wordLength)}
                </span>
                <span className="text-xs text-slate-400 font-medium">({gameState.wordLength})</span>
              </div>
            )}
          </div>
        ) : gameState.phase === 'WORD_SELECTION' ? (
          <span className="text-sm font-game font-medium text-amber-400 animate-pulse">
            Waiting for word selection...
          </span>
        ) : (
          <span className="text-sm font-game font-medium text-slate-400">
            {gameState.phase}
          </span>
        )}
      </div>

      {/* Right: Timer & Leave button */}
      <div className="flex items-center gap-3">
        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold font-mono text-sm border transition-colors ${
            isUrgent
              ? 'bg-rose-500/20 text-rose-400 border-rose-500 animate-pulse'
              : 'bg-slate-900/60 text-slate-200 border-slate-700'
          }`}
          title="Time Remaining"
        >
          {/* spin the clock icon when time is running out - nice touch imo */}
          <Clock size={16} className={isUrgent ? 'animate-spin' : ''} />
          <span>{timeLeft}s</span>
        </div>

        <button
          onClick={leaveRoom}
          className="p-1.5 hover:bg-slate-700 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
          title="Leave Room"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
};
