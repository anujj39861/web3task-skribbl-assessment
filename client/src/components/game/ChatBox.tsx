import React, { useState, useRef, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { Send, MessageSquare } from 'lucide-react';

export const ChatBox: React.FC = () => {
  const { chatMessages, sendGuessOrChat, isDrawer, hasGuessed, gameState } = useGame();
  const [input, setInput] = useState('');
  // this ref is needed so scroll stays at bottom when new messages come in
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // auto-scroll whenever a new message arrives
  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendGuessOrChat(input);
    setInput('');
  };

  // TODO: add typing indicator animation
  // TODO: add sound notification for correct guesses

  const isDrawingNow = isDrawer && gameState?.phase === 'DRAWING';
  let placeholder = 'Type your guess here...';
  if (isDrawingNow) {
    placeholder = 'You are drawing! No guessing allowed.';
  } else if (hasGuessed && gameState?.phase === 'DRAWING') {
    placeholder = 'You guessed it! Keep it secret.';
  }

  return (
    <div className="bg-slate-800/90 backdrop-blur border border-slate-700/80 rounded-xl flex flex-col h-full shadow-lg overflow-hidden">
      {/* Chat Header */}
      <div className="px-3 py-2 bg-slate-900/60 border-b border-slate-700/60 flex items-center gap-2 select-none">
        <MessageSquare size={16} className="text-indigo-400" />
        <h3 className="font-game font-bold text-sm text-slate-200">Chat & Guesses</h3>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 text-xs">
        {chatMessages.length === 0 && (
          <div className="text-center text-slate-500 py-8 italic select-none">
            Room created. Messages and guesses will appear here!
          </div>
        )}

        {chatMessages.map(msg => {
          // different styling for different message types
          if (msg.type === 'correct') {
            return (
              <div
                key={msg.id}
                className="bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 font-bold p-2 rounded-lg text-center animate-fade-in"
              >
                🎉 {msg.text}
              </div>
            );
          }

          if (msg.type === 'close') {
            return (
              <div
                key={msg.id}
                className="bg-amber-950/60 border border-amber-500/40 text-amber-300 font-semibold p-2 rounded-lg text-center animate-pulse"
              >
                ⚠️ {msg.text}
              </div>
            );
          }

          if (msg.type === 'system') {
            return (
              <div
                key={msg.id}
                className="text-slate-400 italic text-center py-0.5 border-y border-slate-800"
              >
                {msg.text}
              </div>
            );
          }

          // regular chat/guess message
          return (
            <div key={msg.id} className="leading-relaxed break-words">
              <span className="font-bold text-indigo-400">{msg.playerName}: </span>
              <span className="text-slate-200">{msg.text}</span>
            </div>
          );
        })}
        {/* invisible div at the bottom for scrollIntoView */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-2 bg-slate-900/80 border-t border-slate-700/60 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={isDrawingNow}
          placeholder={placeholder}
          maxLength={100}
          className="flex-1 bg-slate-800 text-slate-100 placeholder-slate-500 text-xs px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          disabled={isDrawingNow || !input.trim()}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white p-2 rounded-lg transition-colors flex items-center justify-center flex-shrink-0"
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
};
