import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { GameProvider } from './context/GameContext';
import './index.css';

// wrapping everything in GameProvider so all components can access game state
// StrictMode helps catch bugs during dev (double renders etc)
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GameProvider>
      <App />
    </GameProvider>
  </React.StrictMode>
);

// console.log('App mounted successfully');
