import { StorageService } from 'src/app/services/storage.service';
import { NgNavigatorShareService } from 'ng-navigator-share';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent implements OnInit {
  drawToggled = false;
  shareText: any;

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

}
