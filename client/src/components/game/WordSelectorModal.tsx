import React from 'react';
import { useGame } from '../../context/GameContext';
import { Sparkles } from 'lucide-react';

// modal that pops up when it's your turn to draw - you pick one of 3 words
export const WordSelectorModal: React.FC = () => {
  const { wordOptions, chooseWord, gameState } = useGame();

  if (!wordOptions || wordOptions.length === 0) return null;

  // TODO: add a countdown timer bar that shows time running out visually
  // TODO: auto-pick a random word if time runs out (server handles this but would be nice to show)

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in select-none">
      <div className="bg-slate-900 border-2 border-indigo-500/60 rounded-2xl max-w-md w-full p-6 text-center shadow-2xl">
        <div className="inline-flex p-3 rounded-full bg-indigo-500/20 text-indigo-400 mb-3">
          <Sparkles size={28} />
        </div>
        <h2 className="text-2xl font-bold font-game text-white mb-1">Your Turn to Draw!</h2>
        <p className="text-xs text-slate-400 mb-6">
          Choose a word from below ({gameState?.timeLeft ?? 15}s remaining):
        </p>

        <div className="grid grid-cols-1 gap-3">
          {wordOptions.map(word => (
            <button
              key={word}
              onClick={() => chooseWord(word)}
              className="py-3.5 px-4 bg-slate-800 hover:bg-indigo-600 hover:scale-[1.02] text-slate-100 hover:text-white rounded-xl border border-slate-700 hover:border-indigo-400 font-bold font-game tracking-wider uppercase transition-all shadow-md active:scale-95"
            >
              {word}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
