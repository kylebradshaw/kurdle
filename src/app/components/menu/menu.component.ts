import { Meta } from '@angular/platform-browser';
import { StorageKey, StorageService } from 'src/app/services/storage.service';
import { NgNavigatorShareService } from 'ng-navigator-share';
import { Component, OnInit } from '@angular/core';
import { GameService } from 'src/app/services/game.service';
import { GameMode } from 'src/app/models/game';
import { ThemeService } from '@bcodes/ngx-theme-service';
import { isAfter, addDays } from 'date-fns';

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
  currentTheme = '';

  constructor(
    private storageService: StorageService,
    public ngNavigatorShareService: NgNavigatorShareService,
    public gameService: GameService,
    public themeService: ThemeService,
    private meta: Meta,
  ) {
    this.meta.addTag(
      { name: 'theme-color', content: '#ffffff' }
    );
  }

  ngOnInit(): void {
    this.initTheme();
  }

  /**
   * Inits theme
   * picks up native theme preference if available on first visit
   * otherwise we set our own
   */
  initTheme(): void {
    const theme = this.storageService.get('theme');
    if (theme !== null) {
      this.currentTheme = theme;
      this.switchTheme(theme);
    } else {
      if (window.matchMedia('prefers-color-scheme: dark').matches) {
        this.switchTheme('light'); // opposite of current theme
      } else {
        this.switchTheme('dark');// opposite of current theme
      }
    }
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

  switchTheme(previousTheme: string, flip = false): void {
    let nextTheme = (flip) ? this.intendedTheme(previousTheme) : previousTheme;
    this.themeService.switchTheme(nextTheme);
    this.meta.updateTag({ content: (nextTheme === 'light') ? '#ffffff' : '#0a0a0a' }, 'name=theme-color');
    this.storageService.set(StorageKey.Theme, nextTheme);
    this.currentTheme = nextTheme;
  }

  private intendedTheme(currentTheme: string) {
    return (currentTheme === 'light') ? 'dark' : 'light';
  }

  get sequenceIdentifier(): string {
    let sequenceIdx = this.storageService.get('sequenceIdx') as string;
    return (Number(sequenceIdx) > 0) ? ("0000" + Number(sequenceIdx)).slice(-4) : '????';
  }

  /**
   * taking -1day as the window is not correct, but ¯\_(ツ)_/¯
   *
   */
  get completedUtcCheckWithinDay(): boolean {
    let nowUtc = new Date(Date.now()).toISOString();
    let completedSequenceUtc = this.storageService.get(StorageKey.CompletedSequenceUtc);

    return isAfter(new Date(nowUtc), addDays(new Date(completedSequenceUtc), 1));
  }

  get version(): string {
    return this.storageService.get(StorageKey.Version) || '0.0.0';
  }

  get gameMode(): GameMode {
    return this.storageService.get(StorageKey.GameMode) as GameMode;
  }

}
