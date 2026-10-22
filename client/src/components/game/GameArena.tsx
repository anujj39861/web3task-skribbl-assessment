import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { GameHeader } from './GameHeader';
import { Canvas } from './Canvas';
import { DrawingToolbar } from './DrawingToolbar';
import { Leaderboard } from './Leaderboard';
import { ChatBox } from './ChatBox';
import { WordSelectorModal } from './WordSelectorModal';
import { GameOverModal } from './GameOverModal';
import { RoundEndOverlay } from './RoundEndOverlay';

// main game screen - this is where all the action happens
// uses a 3-column grid layout: leaderboard | canvas | chat
export const GameArena: React.FC = () => {
  const { isDrawer, gameState } = useGame();

  // drawing tool state - kept here so Canvas and DrawingToolbar can share it
  const [color, setColor] = useState('#000000');
  const [size, setSize] = useState(0.010);
  const [isEraser, setIsEraser] = useState(false);

  return (
    <div className="h-screen w-screen p-3 md:p-4 flex flex-col gap-3 select-none overflow-hidden">
      {/* Top Header - shows room code, round info, timer */}
      <GameHeader />

      {/* Main 3-Column Arena */}
      {/* the min-h-0 is important here - without it flex children won't shrink properly */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-3 min-h-0">
        {/* Left Column: Leaderboard - hidden on mobile to save space */}
        <div className="hidden md:flex md:col-span-3 lg:col-span-2 h-full min-h-0">
          <Leaderboard />
        </div>

        {/* Center Column: Canvas & Toolbar */}
        <div className="md:col-span-6 lg:col-span-7 flex flex-col gap-2 h-full min-h-0 relative">
          <div className="flex-1 min-h-0 relative">
            <Canvas color={color} size={size} isEraser={isEraser} />
            {/* RoundEndOverlay sits on top of canvas with absolute positioning */}
            <RoundEndOverlay />
          </div>

          {/* only show drawing tools when it's our turn to draw */}
          {isDrawer && gameState?.phase === 'DRAWING' && (
            <DrawingToolbar
              color={color}
              setColor={setColor}
              size={size}
              setSize={setSize}
              isEraser={isEraser}
              setIsEraser={setIsEraser}
            />
          )}
        </div>

        {/* Right Column: Chat & Guesses */}
        <div className="md:col-span-3 lg:col-span-3 flex flex-col h-full min-h-0">
          <ChatBox />
        </div>
      </div>

      {/* Modals - these render on top of everything when active */}
      <WordSelectorModal />
      <GameOverModal />
    </div>
  );
};
