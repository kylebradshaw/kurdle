import { Injectable, inject } from '@angular/core';
import { WordService } from 'src/app/services/word.service';
import { StorageKey, StorageService } from 'src/app/services/storage.service';
import { forceRefresh, solveGuess } from 'src/app/helpers';
import { GameMode, GameState } from 'src/app/models/game';
import { isAfter } from 'date-fns';
import { GuessClass } from 'src/app/models/guess';

export enum ProceedState {
  SequenceNew = 'sequenceNew',
  RandomNew = 'randomNew',
}

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private readonly storageService = inject(StorageService);
  private readonly wordService = inject(WordService);

  randomPlay: GameMode = GameMode.RANDOM;
  sequencePlay: GameMode = GameMode.SEQUENCE;

  /**
   * directs a user to the SEQUENCE or RANDOM flow at the appropriate time on first visit
   */
  directUserFlow(): void {
    const gameState = this.storageService.get(StorageKey.GameState) as GameState;
    const nextSequenceUtc = this.storageService.get(StorageKey.NextSequenceUtc);
    const nowUtc = new Date(Date.now()).toISOString();

    if ((gameState === GameState.RESTORED || gameState === GameState.ENDED) &&
          isAfter(new Date(nowUtc), new Date(nextSequenceUtc))) {
      this.reloadGame(GameMode.SEQUENCE);
    }
  }

  /**
   * Reloads game
   */
  reloadGame(gameMode: GameMode): void {
    this.storageService.clear(true);
    this.storageService.set(StorageKey.GameMode, GameMode[gameMode]);
    forceRefresh(gameMode);
  }

  /**
   * Validates a round's guess — delegates to pure solveGuess function
   */
  solver(sequence: string, decodedWord: string): GuessClass[] {
    return solveGuess(sequence, decodedWord);
  }
}
