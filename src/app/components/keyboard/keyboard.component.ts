import { Component, OnInit, Output, EventEmitter, Input, OnChanges, SimpleChanges } from '@angular/core';
import { AlphaDict, GuessAction, GuessClass } from 'src/app/models/guess';

@Component({
  selector: 'app-keyboard',
  templateUrl: './keyboard.component.html',
  styleUrls: ['./keyboard.component.scss']
})
export class KeyboardComponent implements OnInit, OnChanges {
  @Input() alphabetKey: AlphaDict = {};
  @Input() sequence: string[] = [];
  @Input() heavyBoard: any[] = [];
  @Input() round: number = 0;
  @Output() onClick = new EventEmitter<string>();
  keys: string[][];
  playedAlphabetKey: AlphaDict = {};

  constructor() {
    this.keys = [
      ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
      ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
      [GuessAction.ENTER, 'z', 'x', 'c', 'v', 'b', 'n', 'm', GuessAction.DEL]
    ];
  }

  ngOnInit(): void {
  }

  onLetter(letter: any): void {
    const currentRound = `${this.round}`.slice();
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
      const presentRound = `${this.round}`.slice();
      if (currentRound !== presentRound && letter === GuessAction.ENTER) {
        this.sequence = [];
      }
    }, 500);
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
    changes['heavyBoard'].currentValue.map((boardRow: any, idx: number) => {
      if (((idx == this.round - 2) || (this.round === 1)) && boardRow.some((x: any) => x.class !== 'default')) { //boardRow[4].letter !== '' &&
        boardRow.map((letterObj: any, jdx: number) => {
          if (this.playedAlphabetKey[letterObj.letter]?.class === GuessClass.MATCH) {
            return;
          } else if (letterObj.class === GuessClass.MISMATCH &&
                      this.playedAlphabetKey[letterObj.letter]?.class === GuessClass.USED) {
            this.playedAlphabetKey[letterObj.letter] = {class: letterObj.class, idx: []};
          } else if (letterObj.class === GuessClass.MISMATCH &&
                      this.playedAlphabetKey[letterObj.letter]?.class === GuessClass.MATCH) {
            // TODO: PLEAT (T never turns green @ end of round)
            this.playedAlphabetKey[letterObj.letter] = {class: letterObj.class, idx: []};
          } else {
            this.playedAlphabetKey[letterObj.letter] = {class: letterObj.class, idx: []};
          }
        });
      }

    });
  }

}
