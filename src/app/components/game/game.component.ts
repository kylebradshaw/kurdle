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
  currentWord = "";
  decodedWord = "";
  private _play: string = '';

  constructor(
    private wordService: WordService
  ) {
    this.currentWord = this.wordService.seedWord();
    this.decodedWord = this.wordService.decode(this.currentWord);
  }

  ngOnInit(): void {
    this.play = ""
  }

  @HostListener('window:keyup', ['$event'])
  keyEvent($event: KeyboardEvent): void {
    console.log($event.key, 'event key', $event);
    if ($event.code === 'Backspace') {
      console.log(this.play);
      this.removeLastSequenceLetter(this.play);
      console.log(this.play, `after removal`);
    } else if ($event.code === 'Enter') {
      this.submitRound(this.round, this.play, this.round === 6);
    } else {
      this.play += $event.key && $event.key.toLowerCase() || '';
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
    this.play = '';
    this.round = this.round + 1;
  }

  get play(): string {
    return this._play;
  }

  set play(sequence: string) {
    if (sequence.length > 5) { return }
    this._play = sequence;
  }
}
