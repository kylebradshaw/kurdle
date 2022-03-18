import { Component, OnInit, Output, EventEmitter, Input, OnChanges, SimpleChanges } from '@angular/core';
import { GameState, CombinedLetter } from 'src/app/models/game';
import { AlphaDict, GuessAction, GuessClass } from 'src/app/models/guess';
import { StorageService } from 'src/app/services/storage.service';

@Component({
  selector: 'app-keyboard',
  templateUrl: './keyboard.component.html',
  styleUrls: ['./keyboard.component.scss']
})
export class KeyboardComponent implements OnInit, OnChanges {
  @Input() alphabetKey: AlphaDict = {};
  @Input() sequence: string[] = [];
  @Input() heavyBoard: any[] = [];
  @Input() prevRound: number = 0;
  @Output() onClick = new EventEmitter<string>();
  keys: string[][];
  playedAlphabetKey: AlphaDict = {};
  guessAction = GuessAction;

  constructor(
    private storageService: StorageService,
  ) {
    this.keys = [
      ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
      ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
      [GuessAction.ENTER, 'z', 'x', 'c', 'v', 'b', 'n', 'm', GuessAction.DEL]
    ];
  }

  ngOnInit(): void {
    if (this.storageService.get('gameState') === GameState.RESTORED) {
      const combinedBoard = JSON.parse(this.storageService.get('combinedBoard'));
      if (combinedBoard) {
        this.updateKeyboard(combinedBoard);
      }
    }
  }

  onLetter(letter: any): void {
    const currentRound = `${this.prevRound}`.slice();
    if (letter === GuessAction.DEL) {
      this.sequence.length = (this.sequence.length > 0) ? this.sequence.length - 1 : 0;
    } else if (letter === GuessAction.ENTER && this.sequence.length === 1) {
      return;
    } else if (letter === GuessAction.ENTER || this.sequence.length < 5) {
      this.sequence.push(letter);
    }

    // always emit the event on each letter
    this.onClick.emit(this.sequence.join(''));

    // remove action key after emit
    if (this.sequence[this.sequence.length - 1] === GuessAction.ENTER) {
      this.sequence.pop();
    }
    // reset sequence for next round
    setTimeout(() => {
      const presentRound = `${this.prevRound}`.slice();
      if (currentRound !== presentRound && letter === GuessAction.ENTER) {
        this.sequence = [];
      }
    }, 500);
  }

  // updates playedAlphabetKey
  updateKeyboard(combinedBoard: CombinedLetter[][]): void {
    combinedBoard.map((boardRow: any, idx: number) => {
      if (((idx == this.prevRound - 1) || (this.prevRound === 0)) && boardRow.some((x: any) => x.class !== 'default')) { //boardRow[4].letter !== '' &&
        boardRow.map((letterObj: any, jdx: number) => {
          // if the letter is a match don't override the playedAlphabetKey[letter] OR
          // if the first letter is a match or mismatch, but it's a repeat and the second instance is used, don't override playedAlphabetKey[letter]
          if (this.playedAlphabetKey[letterObj.letter]?.class === GuessClass.MATCH ||
              this.playedAlphabetKey[letterObj.letter]?.class === GuessClass.MISMATCH && letterObj.class === GuessClass.USED) {
            return;
          } else if (letterObj.class === GuessClass.MISMATCH &&
            this.playedAlphabetKey[letterObj.letter]?.class === GuessClass.USED) {
            this.playedAlphabetKey[letterObj.letter] = { class: letterObj.class, idx: [] };
          } else if (letterObj.class === GuessClass.MISMATCH &&
            this.playedAlphabetKey[letterObj.letter]?.class === GuessClass.MATCH) {
            this.playedAlphabetKey[letterObj.letter] = { class: letterObj.class, idx: [] };
          } else {
            this.playedAlphabetKey[letterObj.letter] = { class: letterObj.class, idx: [] };
          }
        });
      }

    });
  }

  /**
   * TODO: OPTIMIZE!! (HEAVY, gets called often)
   * on changes
   * @param changes
   * @returns on changes
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['heavyBoard'].firstChange === true) {
      return;
    }
    this.updateKeyboard(changes['heavyBoard'].currentValue);
  }

}
