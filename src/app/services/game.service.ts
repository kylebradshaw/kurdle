import { StorageService } from 'src/app/services/storage.service';
import { Injectable } from '@angular/core';
import { forceRefresh } from 'src/app/helpers';
import { GameMode, GameState } from 'src/app/models/game';
@Injectable({
  providedIn: 'root'
})
export class GameService {

  constructor(
    private storageService: StorageService,
  ) { }


  /**
   * Reloads game
   * Gross but a mouse click that fires initGame() has downstream issues ¯\_(ツ)_/¯
   * unsure if this even works tbh - need to use ServiceWorkers
   * #66 better handling of init game states
   */
  reloadGame(gameMode: GameMode): void {
    this.storageService.clear(true);
    this.storageService.set('gameMode', GameMode[gameMode]);
    forceRefresh(gameMode);
  }
}
