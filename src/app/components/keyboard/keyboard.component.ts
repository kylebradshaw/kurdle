import { Component, OnInit, OnChanges, SimpleChanges, input, output, inject } from '@angular/core';
import { GameState, CombinedLetter } from 'src/app/models/game';
import { AlphaDict, GuessAction, GuessClass } from 'src/app/models/guess';
import { StorageService } from 'src/app/services/storage.service';

@Component({
  standalone: true,
  selector: 'app-keyboard',
  templateUrl: './keyboard.component.html',
  styleUrls: ['./keyboard.component.scss']
})
export class KeyboardComponent implements OnInit, OnChanges {
  readonly alphabetKey = input<AlphaDict>({});
  readonly sequence = input<string[]>([]);
  readonly heavyBoard = input<any[]>([]);
  readonly prevRound = input<number>(0);
  readonly onClick = output<string>();

  private readonly storageService = inject(StorageService);

  keys: string[][];
  playedAlphabetKey: AlphaDict = {};
  guessAction = GuessAction;
  internalSequence: string[] = [];

  constructor() {
    this.keys = [
      ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
      ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
      [GuessAction.ENTER, 'z', 'x', 'c', 'v', 'b', 'n', 'm', GuessAction.DEL]
    ];
  }

  ngOnInit(): void {
    this.internalSequence = [...this.sequence()];
    if (this.storageService.get('gameState') === GameState.RESTORED) {
      const raw = this.storageService.get('combinedBoard');
      if (raw) {
        const combinedBoard = JSON.parse(raw);
        if (combinedBoard) {
          this.updateKeyboard(combinedBoard);
        }
      }
    }
  }

  onLetter(letter: any): void {
    const currentRound = `${this.prevRound()}`.slice();
    if (letter === GuessAction.DEL) {
      this.internalSequence.length = (this.internalSequence.length > 0) ? this.internalSequence.length - 1 : 0;
    } else if (letter === GuessAction.ENTER && this.internalSequence.length === 1) {
      return;
    } else if (letter === GuessAction.ENTER || this.internalSequence.length < 5) {
      this.internalSequence.push(letter);
    }

    this.onClick.emit(this.internalSequence.join(''));

    if (this.internalSequence[this.internalSequence.length - 1] === GuessAction.ENTER) {
      this.internalSequence.pop();
    }
    setTimeout(() => {
      const presentRound = `${this.prevRound()}`.slice();
      if (currentRound !== presentRound && letter === GuessAction.ENTER) {
        this.internalSequence = [];
      }
    }, 500);
  }

  updateKeyboard(combinedBoard: CombinedLetter[][]): void {
    combinedBoard.map((boardRow: any, idx: number) => {
      if (((idx == this.prevRound() - 1) || (this.prevRound() === 0)) && boardRow.some((x: any) => x.class !== 'default')) {
        boardRow.map((letterObj: any, jdx: number) => {
          if (this.playedAlphabetKey[letterObj.letter]?.class === GuessClass.MATCH ||
              this.playedAlphabetKey[letterObj.letter]?.class === GuessClass.MISMATCH && letterObj.class === GuessClass.USED) {
            return;
          } else if (letterObj.class === GuessClass.MISMATCH &&
            this.playedAlphabetKey[letterObj.letter]?.class === GuessClass.USED) {
            this.playedAlphabetKey[letterObj.letter] = { class: letterObj.class, idx: [] };
          /* v8 ignore start -- dead code: MATCH is already caught by the first condition */
          } else if (letterObj.class === GuessClass.MISMATCH &&
            this.playedAlphabetKey[letterObj.letter]?.class === GuessClass.MATCH) {
            this.playedAlphabetKey[letterObj.letter] = { class: letterObj.class, idx: [] };
          /* v8 ignore stop */
          } else {
            this.playedAlphabetKey[letterObj.letter] = { class: letterObj.class, idx: [] };
          }
        });
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['heavyBoard']?.firstChange === true) {
      return;
    }
    if (changes['heavyBoard']) {
      this.updateKeyboard(changes['heavyBoard'].currentValue);
    }
  }
}
