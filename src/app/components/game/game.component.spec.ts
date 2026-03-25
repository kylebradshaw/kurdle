import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { StorageKey, StorageService } from 'src/app/services/storage.service';
import { WordService, FuncWord } from 'src/app/services/word.service';
import { GameService } from 'src/app/services/game.service';
import { GameState, GameMode } from 'src/app/models/game';
import { GuessClass, GuessAction } from 'src/app/models/guess';
import { GameComponent } from './game.component';
import * as helpers from 'src/app/helpers/utils';

const mockFuncWord: FuncWord = {
  word: btoa('frame'),
  sequence: 1,
  mode: GameMode.SEQUENCE,
  version: '0.14.11',
  dates: [new Date('2022-03-01'), new Date('2022-03-02')],
};

describe('GameComponent', () => {
  let component: GameComponent;
  let fixture: ComponentFixture<GameComponent>;
  let storage: StorageService;
  let wordService: WordService;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    localStorage.clear();
    vi.spyOn(helpers, 'forceRefresh').mockImplementation(() => {});
    (window as any).plausible = vi.fn();

    await TestBed.configureTestingModule({
      imports: [GameComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();

    storage = TestBed.inject(StorageService);
    wordService = TestBed.inject(WordService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  function flushWordRequests() {
    const req = httpMock.match(r => r.url.includes('/.netlify/functions/word'));
    req.forEach(r => r.flush(mockFuncWord));
  }

  function createComponent() {
    fixture = TestBed.createComponent(GameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    flushWordRequests();
  }

  afterEach(() => {
    // Re-assign plausible as a no-op before verify, since setTimeout callbacks
    // from submitRound may fire after test cleanup
    (window as any).plausible = () => {};
    httpMock.verify();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('should create', () => {
    createComponent();
    expect(component).toBeTruthy();
  });

  describe('initGame', () => {
    it('resets game state', () => {
      createComponent();
      expect(component.endState).toBe(false);
      expect(component.prevRound).toBe(0);
    });

    it('sets word from response', () => {
      createComponent();
      expect(component.currentWord).toBe(btoa('frame'));
      expect(component.decodedWord).toBe('frame');
    });

    it('restores game state when sequenceIdx exists', () => {
      storage.set(StorageKey.SequenceIdx, '5');
      createComponent();
      expect(storage.get(StorageKey.GameState)).toBe(GameState.RESTORED);
    });

    it('initializes new game when no sequenceIdx', () => {
      createComponent();
      expect(storage.get(StorageKey.GameState)).not.toBe(GameState.RESTORED);
    });

    it('loads saved board and classBoard', () => {
      const board = [['f','r','a','m','e'],['','','','',''],['','','','',''],['','','','',''],['','','','',''],['','','','','']];
      const classBoard = [[GuessClass.MATCH,GuessClass.MATCH,GuessClass.MATCH,GuessClass.MATCH,GuessClass.MATCH],[GuessClass.DEFAULT,GuessClass.DEFAULT,GuessClass.DEFAULT,GuessClass.DEFAULT,GuessClass.DEFAULT],[GuessClass.DEFAULT,GuessClass.DEFAULT,GuessClass.DEFAULT,GuessClass.DEFAULT,GuessClass.DEFAULT],[GuessClass.DEFAULT,GuessClass.DEFAULT,GuessClass.DEFAULT,GuessClass.DEFAULT,GuessClass.DEFAULT],[GuessClass.DEFAULT,GuessClass.DEFAULT,GuessClass.DEFAULT,GuessClass.DEFAULT,GuessClass.DEFAULT],[GuessClass.DEFAULT,GuessClass.DEFAULT,GuessClass.DEFAULT,GuessClass.DEFAULT,GuessClass.DEFAULT]];
      storage.set(StorageKey.Board, JSON.stringify(board));
      storage.set(StorageKey.ClassBoard, JSON.stringify(classBoard));
      storage.set(StorageKey.RoundIdx, '1');
      storage.set(StorageKey.SequenceIdx, '1');

      createComponent();
      expect(component.board[0]).toEqual(['f','r','a','m','e']);
    });

    it('handles version mismatch by reloading', () => {
      storage.set(StorageKey.Version, 'old-version');
      createComponent();
      // Version gets updated from response
      expect(storage.get(StorageKey.Version)).toBe('0.14.11');
    });

    it('stores next sequence UTC from response', () => {
      createComponent();
      expect(storage.get(StorageKey.NextSequenceUtc)).toBeTruthy();
    });

    it('handles response with no second date', () => {
      const noDateResponse = { ...mockFuncWord, dates: [new Date('2022-03-01')] };
      fixture = TestBed.createComponent(GameComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      const req = httpMock.match(r => r.url.includes('/.netlify/functions/word'));
      req.forEach(r => r.flush(noDateResponse));
      expect(component.currentWord).toBe(btoa('frame'));
    });
  });

  describe('initBandages', () => {
    it('triggers hotfix for sequence 15 when game ended', () => {
      storage.set(StorageKey.GameState, GameState.ENDED);
      storage.set(StorageKey.SequenceIdx, '15');
      createComponent();
      expect(storage.get(StorageKey.Hotfix)).toBe('2022.02.18-0015');
    });

    it('does nothing for other sequences', () => {
      storage.set(StorageKey.GameState, GameState.ENDED);
      storage.set(StorageKey.SequenceIdx, '16');
      createComponent();
      expect(storage.get(StorageKey.Hotfix)).not.toBe('2022.02.18-0015');
    });
  });

  describe('keyEvent', () => {
    it('shows notice when game is ended', () => {
      createComponent();
      storage.set(StorageKey.GameState, GameState.ENDED);
      component.keyEvent(new KeyboardEvent('keyup', { code: 'KeyA', key: 'a' }));
      expect(component.notice.message).toContain('Game Over');
    });

    it('handles backspace', () => {
      createComponent();
      component.play = 'ab';
      component.keyEvent(new KeyboardEvent('keyup', { code: 'Backspace' }));
      expect(component.play).toBe('a');
    });

    it('handles letter keys', () => {
      createComponent();
      storage.set(StorageKey.GameState, GameState.PLAYING);
      component.keyEvent(new KeyboardEvent('keyup', { code: 'KeyA', key: 'a' }));
      expect(component.play).toBe('a');
    });

    it('handles shift+backquote to reinit', () => {
      createComponent();
      const spy = vi.spyOn(component, 'initGame');
      component.keyEvent(new KeyboardEvent('keyup', { code: 'Backquote', shiftKey: true }));
      expect(spy).toHaveBeenCalled();
      flushWordRequests();
    });

    it('handles enter key', () => {
      createComponent();
      component.play = 'frame';
      component.decodedWord = 'frame';
      const spy = vi.spyOn(component, 'submitRound');
      component.keyEvent(new KeyboardEvent('keyup', { code: 'Enter' }));
      expect(spy).toHaveBeenCalled();
    });

    it('ignores non-letter keys', () => {
      createComponent();
      component.keyEvent(new KeyboardEvent('keyup', { code: 'Digit1', key: '1' }));
      expect(component.play).toBe('');
    });
  });

  describe('bufferListener', () => {
    it('enables debug mode on josie', () => {
      createComponent();
      component.buffer = 'josie';
      component.bufferListener('josie');
      expect(component.debugMode).toBe(true);
    });

    it('disables debug mode on evieb', () => {
      createComponent();
      component.debugMode = true;
      component.buffer = 'evieb';
      component.bufferListener('evieb');
      expect(component.debugMode).toBe(false);
    });

    it('trims buffer to 5 chars', () => {
      createComponent();
      component.buffer = 'abcdef';
      const result = component.bufferListener('abcdef');
      expect(result.length).toBeLessThanOrEqual(5);
    });
  });

  describe('emptyBoard', () => {
    it('creates 6x5 board', () => {
      createComponent();
      const board = component.emptyBoard('');
      expect(board.length).toBe(6);
      expect(board[0].length).toBe(5);
    });
  });

  describe('updatePos', () => {
    it('sets currPos and nextPos', () => {
      createComponent();
      component.updatePos('ab', 0);
      expect(component.currPos).toEqual([0, 2]);
      expect(component.nextPos).toEqual([0, 3]);
    });

    it('advances to next row at 5 letters', () => {
      createComponent();
      component.updatePos('frame', 0);
      expect(component.currPos).toEqual([0, 5]);
      expect(component.nextPos).toEqual([1, 0]);
    });
  });

  describe('keyboardClick', () => {
    it('prevents default for keyboard row clicks', () => {
      createComponent();
      const event = {
        target: { classList: { value: 'keyboard__row' } } as any,
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      } as any;
      component.keyboardClick(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('does nothing for non-row clicks', () => {
      createComponent();
      const event = {
        target: { classList: { value: 'keyboard__key' } } as any,
        preventDefault: vi.fn(),
      } as any;
      component.keyboardClick(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });

  describe('refreshLetters', () => {
    it('shows notice when game ended', () => {
      createComponent();
      storage.set(StorageKey.GameState, GameState.ENDED);
      component.refreshLetters('a');
      expect(component.notice.message).toContain('Game Over');
    });

    it('handles ENTER at start with empty board', () => {
      createComponent();
      component.refreshLetters(GuessAction.ENTER);
      // Should return early without submitting
      expect(component.prevRound).toBe(0);
    });

    it('handles ENTER at end of sequence', () => {
      createComponent();
      component.play = 'frame';
      component.decodedWord = 'frame';
      component.board[0] = ['f','r','a','m','e'];
      const spy = vi.spyOn(component, 'submitRound');
      component.refreshLetters('frame' + GuessAction.ENTER);
      expect(spy).toHaveBeenCalled();
    });

    it('handles DEL', () => {
      createComponent();
      component.play = 'ab';
      component.refreshLetters('a' + GuessAction.DEL);
      // Should remove last letter
    });

    it('sets debug mode via josie', () => {
      createComponent();
      component.refreshLetters('josie');
      expect(component.debugMode).toBe(true);
    });

    it('disables debug mode via evieb', () => {
      createComponent();
      component.debugMode = true;
      component.refreshLetters('evieb');
      expect(component.debugMode).toBe(false);
    });

    it('handles ENTER at start with existing board entries', () => {
      createComponent();
      component.board[0] = ['f','r','a','m','e'];
      component.refreshLetters(GuessAction.ENTER + 'frame');
    });
  });

  describe('submitRound', () => {
    it('returns early for short sequence', () => {
      createComponent();
      component.submitRound(0, 'abc');
      expect(component.prevRound).toBe(0);
    });

    it('shows notice for word not in dictionary', () => {
      createComponent();
      component.submitRound(0, 'zzzzz');
      expect(component.notice.message).toContain('not the dictionary');
    });

    it('processes valid guess', fakeAsync(() => {
      createComponent();
      component.decodedWord = 'frame';
      vi.spyOn(wordService, 'inDict').mockReturnValue(true);

      component.submitRound(0, 'retry', false);
      tick(10);

      expect(component.prevRound).toBe(1);
    }));

    it('ends game on correct guess', fakeAsync(() => {
      createComponent();
      component.decodedWord = 'frame';
      vi.spyOn(wordService, 'inDict').mockReturnValue(true);

      component.submitRound(0, 'frame', false);
      tick(100);
      flushWordRequests();

      expect(component.endState).toBe(true);
    }));

    it('ends game on final round failure', fakeAsync(() => {
      createComponent();
      component.decodedWord = 'frame';
      vi.spyOn(wordService, 'inDict').mockReturnValue(true);

      component.submitRound(0, 'retry', true);
      tick(100);
      flushWordRequests();

      expect(component.endState).toBe(true);
    }));
  });

  describe('endGame', () => {
    it('sets ended state and saves share text', () => {
      createComponent();
      component.endGame(true);
      expect(component.endState).toBe(true);
      expect(storage.get(StorageKey.GameState)).toBe(GameState.ENDED);
    });

    it('stores completed sequence UTC for SEQUENCE mode', () => {
      createComponent();
      storage.set(StorageKey.GameMode, GameMode.SEQUENCE);
      component.endGame(true);
      expect(storage.get(StorageKey.CompletedSequenceUtc)).toBeTruthy();
    });

    it('does not store completed sequence UTC for RANDOM mode', () => {
      createComponent();
      storage.set(StorageKey.GameMode, GameMode.RANDOM);
      component.endGame(true);
      expect(storage.get(StorageKey.CompletedSequenceUtc)).toBeNull();
    });
  });

  describe('incrementRound', () => {
    it('increments round', () => {
      createComponent();
      expect(component.incrementRound(0)).toBe(1);
      expect(component.incrementRound(5)).toBe(6);
    });

    it('wraps around at 6', () => {
      createComponent();
      expect(component.incrementRound(6)).toBe(0);
    });
  });

  describe('boardMatrix', () => {
    it('converts class board to emoji matrix', () => {
      createComponent();
      const classBoard: GuessClass[][] = [
        [GuessClass.MATCH, GuessClass.MISMATCH, GuessClass.USED, GuessClass.DEFAULT, GuessClass.DEFAULT],
      ];
      const result = component.boardMatrix(classBoard);
      expect(result[0][0]).toBe('\u{1F7E9}');
      expect(result[0][1]).toBe('\u{1F7E8}');
      expect(result[0][2]).toBe('\u2B1B');
      expect(result[0][3]).toBeUndefined();
    });
  });

  describe('clearRow', () => {
    it('clears specified row', () => {
      createComponent();
      component.board[0] = ['a','b','c','d','e'];
      component.clearRow(0);
      expect(component.board[0]).toEqual(['','','','','']);
      expect(component.play).toBe('');
    });
  });

  describe('saveBoard', () => {
    it('saves board and combined board', () => {
      createComponent();
      component.saveBoard('board', component.board);
      expect(storage.get(StorageKey.Board)).toBeTruthy();
      expect(storage.get(StorageKey.CombinedBoard)).toBeTruthy();
    });

    it('saves class board', () => {
      createComponent();
      component.saveBoard('class', component.classBoard as any);
      expect(storage.get(StorageKey.ClassBoard)).toBeTruthy();
    });
  });

  describe('combinedBoard', () => {
    it('combines board and classBoard', () => {
      createComponent();
      component.board[0] = ['a','b','c','d','e'];
      component.classBoard[0] = [GuessClass.MATCH, GuessClass.MISMATCH, GuessClass.USED, GuessClass.DEFAULT, GuessClass.DEFAULT];
      const combined = component.combinedBoard;
      expect(combined[0][0]).toEqual({ letter: 'a', class: GuessClass.MATCH });
    });
  });

  describe('play getter/setter', () => {
    it('sets and gets play', () => {
      createComponent();
      component.play = 'abc';
      expect(component.play).toBe('abc');
    });

    it('rejects play longer than 5', () => {
      createComponent();
      component.play = 'abcde';
      component.play = 'abcdef';
      expect(component.play).toBe('abcde');
    });
  });

  describe('soln getter/setter', () => {
    it('gets and sets soln', () => {
      createComponent();
      expect(component.soln).toBe(false);
      component.soln = true;
      expect(component.soln).toBe(true);
    });
  });

  describe('toggleNotice / clearNotice', () => {
    it('sets notice', () => {
      createComponent();
      component.toggleNotice('test', 'warn', true, 5000);
      expect(component.notice.message).toBe('test');
      expect(component.notice.type).toBe('warn');
      expect(component.notice.again).toBe(true);
    });

    it('clears notice after timeout', fakeAsync(() => {
      createComponent();
      component.toggleNotice('test', 'warn');
      tick(9000);
      expect(component.notice.message).toBe('');
    }));
  });

  describe('attribution', () => {
    it('shows attribution notice', () => {
      createComponent();
      component.attribution();
      expect(component.notice.message).toContain('Built by');
    });
  });

  describe('recordStats', () => {
    it('writes empty stats to storage', () => {
      createComponent();
      component.recordStats();
      expect(storage.get(StorageKey.Stats)).toBe('{}');
    });
  });

  describe('showStats', () => {
    it('sets game state to paused', () => {
      createComponent();
      component.showStats();
      expect(storage.get(StorageKey.GameState)).toBe(GameState.PAUSED);
    });
  });

  describe('shareText', () => {
    it('generates share text', () => {
      createComponent();
      component.sequenceIdx = 42;
      const text = component.shareText();
      expect(text.text).toContain('KURDLE');
      expect(text.text).toContain('0042');
    });
  });

  describe('canShare', () => {
    it('returns boolean', () => {
      createComponent();
      expect(typeof component.canShare()).toBe('boolean');
    });
  });

  describe('shareGame', () => {
    it('returns early when cannot share', () => {
      createComponent();
      vi.spyOn(component, 'canShare').mockReturnValue(false);
      expect(() => component.shareGame()).not.toThrow();
    });

    it('calls plausible and navigator.share when available', () => {
      createComponent();
      vi.spyOn(component, 'canShare').mockReturnValue(true);
      const plausibleSpy = vi.fn();
      (window as any).plausible = plausibleSpy;

      component.shareGame();

      expect(plausibleSpy).toHaveBeenCalledWith('Share', expect.objectContaining({
        callback: expect.any(Function),
        props: expect.objectContaining({ text: expect.any(Object) }),
      }));
    });

    it('sharePls callback calls navigator.share', async () => {
      createComponent();
      vi.spyOn(component, 'canShare').mockReturnValue(true);
      let capturedCallback: Function;
      (window as any).plausible = (_: string, opts: any) => { capturedCallback = opts.callback; };
      const shareSpy = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'share', { value: shareSpy, configurable: true, writable: true });

      component.shareGame();
      capturedCallback!();
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(shareSpy).toHaveBeenCalled();
    });

    it('sharePls callback handles rejection', async () => {
      createComponent();
      vi.spyOn(component, 'canShare').mockReturnValue(true);
      let capturedCallback: Function;
      (window as any).plausible = (_: string, opts: any) => { capturedCallback = opts.callback; };
      const shareSpy = vi.fn().mockRejectedValue(new Error('cancelled'));
      Object.defineProperty(navigator, 'share', { value: shareSpy, configurable: true, writable: true });
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      component.shareGame();
      capturedCallback!();
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('carryForward', () => {
    it('sets ghost board and toggles class', () => {
      createComponent();
      component.carryForward('a', GuessClass.DEFAULT, [0, 0]);
      expect(component.ghostBoard[0][0]).toBe('a');
      expect(component.classBoard[0][0]).toBe(GuessClass.GHOST);
    });

    it('resets to DEFAULT for ghost class', () => {
      createComponent();
      component.carryForward('a', GuessClass.GHOST, [0, 0]);
      expect(component.classBoard[0][0]).toBe(GuessClass.DEFAULT);
    });

    it('resets to DEFAULT for empty char', () => {
      createComponent();
      component.carryForward('', GuessClass.MATCH, [0, 0]);
      expect(component.classBoard[0][0]).toBe(GuessClass.DEFAULT);
    });
  });

  describe('svgFill', () => {
    it('returns white fill for light theme', () => {
      createComponent();
      storage.set(StorageKey.Theme, 'light');
      expect(component.svgFill).toContain('#ffffff');
    });

    it('returns black fill for dark theme', () => {
      createComponent();
      storage.set(StorageKey.Theme, 'dark');
      expect(component.svgFill).toContain('#000000');
    });
  });

  describe('conclude', () => {
    it('exists as a no-op', () => {
      createComponent();
      expect(() => component.conclude()).not.toThrow();
    });
  });

  describe('constructor query params', () => {
    it('sets debugMode from debug query param', async () => {
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [GameComponent],
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          provideRouter([]),
          { provide: ActivatedRoute, useValue: { queryParams: of({ debug: '' }) } },
        ],
      }).compileComponents();
      httpMock = TestBed.inject(HttpTestingController);

      fixture = TestBed.createComponent(GameComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      const req = httpMock.match(r => r.url.includes('/.netlify/functions/word'));
      req.forEach(r => r.flush(mockFuncWord));

      expect(component.debugMode).toBe(true);
    });

    it('sets rando from rando query param', async () => {
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [GameComponent],
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          provideRouter([]),
          { provide: ActivatedRoute, useValue: { queryParams: of({ rando: '' }) } },
        ],
      }).compileComponents();
      httpMock = TestBed.inject(HttpTestingController);

      fixture = TestBed.createComponent(GameComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      const req = httpMock.match(r => r.url.includes('/.netlify/functions/word'));
      req.forEach(r => r.flush(mockFuncWord));

      expect(component.rando).toBe(true);
    });
  });
});
