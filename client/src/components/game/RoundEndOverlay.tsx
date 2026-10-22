import React from 'react';
import { useGame } from '../../context/GameContext';
import { Eye, ArrowRight } from 'lucide-react';

// this overlay shows up briefly between rounds to reveal the secret word
// it sits on top of the canvas using absolute positioning
export const RoundEndOverlay: React.FC = () => {
  const { roundEndData, gameState } = useGame();

  // only render during the ROUND_END phase
  if (gameState?.phase !== 'ROUND_END' || !roundEndData) return null;

  // TODO: show each player's score change for this round (like "+150 pts")
  // TODO: maybe add a small animation when the word is revealed

  return (
    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20 animate-fade-in select-none">
      <div className="bg-slate-800 border border-slate-700 p-8 rounded-2xl max-w-sm w-full shadow-2xl flex flex-col items-center">
        <div className="p-3 bg-amber-500/20 text-amber-400 rounded-full mb-3">
          <Eye size={32} />
        </div>
        <span className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-1">
          Round Ended
        </span>
        <h3 className="text-sm text-slate-300 mb-2">The secret word was:</h3>
        <div className="text-2xl font-bold font-game tracking-widest text-amber-400 uppercase bg-slate-900/90 px-6 py-2 rounded-xl border border-amber-500/30 mb-6">
          {roundEndData.word}
        </div>

        {/* show who draws next so players know what's coming */}
        {roundEndData.nextDrawerName && (
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 bg-slate-900/60 px-4 py-2 rounded-lg border border-slate-700">
            <span>Next drawer:</span>
            <span className="text-indigo-400 font-bold">{roundEndData.nextDrawerName}</span>
            <ArrowRight size={14} className="text-slate-500" />
          </div>
        )}
      </div>
    </div>
  );
};
