import { GameMode, GameTime } from "src/app/models/game";
import { GuessClass } from "src/app/models/guess";

/**
 * Returns a random element from an array
 * @param arr - the array to sample from
 * @returns a random element from the array, or undefined if the array is empty
 */
export function sample<T>(arr: T[]): T | undefined {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Returns an array of characters that appear more than once in the string.
 */
export function repeatedCharacters(str: string): string[] {
  const result: string[] = [];
  const strArr = str.toLowerCase().split("").sort().join("").match(/(.)\1+/g);
  if (strArr != null) {
    strArr.forEach((elem) => {
      result.push(elem[0]);
    });
  }
  return result;
}

/**
 * Validates a round's guess — pure function extracted from GameService.solver()
 * @param sequence - the string of the guess word
 * @param decodedWord - the plaintext string of the solution word
 * @returns an array of GuessClass for each letter in sequence against the decodedWord solution
 */
export function solveGuess(sequence: string, decodedWord: string): GuessClass[] {
  const repeatedSeq = repeatedCharacters(sequence);

  return [...sequence]
    // 1st pass: match, mismatch, used
    .map((letter, idx) => {
      if (decodedWord[idx] === letter) {
        return GuessClass.MATCH;
      } else if ([...decodedWord].includes(letter)) {
        return GuessClass.MISMATCH;
      } else {
        return GuessClass.USED;
      }
    })
    // 2nd pass: mismatch resolution for repeated letters
    .map((guessClass: GuessClass, idx) => {
      const letter = [...sequence][idx];
      if (guessClass === GuessClass.MISMATCH && repeatedSeq.includes(letter)) {
        const indicies = [...sequence.matchAll(new RegExp(letter, 'g'))].map(match => match.index);
        const solIndicies = [...decodedWord.matchAll(new RegExp(letter, 'g'))].map(match => match.index);
        if (indicies.length === 2 && indicies[0] === idx) {
          if (indicies.length === solIndicies.length) {
            return GuessClass.MISMATCH;
          } else if (decodedWord.lastIndexOf(letter) === indicies.pop()) {
            return GuessClass.USED;
          } else {
            return GuessClass.MISMATCH;
          }
        } else if (indicies.length === 3 && (indicies[0] === idx || indicies[1] === idx)) {
          return GuessClass.MISMATCH;
        } else if (indicies.length === solIndicies.length) {
          return GuessClass.MISMATCH;
        }
        return GuessClass.USED;
      }
      return guessClass;
    });
}

export const nextRoundTime = (expires: string): GameTime => {
  const left = new Date(expires).getTime() - (new Date().getTime());
  return {
    seconds: Math.floor((left % 6e4) / 1e3),
    minutes: Math.floor((left % 36e5) / 6e4),
    hours: Math.floor((left % 864e5) / 36e5),
  }
};

export interface LocationLike {
  href: string;
  origin: string;
  search: string;
  reload(): void;
}

/**
 * forceRefresh is a way to toggle GameState with hard reloads
 * if ?rando=true is added to the URL, the FE will request a word at a random sequenceIdx
 * if ?rando=false is added to the URL, the FE will request a word in sequence (sets sequenceIdx === 0)
 */
export const forceRefresh = (gameMode: GameMode, loc: LocationLike = window.location): void => {
  if (gameMode === GameMode.RANDOM && !loc.href.includes('rando')) {
    loc.href = loc.href.includes(`?`) ? `${loc.href}/${loc.search}&rando=true` : `${loc.href}?rando=true`;
  } else if (gameMode === GameMode.RANDOM && loc.href.includes('rando')) {
    loc.reload();
  } else if (gameMode === GameMode.SEQUENCE) {
    loc.href = loc.origin;
  } else {
    return;
  }
};
