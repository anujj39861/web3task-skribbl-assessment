import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { Copy, Check, Play, Crown, UserX, Users, Clock, RotateCw, LogOut } from 'lucide-react';

// waiting room before the game starts - players can see who's joined
export const LobbyScreen: React.FC = () => {
  const { roomId, players, selfId, isHost, startGame, kickPlayer, leaveRoom, settings } = useGame();
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // copy room code to clipboard with a brief "Copied!" feedback
  const handleCopyCode = () => {
    if (!roomId) return;
    navigator.clipboard.writeText(roomId);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // copy a direct invite link that auto-fills the room code
  const handleCopyLink = () => {
    if (!roomId) return;
    let url = `${window.location.origin}?room=${roomId}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // need at least 2 players to start a game
  const canStart = players.length >= 2;

  // console.log('[LobbyScreen] players in lobby:', players.length, 'canStart:', canStart);

  return (
    <div className="max-w-4xl mx-auto w-full p-4 flex flex-col gap-6 select-none animate-fade-in">
      {/* Top Banner with Room Code */}
      <div className="bg-slate-800/90 backdrop-blur border border-slate-700/80 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
            Room Code
          </span>
          <div className="flex items-center gap-3 mt-1">
            {/* big monospace font so the room code is easy to read and share */}
            <span className="text-3xl font-mono font-extrabold tracking-widest text-white bg-slate-900/80 px-4 py-1.5 rounded-xl border border-indigo-500/40">
              {roomId}
            </span>
            <button
              onClick={handleCopyCode}
              className="p-2.5 bg-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-all"
              title="Copy Room Code"
            >
              {copiedCode ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
            </button>
          </div>
        </div>

        {/* Invite link button & Leave */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 rounded-xl text-xs font-semibold transition-all shadow-md"
          >
            {copiedLink ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
            <span>{copiedLink ? 'Link Copied!' : 'Copy Invite Link'}</span>
          </button>

          <button
            onClick={leaveRoom}
            className="p-2.5 bg-slate-700/40 hover:bg-rose-600/30 text-slate-400 hover:text-rose-300 border border-slate-700 rounded-xl transition-all"
            title="Leave Lobby"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Players List (takes up 2 columns on desktop) */}
        <div className="md:col-span-2 bg-slate-800/90 backdrop-blur border border-slate-700/80 rounded-2xl p-6 shadow-xl flex flex-col">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-700/60">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-indigo-400" />
              <h2 className="font-game font-bold text-lg text-white">Players</h2>
            </div>
            <span className="text-xs font-mono font-semibold text-slate-400">
              {players.length} / {settings?.maxPlayers || 8}
            </span>
          </div>

          {/* player cards grid - 2 columns on bigger screens */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 overflow-y-auto max-h-[360px] pr-1">
            {players.map(player => {
              const isSelf = player.id === selfId;

              return (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    isSelf
                      ? 'bg-indigo-950/40 border-indigo-500/50 ring-1 ring-indigo-500/30'
                      : 'bg-slate-900/60 border-slate-700/50'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <img
                      src={player.avatar}
                      alt={player.name}
                      className="w-10 h-10 rounded-full bg-slate-700 border border-slate-600 flex-shrink-0"
                    />
                    <div className="flex flex-col truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-slate-100 truncate">
                          {player.name}
                        </span>
                        {isSelf && (
                          <span className="text-[10px] text-indigo-400 font-semibold">(You)</span>
                        )}
                      </div>
                      {player.isHost && (
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-400">
                          <Crown size={12} />
                          <span>Room Host</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* kick button - only visible to the host, and can't kick yourself */}
                  {isHost && !player.isHost && (
                    <button
                      onClick={() => kickPlayer(player.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors"
                      title="Kick Player"
                    >
                      <UserX size={16} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Start Game Action */}
          <div className="mt-6 pt-4 border-t border-slate-700/60">
            {isHost ? (
              <button
                onClick={startGame}
                disabled={!canStart}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700/50 disabled:cursor-not-allowed text-white font-game font-bold text-lg rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <Play size={20} />
                <span>{canStart ? 'Start Game' : 'Waiting for more players (min. 2)...'}</span>
              </button>
            ) : (
              <div className="py-4 text-center font-game font-semibold text-slate-400 bg-slate-900/60 rounded-xl border border-slate-700/60 animate-pulse">
                Waiting for host to start the game...
              </div>
            )}
          </div>
        </div>

        {/* Room Settings Card - shows current settings (read-only in lobby) */}
        <div className="bg-slate-800/90 backdrop-blur border border-slate-700/80 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="font-game font-bold text-lg text-white mb-4 pb-2 border-b border-slate-700/60">
              Room Settings
            </h3>

            <div className="space-y-4 text-xs font-semibold text-slate-300">
              <div className="flex items-center justify-between p-2.5 bg-slate-900/60 rounded-xl border border-slate-700/50">
                <div className="flex items-center gap-2">
                  <RotateCw size={15} className="text-indigo-400" />
                  <span>Rounds</span>
                </div>
                <span className="font-mono text-sm text-indigo-300 font-bold">
                  {settings?.rounds || 3}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-900/60 rounded-xl border border-slate-700/50">
                <div className="flex items-center gap-2">
                  <Clock size={15} className="text-indigo-400" />
                  <span>Draw Time</span>
                </div>
                <span className="font-mono text-sm text-indigo-300 font-bold">
                  {settings?.drawTime || 80}s
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-900/60 rounded-xl border border-slate-700/50">
                <div className="flex items-center gap-2">
                  <Users size={15} className="text-indigo-400" />
                  <span>Max Players</span>
                </div>
                <span className="font-mono text-sm text-indigo-300 font-bold">
                  {settings?.maxPlayers || 8}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 p-3 bg-indigo-950/30 rounded-xl border border-indigo-500/20 text-center">
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Invite friends using the room code or direct link to start guessing!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
