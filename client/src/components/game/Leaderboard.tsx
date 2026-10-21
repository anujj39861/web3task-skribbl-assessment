import React from 'react';
import { useGame } from '../../context/GameContext';
import { Crown, Pencil, Check, Trophy } from 'lucide-react';

export const Leaderboard: React.FC = () => {
  const { players, selfId, gameState } = useGame();

  // sort by score descending so the leader is always on top
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="bg-slate-800/90 backdrop-blur border border-slate-700/80 rounded-xl p-3 flex flex-col h-full shadow-lg select-none">
      <div className="flex items-center gap-2 pb-2 mb-2 border-b border-slate-700/60">
        <Trophy size={16} className="text-amber-400" />
        <h3 className="font-game font-bold text-sm text-slate-200">Scoreboard</h3>
      </div>

      {/* scrollable player list in case there are lots of players */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {sortedPlayers.map((player, index) => {
          const isCurrentDrawer = gameState?.drawerId === player.id;
          const isSelf = player.id === selfId;

          return (
            <div
              key={player.id}
              className={`flex items-center justify-between p-2 rounded-lg border transition-all ${
                player.hasGuessed
                  ? 'bg-emerald-950/40 border-emerald-500/40'
                  : isSelf
                  ? 'bg-indigo-950/50 border-indigo-500/40'
                  : 'bg-slate-900/60 border-slate-700/40'
              }`}
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                {/* rank number */}
                <span className="font-mono text-xs font-bold text-slate-400 w-4">
                  #{index + 1}
                </span>

                <img
                  src={player.avatar}
                  alt={player.name}
                  className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex-shrink-0"
                />

                <div className="flex flex-col truncate">
                  <div className="flex items-center gap-1.5">
                    {/* highlight our own name in a different color */}
                    <span className={`text-xs font-bold truncate ${isSelf ? 'text-indigo-300' : 'text-slate-200'}`}>
                      {player.name}
                    </span>
                    {player.isHost && (
                      <span title="Room Host">
                        <Crown size={12} className="text-amber-400 flex-shrink-0" />
                      </span>
                    )}
                    {/* bouncing pencil icon for the current drawer - looks cool */}
                    {isCurrentDrawer && (
                      <span title="Drawing now">
                        <Pencil size={12} className="text-cyan-400 flex-shrink-0 animate-bounce" />
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-mono font-medium text-emerald-400">
                    {player.score} pts
                  </span>
                </div>
              </div>

              {/* Status badge - guessed or drawing */}
              <div className="flex-shrink-0 ml-1">
                {player.hasGuessed ? (
                  <div className="p-1 rounded-full bg-emerald-500 text-white" title="Guessed the word!">
                    <Check size={12} strokeWidth={3} />
                  </div>
                ) : isCurrentDrawer ? (
                  <span className="text-[10px] font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-800 px-1.5 py-0.5 rounded">
                    DRAW
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
