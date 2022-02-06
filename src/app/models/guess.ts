export enum GuessClass {
  MISMATCH = 'mismatch',
  MATCH = 'match',
  DEFAULT = 'default',
  USED = 'used'
}

export enum GuessAction {
  ENTER = '⏎',
  DEL = '⌫'
}

interface GuessLetter {
  class: GuessClass;
  idx: number[];
}

export interface AlphaDict {
  [key: string]: GuessLetter;
}

export type Letter = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L' | 'M' | 'N' | 'O' | 'P' | 'Q' | 'R' | 'S' | 'T' | 'U' | 'V' | 'W' | 'X' | 'Y' | 'Z';
