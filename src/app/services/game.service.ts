import { StorageKey, StorageService } from 'src/app/services/storage.service';
import { Injectable } from '@angular/core';
import { forceRefresh } from 'src/app/helpers';
import { GameMode, GameState } from 'src/app/models/game';
import { isBefore, isAfter } from 'date-fns';
// import {} from 'date-fns-tz';
import { get } from 'lodash';

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
}
