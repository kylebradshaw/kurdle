export enum GuessClass {
  MISMATCH = 'mismatch',
}

export type Letter = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L' | 'M' | 'N' | 'O' | 'P' | 'Q' | 'R' | 'S' | 'T' | 'U' | 'V' | 'W' | 'X' | 'Y' | 'Z';
export type LetterGuess = 0 | 1 | 2;

export interface Guess {
  word: [Letter, Letter, Letter, Letter, Letter];
  guesses: [LetterGuess, LetterGuess, LetterGuess, LetterGuess, LetterGuess];
  solution: string;
}
