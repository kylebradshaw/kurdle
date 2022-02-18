import { forceRefresh } from 'src/app/helpers/utils';
import { StorageService } from 'src/app/services/storage.service';
import { NgNavigatorShareService } from 'ng-navigator-share';
import { Component, OnInit } from '@angular/core';
import { string } from 'random-js';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent implements OnInit {
  shareText: any;
  drawToggled = false;
  aboutToggled: boolean = false;
  sequenceIdentifier = '';

  constructor(
    private storageService: StorageService,
    public ngNavigatorShareService: NgNavigatorShareService,
  ) {}

  ngOnInit(): void {
    const sequenceIdx = this.storageService.get('sequenceIdx');
    this.sequenceIdentifier = `${("0000" + sequenceIdx).slice(-4)}`;
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

  /**
   * Reloads game
   * Gross but a mouse click that fires initGame() has downstream issues ¯\_(ツ)_/¯
   * unsure if this even works tbh - need to use ServiceWorkers
   */
  reloadGame(mode: boolean): void {
    this.storageService.clear(true);
    forceRefresh(mode);
  }

  get completedUtcCheck(): boolean {
    return !!(this.storageService.get('completedUtc') || 'null');
  }

}
