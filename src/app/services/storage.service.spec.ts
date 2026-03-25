import { TestBed } from '@angular/core/testing';
import { StorageService, StorageKey } from './storage.service';

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(StorageService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should detect client environment', () => {
    expect(service.isClient).toBe(true);
  });

  describe('set and get', () => {
    it('stores and retrieves a value', () => {
      service.set(StorageKey.Word, 'dGVzdA==');
      expect(service.get(StorageKey.Word)).toBe('dGVzdA==');
    });

    it('returns null-ish for missing key', () => {
      const result = service.get('nonexistent');
      expect(result).toBeNull();
    });

    it('overwrites existing value', () => {
      service.set(StorageKey.Version, '1.0');
      service.set(StorageKey.Version, '2.0');
      expect(service.get(StorageKey.Version)).toBe('2.0');
    });
  });

  describe('remove', () => {
    it('removes a stored key', () => {
      service.set(StorageKey.Word, 'test');
      service.remove(StorageKey.Word);
      expect(service.get(StorageKey.Word)).toBeNull();
    });

    it('resets gameState signal when removing GameState', () => {
      service.set(StorageKey.GameState, 'PLAYING');
      expect(service.gameState()).toBe('PLAYING');
      service.remove(StorageKey.GameState);
      expect(service.gameState()).toBe('');
    });

    it('resets gameMode signal when removing GameMode', () => {
      service.set(StorageKey.GameMode, 'SEQUENCE');
      expect(service.gameMode()).toBe('SEQUENCE');
      service.remove(StorageKey.GameMode);
      expect(service.gameMode()).toBe('');
    });

    it('resets theme signal when removing Theme', () => {
      service.set(StorageKey.Theme, 'dark');
      expect(service.theme()).toBe('dark');
      service.remove(StorageKey.Theme);
      expect(service.theme()).toBe('');
    });
  });

  describe('clear', () => {
    it('does nothing when force is false', () => {
      service.set(StorageKey.Word, 'test');
      service.clear(false);
      expect(service.get(StorageKey.Word)).toBe('test');
    });

    it('clears localStorage but preserves hotfix, version, theme, completedSequenceUtc', () => {
      service.set(StorageKey.Hotfix, 'fix1');
      service.set(StorageKey.Version, '1.0');
      service.set(StorageKey.Theme, 'dark');
      service.set(StorageKey.CompletedSequenceUtc, '2022-01-01');
      service.set(StorageKey.Word, 'test');
      service.set(StorageKey.Board, 'board-data');

      service.clear(true);

      expect(service.get(StorageKey.Hotfix)).toBe('fix1');
      expect(service.get(StorageKey.Version)).toBe('1.0');
      expect(service.get(StorageKey.Theme)).toBe('dark');
      expect(service.get(StorageKey.CompletedSequenceUtc)).toBe('2022-01-01');
      expect(service.get(StorageKey.Word)).toBeNull();
      expect(service.get(StorageKey.Board)).toBeNull();
    });

    it('resets gameState and gameMode signals but preserves theme signal', () => {
      service.set(StorageKey.GameState, 'PLAYING');
      service.set(StorageKey.GameMode, 'RANDOM');
      service.set(StorageKey.Theme, 'dark');

      service.clear(true);

      expect(service.gameState()).toBe('');
      expect(service.gameMode()).toBe('');
      expect(service.theme()).toBe('dark');
    });

    it('handles clear when theme was never set (null)', () => {
      localStorage.removeItem('theme');
      service.clear(true);
      // localStorage.getItem returns null, setItem('theme', null) stores "null" string
      // but theme ?? '' falls back to '' for the signal
      expect(service.theme()).toBe('');
      // localStorage stores the string "null" because setItem coerces null
      expect(localStorage.getItem('theme')).toBe('null');
    });
  });

  describe('signal reactivity', () => {
    it('gameState signal updates when set() is called with GameState key', () => {
      expect(service.gameState()).toBe('');
      service.set(StorageKey.GameState, 'INITIALIZED');
      expect(service.gameState()).toBe('INITIALIZED');
      service.set(StorageKey.GameState, 'PLAYING');
      expect(service.gameState()).toBe('PLAYING');
    });

    it('gameMode signal updates when set() is called with GameMode key', () => {
      expect(service.gameMode()).toBe('');
      service.set(StorageKey.GameMode, 'SEQUENCE');
      expect(service.gameMode()).toBe('SEQUENCE');
    });

    it('theme signal updates when set() is called with Theme key', () => {
      expect(service.theme()).toBe('');
      service.set(StorageKey.Theme, 'dark');
      expect(service.theme()).toBe('dark');
    });

    it('signals do not update for non-tracked keys', () => {
      service.set(StorageKey.Word, 'test');
      expect(service.gameState()).toBe('');
      expect(service.gameMode()).toBe('');
      expect(service.theme()).toBe('');
    });
  });

  describe('StorageKey enum', () => {
    it('has all expected keys', () => {
      expect(StorageKey.Board).toBe('board');
      expect(StorageKey.ClassBoard).toBe('classBoard');
      expect(StorageKey.CombinedBoard).toBe('combinedBoard');
      expect(StorageKey.CompletedGameMode).toBe('completedGameMode');
      expect(StorageKey.CompletedSequenceIdx).toBe('completedSequenceIdx');
      expect(StorageKey.CompletedSequenceUtc).toBe('completedSequenceUtc');
      expect(StorageKey.GameState).toBe('gameState');
      expect(StorageKey.GameMode).toBe('gameMode');
      expect(StorageKey.Hotfix).toBe('hotfix');
      expect(StorageKey.NextSequenceUtc).toBe('nextSequenceUtc');
      expect(StorageKey.RoundIdx).toBe('roundIdx');
      expect(StorageKey.SequenceIdx).toBe('sequenceIdx');
      expect(StorageKey.ShareText).toBe('shareText');
      expect(StorageKey.Stats).toBe('stats');
      expect(StorageKey.Theme).toBe('theme');
      expect(StorageKey.Word).toBe('word');
      expect(StorageKey.Version).toBe('version');
    });
  });

  describe('non-client mode (isClient = false)', () => {
    beforeEach(() => {
      service.isClient = false;
    });

    afterEach(() => {
      service.isClient = true;
    });

    it('set does not write to localStorage', () => {
      localStorage.clear();
      service.set(StorageKey.Word, 'test');
      expect(localStorage.getItem(StorageKey.Word)).toBeNull();
    });

    it('get returns undefined when not client', () => {
      const result = service.get(StorageKey.Word);
      // When isClient is false, data stays undefined, cast as string
      expect(result).toBeUndefined();
    });

    it('clear with force=true does not clear localStorage', () => {
      localStorage.setItem('word', 'test');
      service.clear(true);
      expect(localStorage.getItem('word')).toBe('test');
    });
  });
});
