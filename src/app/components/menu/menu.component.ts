import { forceRefresh } from 'src/app/helpers/utils';
import { StorageKey, StorageService } from 'src/app/services/storage.service';
import { NgNavigatorShareService } from 'ng-navigator-share';
import { Component, OnInit } from '@angular/core';
import { string } from 'random-js';
import { GameService } from 'src/app/services/game.service';
import { GameMode } from 'src/app/models/game';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent implements OnInit {
  shareText: any;
  drawToggled = false;
  aboutToggled: boolean = false;
  randomPlay: GameMode = GameMode.RANDOM;
  sequencePlay: GameMode = GameMode.SEQUENCE;

  constructor(
    private storageService: StorageService,
    public ngNavigatorShareService: NgNavigatorShareService,
    public gameService: GameService,
  ) {}

  ngOnInit(): void {

  }

  toggleDrawer(): boolean {
    this.shareText = JSON.parse(this.storageService.get('shareText'));
    return this.drawToggled = !this.drawToggled;
  }

  /**
   * Shares game
   */
  shareGame(): void {
    // if (!this.ngNavigatorShareService.canShare()) {
    //   alert(`This service/api is not supported in your Browser`);
    //   return;
    // }

    this.ngNavigatorShareService.share(this.shareText)
      .then(() => { console.log(`Successful share`); })
      .catch((error) => { console.log(error); });
  }

  get sequenceIdentifier(): string {
    let sequenceIdx = this.storageService.get('sequenceIdx') as string;
    return (Number(sequenceIdx) > 0) ? ("0000" + Number(sequenceIdx)).slice(-4) : '????';
  }

  /**
   * expanded func should be a global utility function.
   * This method informs us if we should load the daily word, or not
   * ideally, on initGame. this completedUtc would exist and we could compare if it occured "yesterday"
   * if it did occur yesterday and we are in a Game.ENDED state, assume they are back for daily play
   * if it occurred yesterday but they are in a !Game.ENDED state, prompt them to do the daily word w/ a notice, also allow them to click the dailyword link
   *
   */
  get completedUtcCheck(): boolean {
    return !!(this.storageService.get('completedUtc') || 'null');
  }

  get version(): string {
    return this.storageService.get(StorageKey.Version) || '0.0.0';
  }

  get gameMode(): GameMode {
    return this.storageService.get(StorageKey.GameMode) as GameMode;
  }

}
