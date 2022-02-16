import { GuessFinal, GuessClass } from './guess';

export type GamePosition = [number, number];

export enum GameState {
  INITIALIZED = 'INITIALIZED',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  ENDED = 'ENDED',
  RESTORED = 'RESTORED',
}

export interface GameStats {
  currentStreak: number;
  maxStreak: number;
  guesses: GuessFinal;
  gamesPlayed: number;
  gamesWon: number;
};

export interface CombinedLetter {
  letter: string;
  class: GuessClass;
}

export interface GameTime {
  seconds: number;
  minutes: number;
  hours: number;
}
