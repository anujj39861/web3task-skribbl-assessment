import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM workaround for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class WordService {
  private allWords: string[] = [];
  private categories: Record<string, string[]> = {};

  constructor() {
    try {
      const wordsPath = path.resolve(__dirname, '../data/words.json');
      const raw = fs.readFileSync(wordsPath, 'utf-8');
      this.categories = JSON.parse(raw);
      this.allWords = Object.values(this.categories).flat();
      // console.log(`[WordService] Loaded ${this.allWords.length} words from ${Object.keys(this.categories).length} categories`);
    } catch {
      // Fallback default list if file read fails
      // TODO: add more words to this fallback list, it's pretty small
      this.allWords = [
        'cat', 'dog', 'elephant', 'pizza', 'guitar', 'chair', 'laptop', 
        'bicycle', 'castle', 'beach', 'tree', 'sun', 'house', 'car'
      ];
      console.warn('[WordService] Could not load words.json, using fallback word list');
    }
  }

  // Get N unique random word choices for the drawer to pick from
  public getWordChoices(count: number = 3, customWords?: string[]): string[] {
    // merge custom words with the default pool if any were provided
    const pool = (customWords && customWords.length > 0)
      ? [...new Set([...customWords, ...this.allWords])]
      : this.allWords;

    // fisher-yates would be better here but this works fine for our use case
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, pool.length));
  }

  // Generate blank mask e.g. "cat" -> "_ _ _", "ice cream" -> "_ _ _   _ _ _ _ _"
  // took me a while to figure out the spacing for multi-word answers
  public generateMask(word: string, revealedIndices: Set<number> = new Set()): string {
    return word
      .split('')
      .map((char, index) => {
        if (char === ' ') return '  '; // double space to separate words
        if (char === '-') return '-';  // keep hyphens visible
        if (revealedIndices.has(index)) return char; // show revealed hints
        return '_';
      })
      .join(' ');
  }

  // Determine which letter index to reveal next as a hint
  public getNextHintIndex(word: string, currentRevealed: Set<number>): number | null {
    // find all indices that haven't been revealed yet (skip spaces and hyphens)
    const unrevealedIndices: number[] = [];
    for (let i = 0; i < word.length; i++) {
      if (word[i] !== ' ' && word[i] !== '-' && !currentRevealed.has(i)) {
        unrevealedIndices.push(i);
      }
    }

    if (unrevealedIndices.length === 0) return null;

    // Don't reveal more than ~45% of the word, otherwise it's too easy
    const maxAllowedHints = Math.max(1, Math.floor(word.length * 0.45));
    if (currentRevealed.size >= maxAllowedHints) return null;

    // pick a random unrevealed letter
    const randomIndex = Math.floor(Math.random() * unrevealedIndices.length);
    return unrevealedIndices[randomIndex];
  }
}
