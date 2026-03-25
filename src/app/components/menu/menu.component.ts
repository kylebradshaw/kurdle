import { Meta } from '@angular/platform-browser';
import { StorageKey, StorageService } from 'src/app/services/storage.service';
import { Component, OnInit, inject } from '@angular/core';
import { NgClass } from '@angular/common';
import { GameService } from 'src/app/services/game.service';
import { ThemeService } from 'src/app/services/theme.service';
import { GameMode } from 'src/app/models/game';
import { isAfter, addDays } from 'date-fns';
import { CountdownComponent } from 'src/app/components/countdown/countdown.component';

@Component({
  standalone: true,
  imports: [NgClass, CountdownComponent],
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent implements OnInit {
  private readonly storageService = inject(StorageService);
  readonly gameService = inject(GameService);
  private readonly themeService = inject(ThemeService);
  private readonly meta = inject(Meta);

  shareText: any;
  drawToggled = false;
  aboutToggled = false;
  updatesToggled = false;
  randomPlay = GameMode.RANDOM;
  sequencePlay = GameMode.SEQUENCE;

  get currentTheme(): string {
    return this.themeService.theme();
  }

  constructor() {
    this.meta.addTag({ name: 'theme-color', content: '#ffffff' });
  }

  ngOnInit(): void {
    this.updateMetaThemeColor();
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

  toggleTheme(): void {
    this.themeService.toggle();
    this.updateMetaThemeColor();
  }

  private updateMetaThemeColor(): void {
    const theme = this.themeService.theme();
    this.meta.updateTag(
      { content: theme === 'light' ? '#ffffff' : '#0a0a0a' },
      'name=theme-color'
    );
  }

  get sequenceIdentifier(): string {
    const sequenceIdx = this.storageService.get('sequenceIdx') as string;
    return (Number(sequenceIdx) > 0) ? ("0000" + Number(sequenceIdx)).slice(-4) : '????';
  }

  get completedUtcCheckWithinDay(): boolean {
    const nowUtc = new Date(Date.now()).toISOString();
    const completedSequenceUtc = this.storageService.get(StorageKey.CompletedSequenceUtc);

    return isAfter(new Date(nowUtc), addDays(new Date(completedSequenceUtc), 1));
  }

  get version(): string {
    return this.storageService.get(StorageKey.Version) || '0.0.0';
  }

  get gameMode(): GameMode {
    return this.storageService.get(StorageKey.GameMode) as GameMode;
  }
}
