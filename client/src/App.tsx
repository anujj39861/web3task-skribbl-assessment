import React from 'react';
import { useGame } from './context/GameContext';
import { HomeScreen } from './components/home/HomeScreen';
import { LobbyScreen } from './components/lobby/LobbyScreen';
import { GameArena } from './components/game/GameArena';

// this component handles the "routing" - we don't use react-router since
// the whole app is basically 3 screens and the state drives which one shows
const AppContent: React.FC = () => {
  const { roomId, gameState } = useGame();

  // no room yet => show the home/join screen
  if (!roomId) {
    return <HomeScreen />;
  }

  // in a room but game hasn't started (or still in lobby phase)
  if (!gameState || gameState.phase === 'LOBBY') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <LobbyScreen />
      </div>
    );
  }

  // game is running!
  return <GameArena />;
};

// TODO: maybe add error boundary here so the whole app doesn't crash
export default function App() {
  return <AppContent />;
}
