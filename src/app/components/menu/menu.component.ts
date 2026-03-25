import { Meta } from '@angular/platform-browser';
import { StorageKey, StorageService } from 'src/app/services/storage.service';
import { Component, OnInit } from '@angular/core';
import { GameService } from 'src/app/services/game.service';
import { GameMode } from 'src/app/models/game';
import { isAfter, addDays } from 'date-fns';

@Component({
  standalone: false,
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent implements OnInit {
  shareText: any;
  drawToggled = false;
  aboutToggled: boolean = false;
  updatesToggled: boolean = false;
  randomPlay: GameMode = GameMode.RANDOM;
  sequencePlay: GameMode = GameMode.SEQUENCE;
  currentTheme = '';

  constructor(
    private storageService: StorageService,
    public gameService: GameService,
    private meta: Meta,
  ) {
    this.meta.addTag(
      { name: 'theme-color', content: '#ffffff' }
    );
  }

  ngOnInit(): void {
    this.initTheme();
  }

  initTheme(): void {
    const theme = this.storageService.get('theme');
    if (theme !== null) {
      this.currentTheme = theme;
      this.switchTheme(theme);
    } else {
      if (window.matchMedia('prefers-color-scheme: dark').matches) {
        this.switchTheme('light');
      } else {
        this.switchTheme('dark');
      }
    }
  }

  toggleDrawer(): boolean {
    this.shareText = JSON.parse(this.storageService.get('shareText'));
    return this.drawToggled = !this.drawToggled;
  }

  canShare(): boolean {
    return typeof navigator !== 'undefined' && 'share' in navigator;
  }

  shareGame(): void {
    if (!this.canShare()) { return; }
    navigator.share(this.shareText)
      .then(() => { console.log(`Successful share`); })
      .catch((error: any) => { console.log(error); });
  }

  switchTheme(previousTheme: string, flip = false): void {
    let nextTheme = (flip) ? this.intendedTheme(previousTheme) : previousTheme;
    document.documentElement.setAttribute('data-theme', nextTheme);
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
