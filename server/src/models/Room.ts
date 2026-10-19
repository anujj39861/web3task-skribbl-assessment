import { Server } from 'socket.io';
import { RoomSettings, DrawStroke } from '../shared/types.js';
import {
  ClientToServerEvents,
  ServerToClientEvents
} from '../shared/events.js';
import { Player } from './Player.js';
import { Game } from './Game.js';

// a Room is basically a lobby + game container
// socket.io rooms are basically channels - each game room gets its own
export class Room {
  public id: string;
  public settings: RoomSettings;
  public players: Player[] = [];
  public hostId: string = '';
  public game: Game;
  private io: Server<ClientToServerEvents, ServerToClientEvents>;

  constructor(
    id: string,
    hostPlayer: Player,
    settings: Partial<RoomSettings>,
    io: Server<ClientToServerEvents, ServerToClientEvents>
  ) {
    this.id = id;
    this.io = io;
    this.hostId = hostPlayer.id;
    hostPlayer.isHost = true;
    this.players.push(hostPlayer);

    // FIXME: should probably validate room settings more strictly
    // like what if someone passes drawTime: -5 ??
    this.settings = {
      maxPlayers: settings.maxPlayers || 8,
      rounds: settings.rounds || 3,
      drawTime: settings.drawTime || 80,
      wordCount: settings.wordCount || 3,
      hints: settings.hints || 2,
      isPrivate: settings.isPrivate ?? false,
      customWords: settings.customWords || []
    };

    this.game = new Game(this);
  }

  public getPlayer(playerId: string): Player | undefined {
    return this.players.find(p => p.id === playerId);
  }

  public getPlayerBySocket(socketId: string): Player | undefined {
    return this.players.find(p => p.socketId === socketId);
  }

  public addPlayer(player: Player): boolean {
    if (this.players.length >= this.settings.maxPlayers) {
      return false;
    }
    this.players.push(player);
    console.log(`[Room ${this.id}] Player "${player.name}" added (${this.players.length}/${this.settings.maxPlayers})`);
    return true;
  }

  public removePlayer(socketId: string): { removedPlayer?: Player; newHostId?: string } {
    const index = this.players.findIndex(p => p.socketId === socketId);
    if (index === -1) return {};

    const [removedPlayer] = this.players.splice(index, 1);
    let newHostId: string | undefined;

    // Notify game logic about the disconnect
    this.game.handlePlayerDisconnect(removedPlayer.id);

    // If host left, elect the first remaining player as new host
    // TODO: maybe let players vote on new host instead?
    if (removedPlayer.isHost && this.players.length > 0) {
      this.players[0].isHost = true;
      this.hostId = this.players[0].id;
      newHostId = this.hostId;
      console.log(`[Room ${this.id}] New host elected: ${this.players[0].name}`);
    }

    return { removedPlayer, newHostId };
  }

  // broadcast to everyone in this room
  public broadcast<K extends keyof ServerToClientEvents>(
    event: K,
    ...args: Parameters<ServerToClientEvents[K]>
  ): void {
    const channel = this.io.to(this.id);
    // had to cast this because typescript was being annoying with the event types
    (channel.emit as unknown as (event: string, ...args: unknown[]) => void)(event, ...args);
  }

  // broadcast to everyone except one player (usually the drawer)
  public broadcastExcept<K extends keyof ServerToClientEvents>(
    exceptPlayerId: string,
    event: K,
    ...args: Parameters<ServerToClientEvents[K]>
  ): void {
    for (const player of this.players) {
      if (player.id !== exceptPlayerId) {
        this.emitToPlayer(player.id, event, ...args);
      }
    }
  }

  // send event to a specific player by their player id
  public emitToPlayer<K extends keyof ServerToClientEvents>(
    playerId: string,
    event: K,
    ...args: Parameters<ServerToClientEvents[K]>
  ): void {
    const player = this.getPlayer(playerId);
    if (player) {
      const channel = this.io.to(player.socketId);
      (channel.emit as unknown as (event: string, ...args: unknown[]) => void)(event, ...args);
    }
  }

  public addStroke(stroke: DrawStroke): void {
    this.game.strokes.push(stroke);
  }

  public undoStroke(): DrawStroke[] {
    this.game.strokes.pop();
    return this.game.strokes;
  }

  public clearCanvas(): void {
    this.game.strokes = [];
  }
}
