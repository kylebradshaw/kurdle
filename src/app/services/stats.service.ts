import { Injectable, inject, signal } from '@angular/core';
import { StorageKey, StorageService } from 'src/app/services/storage.service';
import { GameMode } from 'src/app/models/game';

export interface GameStats {
  played: number;
  won: number;
  lost: number;
  streak: number;
  maxStreak: number;
  distribution: Record<number, number>; // round number → count
}

const DEFAULT_STATS: GameStats = {
  played: 0,
  won: 0,
  lost: 0,
  streak: 0,
  maxStreak: 0,
  distribution: {},
};

@Injectable({
  providedIn: 'root'
})
export class StatsService {
  private readonly storageService = inject(StorageService);

  readonly stats = signal<GameStats>(this.loadStats());

  private loadStats(): GameStats {
    const raw = this.storageService.get(StorageKey.Stats);
    if (raw) {
      try {
        return { ...DEFAULT_STATS, ...JSON.parse(raw) };
      } catch {
        return { ...DEFAULT_STATS };
      }
    }
    return { ...DEFAULT_STATS };
  }

  recordGame(won: boolean, round: number, mode: GameMode): void {
    const current = this.stats();
    const updated: GameStats = {
      ...current,
      played: current.played + 1,
      won: won ? current.won + 1 : current.won,
      lost: won ? current.lost : current.lost + 1,
      streak: won ? current.streak + 1 : 0,
      maxStreak: won
        ? Math.max(current.maxStreak, current.streak + 1)
        : current.maxStreak,
      distribution: {
        ...current.distribution,
        [round]: (current.distribution[round] || 0) + (won ? 1 : 0),
      },
    };
    this.stats.set(updated);
    this.storageService.set(StorageKey.Stats, JSON.stringify(updated));
  }
}
