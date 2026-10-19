import { PlayerData } from '../shared/types.js';

// represents a single player in a game room
export class Player {
  public id: string;
  public socketId: string;
  public name: string;
  public avatar: string;
  public score: number = 0;
  public isHost: boolean = false;
  public hasGuessed: boolean = false;
  public guessedAt?: number; // timestamp of when they guessed correctly

  constructor(id: string, socketId: string, name: string, avatar?: string, isHost: boolean = false) {
    this.id = id;
    this.socketId = socketId;
    this.name = name;
    // dicebear gives us random bot avatars based on the name - pretty cool
    this.avatar = avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${name}`;
    this.isHost = isHost;
  }

  // call this at the start of each new round so everyone can guess again
  public resetRoundState(): void {
    this.hasGuessed = false;
    this.guessedAt = undefined;
  }

  public addScore(points: number): void {
    // FIXME: should we cap max score? probably not but worth thinking about
    this.score += points;
  }

  // serialize player data to send to clients
  public toJSON(): PlayerData {
    return {
      id: this.id,
      socketId: this.socketId,
      name: this.name,
      avatar: this.avatar,
      score: this.score,
      isHost: this.isHost,
      hasGuessed: this.hasGuessed,
      guessedAt: this.guessedAt
    };
  }
}
