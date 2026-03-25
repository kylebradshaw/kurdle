import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Component } from '@angular/core';
import { StorageKey, StorageService } from 'src/app/services/storage.service';
import { GameState, CombinedLetter } from 'src/app/models/game';
import { GuessAction, GuessClass } from 'src/app/models/guess';
import { KeyboardComponent } from './keyboard.component';

@Component({
  standalone: true,
  imports: [KeyboardComponent],
  template: `<app-keyboard
    [alphabetKey]="alphabetKey"
    [sequence]="sequence"
    [heavyBoard]="heavyBoard"
    [prevRound]="prevRound"
    (onClick)="lastEmit = $event"
  />`,
})
class TestHostComponent {
  alphabetKey = {};
  sequence: string[] = [];
  heavyBoard: any[] = [];
  prevRound = 0;
  lastEmit = '';
}

describe('KeyboardComponent', () => {
  let host: TestHostComponent;
  let fixture: ComponentFixture<TestHostComponent>;
  let storage: StorageService;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    storage = TestBed.inject(StorageService);
    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  function getKeyboard(): KeyboardComponent {
    return fixture.debugElement.children[0].componentInstance as KeyboardComponent;
  }

  it('should create', () => {
    expect(getKeyboard()).toBeTruthy();
  });

  it('has 3 rows of keys', () => {
    const kb = getKeyboard();
    expect(kb.keys.length).toBe(3);
    expect(kb.keys[0].length).toBe(10);
    expect(kb.keys[1].length).toBe(9);
    expect(kb.keys[2].length).toBe(9);
  });

  it('exposes guessAction enum', () => {
    const kb = getKeyboard();
    expect(kb.guessAction).toBe(GuessAction);
  });

  describe('onLetter', () => {
    it('emits single letter', () => {
      const kb = getKeyboard();
      kb.onLetter('a');
      expect(host.lastEmit).toBe('a');
    });

    it('accumulates letters up to 5', () => {
      const kb = getKeyboard();
      'hello'.split('').forEach(l => kb.onLetter(l));
      expect(host.lastEmit).toBe('hello');
    });

    it('does not add more than 5 letters', () => {
      const kb = getKeyboard();
      'hello'.split('').forEach(l => kb.onLetter(l));
      kb.onLetter('x');
      expect(host.lastEmit).toBe('hello');
    });

    it('DEL removes last letter', () => {
      const kb = getKeyboard();
      kb.onLetter('a');
      kb.onLetter('b');
      kb.onLetter(GuessAction.DEL);
      expect(host.lastEmit).toBe('a');
    });

    it('DEL on empty sequence does nothing', () => {
      const kb = getKeyboard();
      kb.onLetter(GuessAction.DEL);
      expect(host.lastEmit).toBe('');
    });

    it('ENTER with only 1 letter returns early', () => {
      const kb = getKeyboard();
      kb.onLetter('a');
      host.lastEmit = 'before';
      kb.onLetter(GuessAction.ENTER);
      expect(host.lastEmit).toBe('before');
    });

    it('ENTER with 5 letters emits and pops enter', () => {
      const kb = getKeyboard();
      'hello'.split('').forEach(l => kb.onLetter(l));
      kb.onLetter(GuessAction.ENTER);
      expect(host.lastEmit).toContain(GuessAction.ENTER);
    });

    it('resets sequence after round change', fakeAsync(() => {
      const kb = getKeyboard();
      host.prevRound = 0;
      fixture.detectChanges();

      'hello'.split('').forEach(l => kb.onLetter(l));
      kb.onLetter(GuessAction.ENTER);

      host.prevRound = 1;
      fixture.detectChanges();

      tick(600);
      expect(kb.internalSequence.length).toBe(0);
    }));
  });

  describe('updateKeyboard', () => {
    it('updates playedAlphabetKey from combined board', () => {
      const kb = getKeyboard();
      const board: CombinedLetter[][] = [
        [
          { letter: 'h', class: GuessClass.MATCH },
          { letter: 'e', class: GuessClass.MISMATCH },
          { letter: 'l', class: GuessClass.USED },
          { letter: 'l', class: GuessClass.USED },
          { letter: 'o', class: GuessClass.MATCH },
        ] as any,
      ];
      host.prevRound = 0;
      fixture.detectChanges();
      kb.updateKeyboard(board);

      expect(kb.playedAlphabetKey['h']?.class).toBe(GuessClass.MATCH);
      expect(kb.playedAlphabetKey['e']?.class).toBe(GuessClass.MISMATCH);
    });

    it('does not override MATCH with USED', () => {
      const kb = getKeyboard();
      kb.playedAlphabetKey['h'] = { class: GuessClass.MATCH, idx: [] };

      const board: CombinedLetter[][] = [[
        { letter: 'h', class: GuessClass.USED },
        { letter: 'e', class: GuessClass.DEFAULT },
        { letter: 'l', class: GuessClass.DEFAULT },
        { letter: 'l', class: GuessClass.DEFAULT },
        { letter: 'o', class: GuessClass.DEFAULT },
      ] as any];
      kb.updateKeyboard(board);

      expect(kb.playedAlphabetKey['h']?.class).toBe(GuessClass.MATCH);
    });

    it('does not override MISMATCH with USED', () => {
      const kb = getKeyboard();
      kb.playedAlphabetKey['e'] = { class: GuessClass.MISMATCH, idx: [] };

      const board: CombinedLetter[][] = [[
        { letter: 'e', class: GuessClass.USED },
        { letter: 'x', class: GuessClass.DEFAULT },
        { letter: 'y', class: GuessClass.DEFAULT },
        { letter: 'z', class: GuessClass.DEFAULT },
        { letter: 'w', class: GuessClass.DEFAULT },
      ] as any];
      kb.updateKeyboard(board);

      expect(kb.playedAlphabetKey['e']?.class).toBe(GuessClass.MISMATCH);
    });

    it('upgrades USED to MISMATCH', () => {
      const kb = getKeyboard();
      kb.playedAlphabetKey['e'] = { class: GuessClass.USED, idx: [] };

      const board: CombinedLetter[][] = [[
        { letter: 'e', class: GuessClass.MISMATCH },
        { letter: 'x', class: GuessClass.DEFAULT },
        { letter: 'y', class: GuessClass.DEFAULT },
        { letter: 'z', class: GuessClass.DEFAULT },
        { letter: 'w', class: GuessClass.DEFAULT },
      ] as any];
      kb.updateKeyboard(board);

      expect(kb.playedAlphabetKey['e']?.class).toBe(GuessClass.MISMATCH);
    });

    it('handles MISMATCH overriding MATCH (MATCH takes priority)', () => {
      const kb = getKeyboard();
      kb.playedAlphabetKey['e'] = { class: GuessClass.MATCH, idx: [] };

      const board: CombinedLetter[][] = [[
        { letter: 'e', class: GuessClass.MISMATCH },
        { letter: 'x', class: GuessClass.DEFAULT },
        { letter: 'y', class: GuessClass.DEFAULT },
        { letter: 'z', class: GuessClass.DEFAULT },
        { letter: 'w', class: GuessClass.DEFAULT },
      ] as any];
      kb.updateKeyboard(board);

      expect(kb.playedAlphabetKey['e']?.class).toBe(GuessClass.MATCH);
    });

    it('skips rows that are all default', () => {
      const kb = getKeyboard();
      const board: CombinedLetter[][] = [
        [
          { letter: 'a', class: 'default' },
          { letter: 'b', class: 'default' },
          { letter: 'c', class: 'default' },
          { letter: 'd', class: 'default' },
          { letter: 'e', class: 'default' },
        ] as any,
      ];
      host.prevRound = 0;
      fixture.detectChanges();
      kb.updateKeyboard(board);

      expect(kb.playedAlphabetKey['a']).toBeUndefined();
    });

    it('only processes the correct row based on prevRound', () => {
      // Create a fresh fixture with prevRound=2 set before first detectChanges
      const freshFixture = TestBed.createComponent(TestHostComponent);
      freshFixture.componentInstance.prevRound = 2;
      freshFixture.detectChanges();
      const kb = freshFixture.debugElement.children[0].componentInstance as KeyboardComponent;

      const board: CombinedLetter[][] = [
        [
          { letter: 'a', class: GuessClass.MATCH },
          { letter: 'b', class: GuessClass.MATCH },
          { letter: 'c', class: GuessClass.MATCH },
          { letter: 'd', class: GuessClass.MATCH },
          { letter: 'e', class: GuessClass.MATCH },
        ] as any,
        [
          { letter: 'f', class: GuessClass.MISMATCH },
          { letter: 'g', class: GuessClass.MISMATCH },
          { letter: 'h', class: GuessClass.MISMATCH },
          { letter: 'i', class: GuessClass.MISMATCH },
          { letter: 'j', class: GuessClass.MISMATCH },
        ] as any,
      ];
      kb.updateKeyboard(board);

      expect(kb.playedAlphabetKey['f']?.class).toBe(GuessClass.MISMATCH);
      expect(kb.playedAlphabetKey['a']).toBeUndefined();
    });
  });

  describe('ngOnInit with RESTORED state', () => {
    it('restores keyboard from combinedBoard in storage', () => {
      const board = [[
        { letter: 'h', class: GuessClass.MATCH },
        { letter: 'e', class: GuessClass.MISMATCH },
        { letter: 'l', class: GuessClass.USED },
        { letter: 'l', class: GuessClass.USED },
        { letter: 'o', class: GuessClass.MATCH },
      ]];
      storage.set(StorageKey.GameState, GameState.RESTORED);
      storage.set(StorageKey.CombinedBoard, JSON.stringify(board));

      const freshFixture = TestBed.createComponent(TestHostComponent);
      freshFixture.detectChanges();
      const kb = freshFixture.debugElement.children[0].componentInstance as KeyboardComponent;

      expect(kb.playedAlphabetKey['h']?.class).toBe(GuessClass.MATCH);
    });

    it('does nothing when not RESTORED', () => {
      storage.set(StorageKey.GameState, GameState.PLAYING);

      const freshFixture = TestBed.createComponent(TestHostComponent);
      freshFixture.detectChanges();
      const kb = freshFixture.debugElement.children[0].componentInstance as KeyboardComponent;

      expect(Object.keys(kb.playedAlphabetKey).length).toBe(0);
    });

    it('handles missing combinedBoard gracefully', () => {
      storage.set(StorageKey.GameState, GameState.RESTORED);

      const freshFixture = TestBed.createComponent(TestHostComponent);
      freshFixture.detectChanges();
      const kb = freshFixture.debugElement.children[0].componentInstance as KeyboardComponent;

      expect(Object.keys(kb.playedAlphabetKey).length).toBe(0);
    });

    it('handles combinedBoard that parses to null', () => {
      storage.set(StorageKey.GameState, GameState.RESTORED);
      storage.set(StorageKey.CombinedBoard, 'null');

      const freshFixture = TestBed.createComponent(TestHostComponent);
      freshFixture.detectChanges();
      const kb = freshFixture.debugElement.children[0].componentInstance as KeyboardComponent;

      expect(Object.keys(kb.playedAlphabetKey).length).toBe(0);
    });
  });

  describe('ngOnChanges', () => {
    it('skips first change', () => {
      const kb = getKeyboard();
      const spy = vi.spyOn(kb, 'updateKeyboard');
      kb.ngOnChanges({
        heavyBoard: { firstChange: true, currentValue: [], previousValue: undefined, isFirstChange: () => true },
      });
      expect(spy).not.toHaveBeenCalled();
    });

    it('calls updateKeyboard on subsequent changes', () => {
      const kb = getKeyboard();
      const spy = vi.spyOn(kb, 'updateKeyboard');
      const board = [[{ letter: 'a', class: GuessClass.MATCH }]];
      kb.ngOnChanges({
        heavyBoard: { firstChange: false, currentValue: board, previousValue: [], isFirstChange: () => false },
      });
      expect(spy).toHaveBeenCalledWith(board);
    });

    it('handles missing heavyBoard in changes', () => {
      const kb = getKeyboard();
      const spy = vi.spyOn(kb, 'updateKeyboard');
      kb.ngOnChanges({});
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('template rendering', () => {
    it('renders keyboard buttons', () => {
      const buttons = fixture.nativeElement.querySelectorAll('button');
      expect(buttons.length).toBe(28);
    });

    it('disables ENTER when sequence < 5', () => {
      const buttons = fixture.nativeElement.querySelectorAll('button');
      const enterBtn = Array.from(buttons).find((b: any) => b.textContent.trim() === GuessAction.ENTER) as HTMLButtonElement;
      expect(enterBtn.disabled).toBe(true);
    });

    it('disables DEL when sequence is empty', () => {
      const buttons = fixture.nativeElement.querySelectorAll('button');
      const delBtn = Array.from(buttons).find((b: any) => b.textContent.trim() === GuessAction.DEL) as HTMLButtonElement;
      expect(delBtn.disabled).toBe(true);
    });
  });
});
