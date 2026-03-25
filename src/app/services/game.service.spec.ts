import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { GuessClass } from 'src/app/models/guess';
import { StorageKey, StorageService } from 'src/app/services/storage.service';
import { GameMode, GameState } from 'src/app/models/game';
import { GameService, ProceedState } from './game.service';
import * as helpers from 'src/app/helpers/utils';

describe('GameService', () => {
  let service: GameService;
  let storage: StorageService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient()],
    });
    service = TestBed.inject(GameService);
    storage = TestBed.inject(StorageService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('exposes randomPlay and sequencePlay mode constants', () => {
    expect(service.randomPlay).toBe(GameMode.RANDOM);
    expect(service.sequencePlay).toBe(GameMode.SEQUENCE);
  });

  describe('ProceedState enum', () => {
    it('has expected values', () => {
      expect(ProceedState.SequenceNew).toBe('sequenceNew');
      expect(ProceedState.RandomNew).toBe('randomNew');
    });
  });

  describe('directUserFlow()', () => {
    it('reloads game to SEQUENCE when state is RESTORED and next sequence is in the past', () => {
      const past = new Date(Date.now() - 60000).toISOString();
      storage.set(StorageKey.GameState, GameState.RESTORED);
      storage.set(StorageKey.NextSequenceUtc, past);

      const spy = vi.spyOn(helpers, 'forceRefresh').mockImplementation(() => {});
      service.directUserFlow();

      expect(spy).toHaveBeenCalledWith(GameMode.SEQUENCE);
      spy.mockRestore();
    });

    it('reloads game to SEQUENCE when state is ENDED and next sequence is in the past', () => {
      const past = new Date(Date.now() - 60000).toISOString();
      storage.set(StorageKey.GameState, GameState.ENDED);
      storage.set(StorageKey.NextSequenceUtc, past);

      const spy = vi.spyOn(helpers, 'forceRefresh').mockImplementation(() => {});
      service.directUserFlow();

      expect(spy).toHaveBeenCalledWith(GameMode.SEQUENCE);
      spy.mockRestore();
    });

    it('does nothing when state is PLAYING', () => {
      storage.set(StorageKey.GameState, GameState.PLAYING);
      storage.set(StorageKey.NextSequenceUtc, new Date(Date.now() - 60000).toISOString());

      const spy = vi.spyOn(helpers, 'forceRefresh').mockImplementation(() => {});
      service.directUserFlow();

      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });

    it('does nothing when next sequence is in the future', () => {
      const future = new Date(Date.now() + 3600000).toISOString();
      storage.set(StorageKey.GameState, GameState.RESTORED);
      storage.set(StorageKey.NextSequenceUtc, future);

      const spy = vi.spyOn(helpers, 'forceRefresh').mockImplementation(() => {});
      service.directUserFlow();

      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });

    it('does nothing when no game state is set', () => {
      const spy = vi.spyOn(helpers, 'forceRefresh').mockImplementation(() => {});
      service.directUserFlow();

      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe('reloadGame()', () => {
    it('clears storage, sets game mode, and force refreshes for SEQUENCE', () => {
      storage.set(StorageKey.Word, 'test');
      const spy = vi.spyOn(helpers, 'forceRefresh').mockImplementation(() => {});

      service.reloadGame(GameMode.SEQUENCE);

      expect(storage.get(StorageKey.Word)).toBeNull();
      expect(storage.get(StorageKey.GameMode)).toBe('SEQUENCE');
      expect(spy).toHaveBeenCalledWith(GameMode.SEQUENCE);
      spy.mockRestore();
    });

    it('clears storage, sets game mode, and force refreshes for RANDOM', () => {
      const spy = vi.spyOn(helpers, 'forceRefresh').mockImplementation(() => {});

      service.reloadGame(GameMode.RANDOM);

      expect(storage.get(StorageKey.GameMode)).toBe('RANDOM');
      expect(spy).toHaveBeenCalledWith(GameMode.RANDOM);
      spy.mockRestore();
    });
  });

  describe('solver() delegates to solveGuess', () => {
    it('should solve frame/frame', () => {
      expect(service.solver('frame', 'frame')).toEqual([GuessClass.MATCH, GuessClass.MATCH, GuessClass.MATCH, GuessClass.MATCH, GuessClass.MATCH]);
    });
    it('should solve retry/rebut', () => {
      expect(service.solver('retry', 'rebut')).toEqual([GuessClass.MATCH, GuessClass.MATCH, GuessClass.MISMATCH, GuessClass.USED, GuessClass.USED]);
    });
    it('should solve mammy/mommy', () => {
      expect(service.solver('mammy', 'mommy')).toEqual([GuessClass.MATCH, GuessClass.USED, GuessClass.MATCH, GuessClass.MATCH, GuessClass.MATCH]);
    });
    it('should solve plate/pleat', () => {
      expect(service.solver('plate', 'pleat')).toEqual([GuessClass.MATCH, GuessClass.MATCH, GuessClass.MISMATCH, GuessClass.MISMATCH, GuessClass.MISMATCH]);
    });
    it('should solve bully/blurt', () => {
      expect(service.solver('bully', 'blurt')).toEqual([GuessClass.MATCH, GuessClass.MISMATCH, GuessClass.MISMATCH, GuessClass.USED, GuessClass.USED]);
    });
    it('should solve terse/trend', () => {
      expect(service.solver('terse', 'trend')).toEqual([GuessClass.MATCH, GuessClass.MISMATCH, GuessClass.MISMATCH, GuessClass.USED, GuessClass.USED]);
    });
    it('should solve stiff/swift', () => {
      expect(service.solver('stiff', 'swift')).toEqual([GuessClass.MATCH, GuessClass.MISMATCH, GuessClass.MATCH, GuessClass.MATCH, GuessClass.USED]);
    });
    it('should solve swift/stiff', () => {
      expect(service.solver('swift', 'stiff')).toEqual([GuessClass.MATCH, GuessClass.USED, GuessClass.MATCH, GuessClass.MATCH, GuessClass.MISMATCH]);
    });
    it('should solve piece/prize', () => {
      expect(service.solver('piece', 'prize')).toEqual([GuessClass.MATCH, GuessClass.MISMATCH, GuessClass.USED, GuessClass.USED, GuessClass.MATCH]);
    });
    it('should solve evoke/bowel', () => {
      expect(service.solver('evoke', 'bowel')).toEqual([GuessClass.MISMATCH, GuessClass.USED, GuessClass.MISMATCH, GuessClass.USED, GuessClass.USED]);
    });
    it('should solve tally/talon', () => {
      expect(service.solver('tally', 'talon')).toEqual([GuessClass.MATCH, GuessClass.MATCH, GuessClass.MATCH, GuessClass.USED, GuessClass.USED]);
    });
    it('should solve apart/azure', () => {
      expect(service.solver('apart', 'azure')).toEqual([GuessClass.MATCH, GuessClass.USED, GuessClass.USED, GuessClass.MATCH, GuessClass.USED]);
    });
    it('should solve woody/glove', () => {
      expect(service.solver('woody', 'glove')).toEqual([GuessClass.USED, GuessClass.USED, GuessClass.MATCH, GuessClass.USED, GuessClass.USED]);
    });
    it('should solve attic/admit', () => {
      expect(service.solver('attic', 'admit')).toEqual([GuessClass.MATCH, GuessClass.MISMATCH, GuessClass.USED, GuessClass.MATCH, GuessClass.USED]);
    });
    it('should solve salsa/lasso', () => {
      expect(service.solver('salsa', 'lasso')).toEqual([GuessClass.MISMATCH, GuessClass.MATCH, GuessClass.MISMATCH, GuessClass.MATCH, GuessClass.USED]);
    });
    it('should solve moody/motto', () => {
      expect(service.solver('moody', 'motto')).toEqual([GuessClass.MATCH, GuessClass.MATCH, GuessClass.MISMATCH, GuessClass.USED, GuessClass.USED]);
    });
  });
});
