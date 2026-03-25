import { Injectable, inject, signal } from '@angular/core';
import { StorageKey, StorageService } from 'src/app/services/storage.service';

export type ThemeValue = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly storageService = inject(StorageService);

  readonly theme = signal<ThemeValue>(this.loadTheme());

  private loadTheme(): ThemeValue {
    const stored = this.storageService.get(StorageKey.Theme);
    const value: ThemeValue = stored === 'dark' ? 'dark' : 'light';
    this.applyTheme(value);
    return value;
  }

  toggle(): void {
    const next: ThemeValue = this.theme() === 'light' ? 'dark' : 'light';
    this.theme.set(next);
    this.storageService.set(StorageKey.Theme, next);
    this.applyTheme(next);
  }

  private applyTheme(value: ThemeValue): void {
    /* v8 ignore start -- SSR guard; always true in jsdom/browser */
    if (typeof document !== 'undefined') {
    /* v8 ignore stop */
      document.documentElement.setAttribute('data-theme', value);
    }
  }
}
