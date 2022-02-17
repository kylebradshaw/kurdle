import { forceRefresh } from 'src/app/helpers/utils';
import { StorageService } from 'src/app/services/storage.service';
import { NgNavigatorShareService } from 'ng-navigator-share';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent implements OnInit {
  shareText: any;
  drawToggled = false;
  aboutToggled: boolean = false;

  constructor(
    private storageService: StorageService,
    public ngNavigatorShareService: NgNavigatorShareService,
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

  /**
   * Reloads game
   * Gross but a mouse click that fires initGame() has downstream issues ¯\_(ツ)_/¯
   * unsure if this even works tbh - need to use ServiceWorkers
   */
  reloadGame(mode: boolean): void {
    this.storageService.clear(true);
    forceRefresh(mode);
  }

  get completed(): string {
    return this.storageService.get('completed');
  }

  get alreadyPlayed(): boolean {
    return new Date(this.completed).getDate() === new Date().getDate();
  }

}
