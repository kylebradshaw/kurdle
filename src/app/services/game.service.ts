import { WordService } from 'src/app/services/word.service';
import { StorageKey, StorageService } from 'src/app/services/storage.service';
import { Injectable } from '@angular/core';
import { forceRefresh } from 'src/app/helpers';
import { GameMode, GameState } from 'src/app/models/game';
import { isBefore, isAfter } from 'date-fns';
// import {} from 'date-fns-tz';
import { get } from 'lodash';
import { GuessClass } from 'src/app/models/guess';

export enum ProceedState {
  SequenceNew = 'sequenceNew',
  RandomNew = 'randomNew',
}

@Injectable({
  providedIn: 'root'
})
export class GameService {
  randomPlay: GameMode = GameMode.RANDOM;
  sequencePlay: GameMode = GameMode.SEQUENCE;

  constructor(
    private storageService: StorageService,
    private wordService: WordService,
  ) { }

  /**
   * directs a user to the SEQUENCE or RANDOM flow at the appropriate time  on first visit
   * returns a ProceedState enum (tbd) to render a future notice(?)
   */
  directUserFlow(): void {
    let gameState = this.storageService.get(StorageKey.GameState) as GameState;
    // let gameMode = this.storageService.get(StorageKey.CompletedGameMode) as GameMode;
    // let completedSequenceUtc = this.storageService.get(StorageKey.CompletedSequenceUtc);
    let nextSequenceUtc = this.storageService.get(StorageKey.NextSequenceUtc);
    let nowUtc = new Date(Date.now()).toISOString();

    // hey you're trying to play an old stored sequence, let's reset you to sequence mode!
    if ((gameState === GameState.RESTORED || gameState === GameState.ENDED) &&
          isAfter(new Date(nowUtc), new Date(nextSequenceUtc))) {
      this.reloadGame(GameMode.SEQUENCE);
    }
  }


  /**
   * Reloads game
   * Gross but a mouse click that fires initGame() has downstream issues ¯\_(ツ)_/¯
   * unsure if this even works tbh - need to use ServiceWorkers
   * #66 better handling of init game states
   */
  reloadGame(gameMode: GameMode): void {
    this.storageService.clear(true);
    this.storageService.set(StorageKey.GameMode, GameMode[gameMode]);
    forceRefresh(gameMode);
  }

  /**
   * Validates a round's guess
   * @param sequence - the string of the guess word
   * @param decodeWord - the plaintext string of the solution word
   * @returns an array of GuessClass for each letter in sequence against the decodeWord solution
   */
  solver(sequence: string, decodedWord: string): GuessClass[] {
    const repeatedSequence = this.wordService.repeatedCharacters(sequence);

    return [...sequence]
      // 1st pass does the match and unused
      .map((letter, idx) => {
        if (decodedWord[idx] === letter) {
          return GuessClass.MATCH;
        } else if ([...decodedWord].includes(letter)) {
          return GuessClass.MISMATCH;
        } else {
          return GuessClass.USED;
        }
      })
      // 2nd pass figures out mismatch resolution
      .map((guessClass: GuessClass, idx) => {
        const letter = [...sequence][idx];
        if (guessClass === GuessClass.MISMATCH && repeatedSequence.includes(letter)) {
          // what are the indicies of the repeated letter
          const indicies = [...sequence.matchAll(new RegExp(letter, 'g'))].map(match => match.index);
          if (indicies.length === 2 && indicies[0] === idx) {
            // only take the first index into consideration
            return GuessClass.MISMATCH;
          } else if (indicies.length === 3 && (indicies[0] === idx || indicies[1] === idx)) {
            // only take the first 2 indicies into consideration
            return GuessClass.MISMATCH;
          }
          return GuessClass.USED;
        }
        return guessClass;
      });
  }
}
