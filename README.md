# 🎨 Doodl.io - Multiplayer Drawing & Guessing Game

A real-time multiplayer drawing game inspired by skribbl.io, built as part of my internship assignment. Players take turns drawing words while others try to guess them through a live chat system.

**Built with:** React, TypeScript, Node.js, Express, Socket.IO, HTML5 Canvas, Tailwind CSS

> **Live Demo:** [https://web3task-skribbl-assessment.onrender.com](https://web3task-skribbl-assessment.onrender.com)

---

## What I Built

This is a full-stack web app where multiple players can:
- Create or join game rooms using a code/link
- Take turns drawing on a shared canvas while others guess the word
- Chat in real-time and earn points for correct guesses
- See a live scoreboard and final winner podium

I structured the backend using OOP principles with separate classes for `Room`, `Game`, `Player`, etc. The frontend is a React app with a central `GameContext` that manages all the socket events and state.

### Features

**Core stuff (must-haves):**
- Room creation with custom settings (rounds, draw time, max players)
- Join via room code or shareable invite link (`?room=ABCD`)
- Turn-based drawing rotation - every player gets a turn
- Real-time canvas with brush colors, sizes, eraser, undo and clear
- Word selection (drawer picks from 3 random options)
- Guessing through chat with automatic word matching
- Speed-based scoring - faster guesses = more points
- Live leaderboard + game over podium with confetti 🎉

**Extra polish (should-haves):**
- Progressive letter hints that reveal over time (at 50% and 25% remaining time)
- "Close guess" detection using Levenshtein distance - tells you when you're almost right
- Touch support for mobile/tablet drawing
- Host can kick players from the lobby
- Custom word lists support

---

## How It Works (Technical Overview)

### Canvas Coordinate Normalization

This was one of the trickier parts. Since players can have totally different screen sizes, I couldn't just send raw pixel coordinates - a stroke at `(500, 300)` on a 1920x1080 screen would look completely wrong on someone's phone.

The solution: normalize everything to 0-1 range before sending:
```
normalized_x = rawX / canvasWidth    // gives a value between 0 and 1
normalized_y = rawY / canvasHeight
```

On the receiving end, each client multiplies by their own canvas dimensions to get the correct local position. This way the same drawing looks identical regardless of screen size.

I also use quadratic bezier curves (`quadraticCurveTo`) instead of straight line segments, which makes the brush strokes way smoother - especially noticeable during fast mouse movements.

### Server-Authoritative Game State

Everything important runs on the server - timers, turn order, scoring, word validation. This prevents cheating since clients can't manipulate their own scores or timers through browser DevTools.

The game follows a state machine pattern:
```
LOBBY → WORD_SELECTION (15s) → DRAWING (configurable) → ROUND_END (5s) → repeat → GAME_OVER
```

### WebSocket Architecture

I used Socket.IO for real-time communication. Each room is a Socket.IO "room" (`socket.join(roomId)`), so drawing events from Room A never leak into Room B.

Key events flow:
- **Drawing:** `draw_start` → `draw_move` (many) → `draw_end` - coordinates are streamed in real-time
- **Guessing:** Client sends `guess` → server checks against word → broadcasts result
- **Game flow:** Server pushes `round_start`, `timer_tick`, `hint_update`, `round_end`, `game_over`

### Word Matching & "Close Guess" Detection

Guesses are normalized (trimmed, lowercased) before comparison. If someone types the exact word, it's marked correct and hidden from chat (so others can't copy it). 

For close guesses, I implemented Levenshtein distance - basically counting the minimum number of character edits (insert/delete/substitute) to transform one string into another. If the distance is ≤ 2 for longer words or ≤ 1 for short words, the server privately tells that player "You're very close!"

### Why Render/Railway Instead of Vercel?

Socket.IO needs a persistent TCP connection that stays alive for the entire game session. Vercel and Netlify use serverless functions that spin up and die within milliseconds - they can't hold a WebSocket connection open. Render/Railway run actual long-lived Node.js processes, which is what we need.

---

## Project Structure

```
├── shared/                    # Shared TypeScript types used by both client & server
│   ├── types.ts               # Player, Room, GameState interfaces
│   └── events.ts              # Socket.IO event type definitions
│
├── server/                    # Node.js + Express + Socket.IO backend
│   └── src/
│       ├── index.ts           # Server entry point
│       ├── models/            # OOP classes (Room, Game, Player, RoomManager)
│       ├── handlers/          # Socket event handlers (room, draw, game, chat)
│       ├── services/          # WordService, ScoreService
│       ├── utils/             # Levenshtein distance, ID generation
│       └── data/words.json    # Word dictionary by category
│
├── client/                    # React + Vite + Tailwind frontend
│   └── src/
│       ├── socket.ts          # Socket.IO client setup
│       ├── context/           # GameContext (central state management)
│       └── components/
│           ├── home/          # Home screen (create/join room)
│           ├── lobby/         # Lobby (player list, settings, start game)
│           └── game/          # Canvas, toolbar, chat, scoreboard, modals
│
├── package.json               # Root scripts (dev, build, start)
└── README.md
```

---

## Getting Started

### Prerequisites
- Node.js v18+ and npm

### Setup & Run Locally

```bash
# 1. Clone the repo
git clone <your-repo-url>
cd skribbl-clone

# 2. Install everything
npm run install:all

# 3. Start dev servers (backend on :3001, frontend on :5173)
npm run dev
```

Open **http://localhost:5173** in two browser tabs, create a room in one and join with the code in the other. You need at least 2 players to start a game.

### Production Build & Deploy

```bash
# Build both client and server
npm run build

# Start production server (serves frontend + WebSocket on same port)
npm start
```

**Deploying to Render:**
1. Push to GitHub
2. Create a new Web Service on Render
3. Set build command: `npm run install:all && npm run build`
4. Set start command: `npm start`
5. Done - Render handles the rest

---

## OOP Architecture (Backend)

I organized the backend into domain classes instead of putting everything in one big file:

- **`RoomManager`** - Singleton that tracks all active rooms. Creates rooms, maps socket IDs to rooms, handles cleanup when rooms empty out.
- **`Room`** - Represents a single game room. Manages player list, settings, broadcasting events to everyone in the room.
- **`Game`** - The actual game logic. Handles the state machine (lobby → drawing → round end → game over), turn rotation, timer management, scoring, and word validation.
- **`Player`** - Individual player data (name, score, avatar, guess status).
- **`WordService`** - Loads words from categories (animals, food, objects, etc.), generates blank masks for hints, handles progressive letter reveals.
- **`ScoreService`** - Calculates points based on how fast someone guessed and their order.

---

## What I Learned

- How WebSockets differ from HTTP polling and why they matter for real-time apps
- Canvas coordinate normalization for cross-device drawing consistency
- Why game servers need to be authoritative (anti-cheat)
- Socket.IO room management and event broadcasting patterns
- State machine design for turn-based game flow
- Levenshtein distance algorithm for fuzzy string matching

---

## Future Improvements

- [ ] Sound effects for correct guesses, timer warnings, etc.
- [ ] Player avatars with more customization
- [ ] Spectator mode for late joiners
- [ ] Round replay feature
- [ ] Profanity filter for chat
- [ ] Flood fill (paint bucket) tool
- [ ] Database for persistent stats/leaderboards
