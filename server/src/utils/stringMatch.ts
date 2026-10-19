// Compute Levenshtein distance between two strings
// learned about this algorithm from wikipedia - it measures how many edits
// (insertions, deletions, substitutions) are needed to turn one string into another
export function getLevenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  // initialize first column
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  // initialize first row
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// took me a while to figure out this needed to be normalized
// otherwise "  CAT " wouldn't match "cat"
export function normalizeWord(word: string): string {
  return word.trim().toLowerCase().replace(/\s+/g, ' ');
}

export interface MatchResult {
  isExact: boolean;
  isClose: boolean;
  distance: number;
}

// evaluate a player's guess against the target word
export function evaluateGuess(guess: string, target: string): MatchResult {
  const normGuess = normalizeWord(guess);
  const normTarget = normalizeWord(target);

  if (normGuess === normTarget) {
    return { isExact: true, isClose: false, distance: 0 };
  }

  const distance = getLevenshteinDistance(normGuess, normTarget);
  // A guess is considered "close" if distance <= 2 for longer words, <= 1 for shorter ones
  // this gives the "almost!" feedback which is really satisfying in-game
  const isClose = distance > 0 && distance <= (normTarget.length > 5 ? 2 : 1);

  return { isExact: false, isClose, distance };
}
