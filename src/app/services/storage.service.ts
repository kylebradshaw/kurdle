import { Injectable, signal, WritableSignal } from '@angular/core';
import { GameState } from 'src/app/models/game';

export enum StorageKey {
  Board = 'board',
  ClassBoard = 'classBoard',
  CombinedBoard = 'combinedBoard',
  CompletedGameMode = 'completedGameMode',
  CompletedSequenceIdx = 'completedSequenceIdx',
  CompletedSequenceUtc = 'completedSequenceUtc',
  GameState = 'gameState',
  GameMode = 'gameMode',
  Hotfix = 'hotfix',
  NextSequenceUtc = 'nextSequenceUtc',
  RoundIdx = 'roundIdx',
  SequenceIdx = 'sequenceIdx',
  ShareText = 'shareText',
  Stats = 'stats',
  Theme = 'theme',
  Word = 'word',
  Version = 'version',
}

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  isClient = false;

  readonly gameState: WritableSignal<string>;
  readonly gameMode: WritableSignal<string>;
  readonly theme: WritableSignal<string>;

  constructor() {
    /* v8 ignore start -- SSR guard; always true in jsdom/browser */
    if (typeof window !== 'undefined') {
    /* v8 ignore stop */
      this.isClient = true;
    }
    this.gameState = signal(this.get(StorageKey.GameState) ?? '');
    this.gameMode = signal(this.get(StorageKey.GameMode) ?? '');
    this.theme = signal(this.get(StorageKey.Theme) ?? '');
  }

  public clear(force = false) {
    if (this.isClient && force) {
      const hotfix = localStorage.getItem('hotfix') as string;
      const version = localStorage.getItem('version') as string;
      const theme = localStorage.getItem('theme') as string;
      const completed = localStorage.getItem('completedSequenceUtc') as string;
      localStorage.clear();
      localStorage.setItem('hotfix', hotfix);
      localStorage.setItem('version', version);
      localStorage.setItem('theme', theme);
      localStorage.setItem('completedSequenceUtc', completed);
      this.gameState.set('');
      this.gameMode.set('');
      this.theme.set(theme ?? '');
    }
  }

  public set(key: string, data: string) {
    if (this.isClient) {
      localStorage.setItem(key, data);
      if (key === StorageKey.GameState) {
        this.gameState.set(data);
      } else if (key === StorageKey.GameMode) {
        this.gameMode.set(data);
      } else if (key === StorageKey.Theme) {
        this.theme.set(data);
      }
    }
  }

  public get(key: string): string {
    let data;
    if (this.isClient) {
      data = localStorage.getItem(key);
    }
    return data as string;
  }

  public remove(key: string): void {
    localStorage.removeItem(key);
    if (key === StorageKey.GameState) {
      this.gameState.set('');
    } else if (key === StorageKey.GameMode) {
      this.gameMode.set('');
    } else if (key === StorageKey.Theme) {
      this.theme.set('');
    }
  }
}
