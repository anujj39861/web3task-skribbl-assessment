// handles all score calculations for guessers and drawers
// tried to balance it so fast guessers get rewarded but it's not too punishing for slower ones
export class ScoreService {
  public static calculateGuesserPoints(
    timeLeft: number,
    totalDrawTime: number,
    order: number
  ): number {
    const baseScore = 100;

    // had a bug where scores were NaN when totalDrawTime was 0, this Math.max fixes it
    const timeFraction = Math.max(0, Math.min(1, timeLeft / totalDrawTime));
    const timeBonus = Math.floor(timeFraction * 300); // Up to 300 bonus points for speed

    // first guesser gets 50 extra, second gets 25, everyone else gets nothing
    // TODO: maybe scale this based on number of players?
    const orderBonus = order === 1 ? 50 : order === 2 ? 25 : 0;

    return baseScore + timeBonus + orderBonus;
  }

  public static calculateDrawerBonus(correctGuessersCount: number): number {
    // Drawer earns 50 points per person who guesses correctly
    return correctGuessersCount * 50;
  }
}
