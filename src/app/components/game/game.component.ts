import { Component, OnInit, HostListener } from '@angular/core';
import { WordService } from 'src/app/services/word.service';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})
export class GameComponent implements OnInit {
  round: number = 1;
  board: string[][] = [
    ['', '', '', '', ''],
    ['', '', '', '', ''],
    ['', '', '', '', ''],
    ['', '', '', '', ''],
    ['', '', '', '', ''],
    ['', '', '', '', '']
  ];
  classBoard: string[][] = [
    ['default', 'default', 'default', 'default', 'default'],
    ['default', 'default', 'default', 'default', 'default'],
    ['default', 'default', 'default', 'default', 'default'],
    ['default', 'default', 'default', 'default', 'default'],
    ['default', 'default', 'default', 'default', 'default'],
    ['default', 'default', 'default', 'default', 'default']
  ];
  currentWord = "";
  decodedWord = "";
  solved = false;
  private _play: string = '';

  constructor(
    private wordService: WordService
  ) {
    // this.currentWord = btoa('light');
    // this.currentWord = btoa('state'); //
    this.currentWord = this.wordService.seedWord();
    this.decodedWord = this.wordService.decode(this.currentWord);
  }

  ngOnInit(): void {
    this.play = ""
  }

  @HostListener('window:keyup', ['$event'])
  keyEvent($event: KeyboardEvent): void {
    // console.log($event.key, 'event key', $event);
    if ($event.code === 'Backspace') {
      // console.log(this.play);
      this.removeLastSequenceLetter(this.play);
      // console.log(this.play, `after removal`);
    } else if ($event.code === 'Enter') {
      this.submitRound(this.round, this.play, this.round === 6);
    } else {
      this.play += $event.key && $event.key.match(/[A-Z]/i) && $event.key.toLowerCase() || ''; // no numbers, no spaces
      this.refreshLetters(this.play);
    }
  }

  removeLastSequenceLetter(play: string): void {
    // make sure this goes down to keyboard?
    this.play = play.slice(0, -1);
    this.refreshLetters(this.play);
  }

  refreshLetters(sequence: string): void {
    this.play = sequence;
    this.board[this.round - 1] = this.board[this.round - 1].map((_, idx) => this.play.split('')[idx]);
    // console.log(sequence, `the most recent click`, this.board[0]);
    // check endswith return, then move to next row, increment round, lock in sequence for row index

  }

  submitRound(round: number, sequence: string, final?: boolean): void {
    if (sequence.length !== 5) { return }
    if (this.wordService.inDict(sequence)) {
      // window.alert('Valid word!');
      const classBoardRow = this.matchedLetters(sequence, this.currentWord);
      this.classBoard[round - 1] = classBoardRow;
      setTimeout(() => {
        if (classBoardRow.every(letter => letter === 'match')) {
          window.alert('YOU WIN!');
        } else if (this.round === 7) {
          window.alert('YOU LOSE!');
        }
      }, 1000);
      this.play = '';
      this.round = this.incrementRound(this.round);
    }
  }

  matchedLetters(sequence: string, solutionWord: string) {
    console.log(sequence, this.wordService.decode(solutionWord), `guess+solution`);
    const solution = this.wordService.decode(solutionWord);
    let duplicateIndicies: number[] = [];
    // find matched characters
    let validChars = [...sequence].map((letter, idx) => {
      const duplicateIdx = this.wordService.getIndices(solution, letter);
      if (duplicateIdx.length > 1) {
        duplicateIndicies = duplicateIdx;
      }
      const guessArr = solution.indexOf(letter); // can't handle more than one instances of a letter in a word. ex: 'state'
      return guessArr;
    });

    const lettersMatchArr = this.wordService.lettersMatch();

    // find matched indexes.
    // solution: [0, 1, 2, 3, 4]
    // mismatch: [-1, -1, -1, -1, -1]
    // match(es): [0, -1, 2, -1, -1]
    return validChars.map((idxMatch, slot) => {
      if (idxMatch === -1) { return 'used'; }
      else if (idxMatch === slot || duplicateIndicies.includes(slot)) { return 'match';} // 🤮
      else { return 'mismatch'; } //(idxMatch !== slot)
    });
  }

  incrementRound(round: number): number {
    return round < 6 ? round + 1 : 1;
  }

  get play(): string {
    return this._play;
  }

  set play(sequence: string) {
    if (sequence.length > 5) { return; }
    // if (!sequence.match(/[A-Z]/i) || sequence.length === 1) { return; }
    this._play = sequence;
  }
}
