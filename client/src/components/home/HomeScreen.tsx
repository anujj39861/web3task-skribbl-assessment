import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { Paintbrush, Play, Plus, RefreshCw, Settings2 } from 'lucide-react';
import { RoomSettings } from '../../shared/types';

// landing page - create or join a room
export const HomeScreen: React.FC = () => {
  const { createRoom, joinRoom, errorMessage, clearError } = useGame();
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  // random seed for the avatar - pressing the refresh button generates a new one
  const [avatarSeed, setAvatarSeed] = useState(() => Math.random().toString(36).substring(7));
  const [showSettings, setShowSettings] = useState(false);

  // default room settings that the host can customize
  const [settings, setSettings] = useState<Partial<RoomSettings>>({
    rounds: 3,
    drawTime: 80,
    maxPlayers: 8,
    wordCount: 3,
    customWords: []
  });
  const [customWordsText, setCustomWordsText] = useState('');

  // check if there's a room code in the URL (e.g. from an invite link)
  // this way people can just click a link and it pre-fills the room code
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('room');
    if (code) {
      setRoomCode(code.toUpperCase());
      console.log('[HomeScreen] room code from URL:', code);
    }
  }, []);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // parse custom words from the comma-separated text input
    const customWords = customWordsText
      .split(',')
      .map(w => w.trim().toLowerCase())
      .filter(w => w.length > 0);

    createRoom(name.trim(), {
      ...settings,
      customWords: customWords.length > 0 ? customWords : undefined
    });
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !roomCode.trim()) return;
    joinRoom(roomCode.trim().toUpperCase(), name.trim());
  };

  // dicebear gives us fun robot avatars based on a seed string
  const currentAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${avatarSeed}`;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 select-none relative overflow-hidden">
      {/* Background decoration - blurry blobs for that modern look */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Logo */}
      <div className="flex flex-col items-center mb-8 relative z-10 animate-fade-in text-center">
        <div className="flex items-center gap-3 mb-2">
          {/* the rotate-3 gives the icon a playful tilt */}
          <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-500/25 rotate-3">
            <Paintbrush size={32} />
          </div>
          {/* gradient text looks really nice for the title */}
          <h1 className="text-4xl md:text-5xl font-extrabold font-game tracking-wider bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
            Doodl.io
          </h1>
        </div>
        <p className="text-sm text-slate-400 font-medium">
          Free Real-time Multiplayer Drawing & Guessing
        </p>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 rounded-3xl p-6 md:p-8 shadow-2xl relative z-10">
        {/* Error notification - shows up when something goes wrong */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-rose-950/60 border border-rose-500/50 rounded-xl text-rose-300 text-xs flex items-center justify-between animate-fade-in">
            <span>{errorMessage}</span>
            <button onClick={clearError} className="text-rose-400 font-bold ml-2">
              ✕
            </button>
          </div>
        )}

        {/* Avatar selector & Player Name */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative mb-3">
            <img
              src={currentAvatar}
              alt="Avatar"
              className="w-20 h-20 rounded-full bg-slate-800 border-2 border-indigo-500/50 p-1 shadow-lg"
            />
            {/* little refresh button to randomize avatar */}
            <button
              type="button"
              onClick={() => setAvatarSeed(Math.random().toString(36).substring(7))}
              className="absolute -bottom-1 -right-1 p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-md transition-transform active:scale-90"
              title="Change Avatar"
            >
              <RefreshCw size={13} />
            </button>
          </div>

          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Enter your nickname..."
            maxLength={18}
            className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-center text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors shadow-inner"
            required
          />
        </div>

        {/* Buttons / Actions */}
        <div className="space-y-4">
          {/* Join Room Form */}
          <form onSubmit={handleJoin} className="flex gap-2">
            <input
              type="text"
              value={roomCode}
              onChange={e => setRoomCode(e.target.value.toUpperCase())}
              placeholder="ENTER ROOM CODE"
              maxLength={8}
              className="flex-1 bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-3 text-center text-xs font-mono font-bold tracking-widest text-indigo-300 placeholder-slate-500 focus:outline-none focus:border-indigo-500 uppercase"
            />
            <button
              type="submit"
              disabled={!name.trim() || !roomCode.trim()}
              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-game font-bold text-sm rounded-xl transition-all shadow-lg flex items-center gap-1.5 active:scale-95 flex-shrink-0"
            >
              <Play size={16} />
              <span>Join</span>
            </button>
          </form>

          {/* divider between join and create */}
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-800" />
            <span className="flex-shrink mx-3 text-xs text-slate-500 uppercase font-semibold">Or</span>
            <div className="flex-grow border-t border-slate-800" />
          </div>

          {/* Create Room Button */}
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={handleCreate}
              disabled={!name.trim()}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-game font-bold text-base rounded-xl transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2 active:scale-95"
            >
              <Plus size={18} />
              <span>Create Private Room</span>
            </button>

            {/* toggle for advanced room settings */}
            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className="text-xs text-slate-400 hover:text-indigo-400 flex items-center justify-center gap-1.5 py-1 transition-colors"
            >
              <Settings2 size={13} />
              <span>{showSettings ? 'Hide Room Settings' : 'Custom Room Settings'}</span>
            </button>
          </div>

          {/* Expandable Custom Settings Panel */}
          {showSettings && (
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-4 space-y-3 animate-fade-in text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-semibold">Rounds:</span>
                <select
                  value={settings.rounds}
                  onChange={e => setSettings({ ...settings, rounds: Number(e.target.value) })}
                  className="bg-slate-900 text-white border border-slate-700 rounded-lg px-2.5 py-1 font-mono font-bold"
                >
                  {[2, 3, 4, 5, 6, 8, 10].map(r => (
                    <option key={r} value={r}>
                      {r} rounds
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-semibold">Draw Time:</span>
                <select
                  value={settings.drawTime}
                  onChange={e => setSettings({ ...settings, drawTime: Number(e.target.value) })}
                  className="bg-slate-900 text-white border border-slate-700 rounded-lg px-2.5 py-1 font-mono font-bold"
                >
                  {[30, 45, 60, 80, 100, 120, 150].map(t => (
                    <option key={t} value={t}>
                      {t} seconds
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-semibold">Max Players:</span>
                <select
                  value={settings.maxPlayers}
                  onChange={e => setSettings({ ...settings, maxPlayers: Number(e.target.value) })}
                  className="bg-slate-900 text-white border border-slate-700 rounded-lg px-2.5 py-1 font-mono font-bold"
                >
                  {[4, 6, 8, 12, 16, 20].map(m => (
                    <option key={m} value={m}>
                      {m} players
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 border-t border-slate-700/60">
                <span className="text-slate-400 block mb-1">Custom Words (comma separated):</span>
                <input
                  type="text"
                  value={customWordsText}
                  onChange={e => setCustomWordsText(e.target.value)}
                  placeholder="e.g. bitcoin, ethereum, solana"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
