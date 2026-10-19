import {
  GamePhase,
  PublicGameState,
  DrawStroke,
  ChatMessage
} from '../shared/types.js';
import { Player } from './Player.js';
import { WordService } from '../services/WordService.js';
import { ScoreService } from '../services/ScoreService.js';
import { evaluateGuess, MatchResult } from '../utils/stringMatch.js';
import { Room } from './Room.js';

// this is the big one - handles all the game logic for a single room
export class Game {
  public room: Room;
  public phase: GamePhase = 'LOBBY';
  public currentRound: number = 0;
  public totalRounds: number = 3;
  public drawTime: number = 80;
  public wordCount: number = 3;
  
  public currentDrawerIndex: number = -1;
  public currentWord: string = '';
  public revealedIndices: Set<number> = new Set();
  public strokes: DrawStroke[] = [];
  public correctGuessersCount: number = 0;

  private timerInterval: NodeJS.Timeout | null = null;
  public timeLeft: number = 0;
  private wordService: WordService;

  constructor(room: Room) {
    this.room = room;
    this.totalRounds = room.settings.rounds;
    this.drawTime = room.settings.drawTime;
    this.wordCount = room.settings.wordCount;
    this.wordService = new WordService();
  }

  // getter so we don't have to do the bounds check everywhere
  public get currentDrawer(): Player | null {
    if (this.currentDrawerIndex < 0 || this.currentDrawerIndex >= this.room.players.length) {
      return null;
    }
    return this.room.players[this.currentDrawerIndex];
  }

  public start(): void {
    if (this.room.players.length < 2) {
      this.room.broadcast('error_message', { message: 'Need at least 2 players to start!' });
      return;
    }

    console.log(`[Game] Starting game in room ${this.room.id} with ${this.room.players.length} players`);
    this.currentRound = 1;
    this.currentDrawerIndex = 0;
    this.strokes = [];
    this.startTurn();
  }

  // Begin turn for current drawer
  public startTurn(): void {
    const drawer = this.currentDrawer;
    if (!drawer) {
      this.endGame();
      return;
    }

    this.phase = 'WORD_SELECTION';
    this.currentWord = '';
    this.revealedIndices.clear();
    this.strokes = [];
    this.correctGuessersCount = 0;

    // Reset round guesses for all players
    for (const player of this.room.players) {
      player.resetRoundState();
    }

    // Get word choices for the drawer to pick from
    const wordOptions = this.wordService.getWordChoices(this.wordCount, this.room.settings.customWords);
    console.log(`[Game] Round ${this.currentRound} - ${drawer.name}'s turn to draw`);

    // Notify drawer with word options
    this.room.emitToPlayer(drawer.id, 'round_start', {
      drawerId: drawer.id,
      drawerName: drawer.name,
      round: this.currentRound,
      totalRounds: this.totalRounds,
      wordOptions,
      drawTime: this.drawTime
    });

    // Notify all other guessers (they don't get word options obviously)
    this.room.broadcastExcept(drawer.id, 'round_start', {
      drawerId: drawer.id,
      drawerName: drawer.name,
      round: this.currentRound,
      totalRounds: this.totalRounds,
      drawTime: this.drawTime
    });

    this.broadcastState();

    // 15 seconds to choose a word, otherwise we auto-choose the first one
    // TODO: maybe randomize which word gets auto-picked?
    this.startCountdown(15, () => {
      this.chooseWord(wordOptions[0]);
    });
  }

  public chooseWord(word: string): void {
    if (this.phase !== 'WORD_SELECTION') return;

    this.clearTimer();
    this.currentWord = word;
    this.phase = 'DRAWING';
    const blanks = this.wordService.generateMask(word, this.revealedIndices);

    // send the blank mask to everyone (e.g. "_ _ _ _ _")
    this.room.broadcast('word_chosen', {
      wordLength: word.length,
      blanks
    });

    this.broadcastState();

    // Start the actual drawing timer
    this.startCountdown(this.drawTime, () => {
      this.endRound('Time ran out!');
    });
  }

  public handleGuess(player: Player, text: string): void {
    // if we're not in drawing phase, just treat it as a regular chat message
    if (this.phase !== 'DRAWING') {
      this.broadcastChat(player.id, player.name, text, 'chat');
      return;
    }

    // Drawer cannot guess their own word lol
    if (player.id === this.currentDrawer?.id) {
      this.room.emitToPlayer(player.id, 'chat_message', {
        id: Math.random().toString(),
        playerName: 'System',
        text: "You are drawing! You can't guess.",
        type: 'system',
        timestamp: Date.now()
      });
      return;
    }

    // Player already guessed correctly - don't let them spoil it
    if (player.hasGuessed) {
      this.room.emitToPlayer(player.id, 'chat_message', {
        id: Math.random().toString(),
        playerName: 'System',
        text: 'You have already guessed the word! Shh...',
        type: 'system',
        timestamp: Date.now()
      });
      return;
    }

    const result: MatchResult = evaluateGuess(text, this.currentWord);

    if (result.isExact) {
      // correct guess!
      player.hasGuessed = true;
      this.correctGuessersCount++;

      const pointsEarned = ScoreService.calculateGuesserPoints(
        this.timeLeft,
        this.drawTime,
        this.correctGuessersCount
      );
      player.addScore(pointsEarned);

      // Reward drawer too - they get a flat bonus for each correct guess
      const drawerBonus = 50;
      this.currentDrawer?.addScore(drawerBonus);

      console.log(`[Game] ${player.name} guessed correctly! +${pointsEarned} points`);

      // Notify the room without spoiling the word
      this.room.broadcast('chat_message', {
        id: Math.random().toString(),
        playerName: 'System',
        text: `${player.name} guessed the word!`,
        type: 'correct',
        timestamp: Date.now()
      });

      this.room.emitToPlayer(player.id, 'guess_result', {
        correct: true,
        playerId: player.id,
        playerName: player.name,
        points: pointsEarned
      });

      this.broadcastState();

      // Check if all guessers have guessed
      const guessersCount = this.room.players.length - 1; // minus the drawer
      if (this.correctGuessersCount >= guessersCount) {
        this.endRound('Everyone guessed the word!');
      }
    } else if (result.isClose) {
      // Close guess: notify the player privately so they know they're warm
      this.room.emitToPlayer(player.id, 'chat_message', {
        id: Math.random().toString(),
        playerName: 'System',
        text: `"${text}" is very close!`,
        type: 'close',
        timestamp: Date.now()
      });
      // still show their guess to everyone as a normal message
      this.broadcastChat(player.id, player.name, text, 'chat');
    } else {
      // wrong guess, just show it as chat
      this.broadcastChat(player.id, player.name, text, 'chat');
    }
  }

  public endRound(reason: string): void {
    this.clearTimer();
    this.phase = 'ROUND_END';

    // build scores map for the client
    const scoresMap: Record<string, number> = {};
    for (const p of this.room.players) {
      scoresMap[p.id] = p.score;
    }

    this.room.broadcast('round_end', {
      word: this.currentWord,
      scores: scoresMap,
      players: this.room.players.map(p => p.toJSON()),
      nextDrawerName: this.room.players[(this.currentDrawerIndex + 1) % this.room.players.length]?.name
    });

    this.room.broadcast('chat_message', {
      id: Math.random().toString(),
      playerName: 'System',
      text: `${reason} The word was: "${this.currentWord}".`,
      type: 'system',
      timestamp: Date.now()
    });

    this.broadcastState();

    // 5 second break before moving to the next turn
    // gives players time to see scores and the answer
    setTimeout(() => {
      this.advanceTurn();
    }, 5000);
  }

  public advanceTurn(): void {
    this.currentDrawerIndex++;

    // if we've gone through all players, start a new round
    if (this.currentDrawerIndex >= this.room.players.length) {
      this.currentDrawerIndex = 0;
      this.currentRound++;
    }

    if (this.currentRound > this.totalRounds) {
      this.endGame();
    } else {
      this.startTurn();
    }
  }

  public endGame(): void {
    this.clearTimer();
    this.phase = 'GAME_OVER';

    // sort players by score descending to get the leaderboard
    const sorted = [...this.room.players].sort((a, b) => b.score - a.score);
    const winner = sorted[0];

    const leaderboard = sorted.map((p, idx) => ({
      playerId: p.id,
      playerName: p.name,
      avatar: p.avatar,
      score: p.score,
      rank: idx + 1
    }));

    console.log(`[Game] Game over in room ${this.room.id}! Winner: ${winner.name} with ${winner.score} points`);

    this.room.broadcast('game_over', {
      winner: winner.toJSON(),
      leaderboard
    });

    this.broadcastState();
  }

  // handle when a player disconnects mid-game
  public handlePlayerDisconnect(playerId: string): void {
    if (this.phase === 'LOBBY' || this.phase === 'GAME_OVER') return;

    // if the drawer left, end the round immediately
    if (this.currentDrawer?.id === playerId) {
      this.endRound('The drawer left the game!');
    } else {
      // check if everyone who's left has already guessed
      const guessersCount = this.room.players.length - 1;
      if (guessersCount > 0 && this.correctGuessersCount >= guessersCount) {
        this.endRound('All remaining players guessed the word!');
      }
    }
  }

  // reveal hints at certain time intervals (halfway and quarter mark)
  private checkHints(): void {
    if (this.phase !== 'DRAWING' || !this.currentWord) return;

    const halfTime = Math.floor(this.drawTime / 2);
    const quarterTime = Math.floor(this.drawTime / 4);

    // reveal a letter at the halfway point and again at the quarter mark
    if (this.timeLeft === halfTime || this.timeLeft === quarterTime) {
      const nextIndex = this.wordService.getNextHintIndex(this.currentWord, this.revealedIndices);
      if (nextIndex !== null) {
        this.revealedIndices.add(nextIndex);
        const updatedMask = this.wordService.generateMask(this.currentWord, this.revealedIndices);
        this.room.broadcast('hint_update', { wordMask: updatedMask });
      }
    }
  }

  private startCountdown(seconds: number, onComplete: () => void): void {
    this.clearTimer();
    this.timeLeft = seconds;
    this.room.broadcast('timer_tick', { timeLeft: this.timeLeft });

    this.timerInterval = setInterval(() => {
      this.timeLeft--;
      this.room.broadcast('timer_tick', { timeLeft: this.timeLeft });
      this.checkHints();

      if (this.timeLeft <= 0) {
        this.clearTimer();
        onComplete();
      }
    }, 1000);
  }

  private clearTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  // sends current game state to all clients
  public broadcastState(): void {
    const scoresMap: Record<string, number> = {};
    for (const p of this.room.players) {
      scoresMap[p.id] = p.score;
    }

    const state: PublicGameState = {
      phase: this.phase,
      round: this.currentRound,
      totalRounds: this.totalRounds,
      drawerId: this.currentDrawer?.id || null,
      drawerName: this.currentDrawer?.name || null,
      wordMask: this.currentWord
        ? this.wordService.generateMask(this.currentWord, this.revealedIndices)
        : '',
      wordLength: this.currentWord ? this.currentWord.length : 0,
      hintsRevealed: this.revealedIndices.size,
      timeLeft: this.timeLeft,
      scores: scoresMap
    };

    this.room.broadcast('game_state', state);
  }

  private broadcastChat(playerId: string, playerName: string, text: string, type: 'chat' | 'system'): void {
    // TODO: maybe add profanity filter later?
    const chatMsg: ChatMessage = {
      id: Math.random().toString(),
      playerId,
      playerName,
      text,
      type,
      timestamp: Date.now()
    };
    this.room.broadcast('chat_message', chatMsg);
  }
}
