import { TestBed } from '@angular/core/testing';
import { StorageKey, StorageService } from 'src/app/services/storage.service';
import { GameMode } from 'src/app/models/game';
import { StatsService, GameStats } from './stats.service';

describe('StatsService', () => {
  let service: StatsService;
  let storage: StorageService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    storage = TestBed.inject(StorageService);
    service = TestBed.inject(StatsService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('initializes with default stats when nothing in storage', () => {
    const stats = service.stats();
    expect(stats.played).toBe(0);
    expect(stats.won).toBe(0);
    expect(stats.lost).toBe(0);
    expect(stats.streak).toBe(0);
    expect(stats.maxStreak).toBe(0);
    expect(stats.distribution).toEqual({});
  });

  it('loads existing stats from storage', () => {
    localStorage.clear();
    const existing: GameStats = {
      played: 5, won: 3, lost: 2, streak: 2, maxStreak: 3,
      distribution: { 3: 2, 4: 1 },
    };
    storage.set(StorageKey.Stats, JSON.stringify(existing));

    // Re-create the service to trigger loadStats
    const freshService = TestBed.inject(StatsService);
    // Since it's a singleton, we need a new TestBed
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const newStorage = TestBed.inject(StorageService);
    const newService = TestBed.inject(StatsService);
    const stats = newService.stats();
    expect(stats.played).toBe(5);
    expect(stats.won).toBe(3);
  });

  it('handles corrupt JSON in storage gracefully', () => {
    localStorage.setItem('stats', 'not-json');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const newService = TestBed.inject(StatsService);
    expect(newService.stats().played).toBe(0);
  });

  describe('recordGame', () => {
    it('records a win', () => {
      service.recordGame(true, 3, GameMode.SEQUENCE);
      const stats = service.stats();
      expect(stats.played).toBe(1);
      expect(stats.won).toBe(1);
      expect(stats.lost).toBe(0);
      expect(stats.streak).toBe(1);
      expect(stats.maxStreak).toBe(1);
      expect(stats.distribution[3]).toBe(1);
    });

    it('records a loss', () => {
      service.recordGame(false, 6, GameMode.RANDOM);
      const stats = service.stats();
      expect(stats.played).toBe(1);
      expect(stats.won).toBe(0);
      expect(stats.lost).toBe(1);
      expect(stats.streak).toBe(0);
      expect(stats.distribution[6]).toBe(0);
    });

    it('increments streak on consecutive wins', () => {
      service.recordGame(true, 3, GameMode.SEQUENCE);
      service.recordGame(true, 4, GameMode.SEQUENCE);
      service.recordGame(true, 2, GameMode.SEQUENCE);
      expect(service.stats().streak).toBe(3);
      expect(service.stats().maxStreak).toBe(3);
    });

    it('resets streak on loss but preserves maxStreak', () => {
      service.recordGame(true, 3, GameMode.SEQUENCE);
      service.recordGame(true, 4, GameMode.SEQUENCE);
      service.recordGame(false, 6, GameMode.RANDOM);
      expect(service.stats().streak).toBe(0);
      expect(service.stats().maxStreak).toBe(2);
    });

    it('persists to storage', () => {
      service.recordGame(true, 3, GameMode.SEQUENCE);
      const raw = storage.get(StorageKey.Stats);
      expect(raw).toBeTruthy();
      const parsed = JSON.parse(raw);
      expect(parsed.played).toBe(1);
      expect(parsed.won).toBe(1);
    });

    it('accumulates distribution counts', () => {
      service.recordGame(true, 3, GameMode.SEQUENCE);
      service.recordGame(true, 3, GameMode.SEQUENCE);
      service.recordGame(true, 4, GameMode.SEQUENCE);
      expect(service.stats().distribution[3]).toBe(2);
      expect(service.stats().distribution[4]).toBe(1);
    });
  });
});
