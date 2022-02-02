export enum GuessClass {
  MISMATCH = 'mismatch',
  MATCH = 'match',
  DEFAULT = 'default',
  USED = 'used'
}

export enum GuessAction {
  ENTER = '↵',
  DEL = '⌫'
}

export interface AlphaDict {
  [key: string]: string;
}

export type Letter = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L' | 'M' | 'N' | 'O' | 'P' | 'Q' | 'R' | 'S' | 'T' | 'U' | 'V' | 'W' | 'X' | 'Y' | 'Z';
