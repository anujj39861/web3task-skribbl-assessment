import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useGame } from '../../context/GameContext';
import { Trophy, Medal, Award, LogOut } from 'lucide-react';

export const GameOverModal: React.FC = () => {
  const { gameOverData, leaveRoom } = useGame();

  // confetti library is so satisfying lol
  // fires multiple bursts from different angles for a cool effect
  useEffect(() => {
    if (gameOverData) {
      // center burst
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
      // side bursts after a short delay
      setTimeout(() => {
        confetti({
          particleCount: 80,
          angle: 60,
          spread: 55,
          origin: { x: 0 }
        });
        confetti({
          particleCount: 80,
          angle: 120,
          spread: 55,
          origin: { x: 1 }
        });
      }, 500);
    }
  }, [gameOverData]);

  if (!gameOverData) return null;

  const { winner, leaderboard } = gameOverData;

  // TODO: add a "Play Again" button that creates a new room with same settings
  // TODO: add share result button

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in select-none">
      <div className="bg-slate-900 border-2 border-amber-500/60 rounded-3xl max-w-lg w-full p-6 text-center shadow-2xl">
        <div className="inline-flex p-4 rounded-full bg-amber-500/20 text-amber-400 mb-3 animate-bounce">
          <Trophy size={42} />
        </div>

        <h2 className="text-3xl font-bold font-game text-white mb-1">Game Over!</h2>
        <p className="text-sm text-amber-300 font-semibold mb-6">
          🏆 <span className="underline">{winner.name}</span> wins the match! 🏆
        </p>

        {/* Podium layout - 2nd place | 1st place (taller) | 3rd place */}
        <div className="flex items-end justify-center gap-3 mb-6 px-4">
          {/* 2nd place - left side */}
          {leaderboard[1] && (
            <div className="flex flex-col items-center flex-1">
              <img
                src={leaderboard[1].avatar}
                alt={leaderboard[1].playerName}
                className="w-12 h-12 rounded-full border-2 border-slate-400 mb-1"
              />
              <span className="text-xs font-bold text-slate-300 truncate max-w-[80px]">
                {leaderboard[1].playerName}
              </span>
              <div className="w-full bg-slate-800 rounded-t-xl py-3 border-t-2 border-slate-400 mt-2">
                <Medal size={20} className="mx-auto text-slate-400 mb-1" />
                <span className="text-xs font-mono font-bold text-slate-300">
                  {leaderboard[1].score}
                </span>
              </div>
            </div>
          )}

          {/* 1st place - center, slightly raised with -mt-4 */}
          {leaderboard[0] && (
            <div className="flex flex-col items-center flex-1 -mt-4">
              <div className="relative">
                <img
                  src={leaderboard[0].avatar}
                  alt={leaderboard[0].playerName}
                  className="w-16 h-16 rounded-full border-4 border-amber-400 mb-1 shadow-lg shadow-amber-500/20"
                />
                <Trophy size={18} className="absolute -top-2 -right-1 text-amber-400" />
              </div>
              <span className="text-sm font-bold text-amber-300 truncate max-w-[90px]">
                {leaderboard[0].playerName}
              </span>
              <div className="w-full bg-amber-950/60 rounded-t-xl py-5 border-t-4 border-amber-400 mt-2 shadow-inner">
                <Trophy size={24} className="mx-auto text-amber-400 mb-1" />
                <span className="text-sm font-mono font-bold text-amber-300">
                  {leaderboard[0].score}
                </span>
              </div>
            </div>
          )}

          {/* 3rd place - right side */}
          {leaderboard[2] && (
            <div className="flex flex-col items-center flex-1">
              <img
                src={leaderboard[2].avatar}
                alt={leaderboard[2].playerName}
                className="w-12 h-12 rounded-full border-2 border-amber-700 mb-1"
              />
              <span className="text-xs font-bold text-slate-300 truncate max-w-[80px]">
                {leaderboard[2].playerName}
              </span>
              <div className="w-full bg-slate-800 rounded-t-xl py-2 border-t-2 border-amber-700 mt-2">
                <Award size={20} className="mx-auto text-amber-700 mb-1" />
                <span className="text-xs font-mono font-bold text-slate-300">
                  {leaderboard[2].score}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <button
          onClick={leaveRoom}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold font-game flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
        >
          <LogOut size={18} />
          <span>Back to Main Menu</span>
        </button>
      </div>
    </div>
  );
};
