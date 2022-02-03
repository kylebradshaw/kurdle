import { StorageService } from './../../services/storage.service';
import { FuncWord } from './../../services/word.service';
import { Component, OnInit, HostListener } from '@angular/core';
import { WordService } from 'src/app/services/word.service';
import { GuessClass, GuessAction, AlphaDict } from 'src/app/models/guess';
import { ActivatedRoute } from '@angular/router';
import { ThemeService } from '@bcodes/ngx-theme-service';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})
export class GameComponent implements OnInit {
  round: number = 1;
  board: string[][] = [[]];
  classBoard: string[][] = [[]];
  currentWord = "";
  decodedWord = "";
  solved = false;
  alphabetClass: AlphaDict = {};
  debugMode: boolean = false;
  notice: {message: string, type: string} = {message: '', type: ''};
  currentTheme = '';
  private _play: string = '';

  constructor(
    private activatedRoute: ActivatedRoute,
    private wordService: WordService,
    private themeService: ThemeService,
    private storageService: StorageService,
  ) {
    // this.currentWord = btoa('light');
    // this.currentWord = btoa('state'); //
    // this.currentWord = this.wordService.seedWord();
    this.decodedWord = this.wordService.decode(this.currentWord);
    this.activatedRoute.queryParams.subscribe(params => {
      if (params[`debug`] !== undefined) {
        this.debugMode = true;
      }
    });
  }

  ngOnInit(): void {
    this.initTheme();
    this.resetBoard();
    this.play = "";

    this.wordService.seedWordFromFunc('rando').subscribe((response: FuncWord) => {
      this.currentWord = response.word;
    });
  }

  /**
   * Inits theme
   * picks up native theme preference if available on first visit
   * otherwise we set our own
   */
  initTheme(): void  {
    const theme = this.storageService.get('theme');
    if (theme !== null) {
      this.currentTheme = theme;
      this.switchTheme(theme);
    } else {
      if (window.matchMedia('prefers-color-scheme: dark').matches) {
        this.switchTheme('light'); // opposite of current theme
      } else {
        this.switchTheme('dark');// opposite of current theme
      }
    }
  }

  switchTheme(previousTheme: string, flip = false): void {
    let nextTheme = (flip) ? this.intendedTheme(previousTheme) : previousTheme;
    this.themeService.switchTheme(nextTheme);
    this.storageService.set('theme', nextTheme);
    this.currentTheme = nextTheme;
  }

  @HostListener('window:keyup', ['$event'])
  keyEvent($event: KeyboardEvent): void {
    if ($event.code === 'Backspace') {
      // console.log(this.play);
      this.removeLastSequenceLetter(this.play);
      // console.log(this.play, `after removal`);
    } else if ($event.code === 'Enter') {
      this.submitRound(this.round, this.play, this.round === 6);
    } else if ($event.code.startsWith('Key')) {
      this.play +=  $event.key.toLowerCase(); // no numbers, no spaces
      this.refreshLetters(this.play);
    }
  }

  removeLastSequenceLetter(play: string): void {
    // make sure this goes down to keyboard?
    this.play = play.slice(0, -1);
    this.refreshLetters(this.play);
  }

  refreshLetters(sequence: string): void {
    if (sequence.endsWith(GuessAction.ENTER)) {
      return this.submitRound(this.round, this.play, this.round === 6);
    }
    if (sequence.endsWith(GuessAction.DEL)) {
      return this.removeLastSequenceLetter(this.play);
    }
    this.play = sequence;
    this.board[this.round - 1] = this.board[this.round - 1].map((_, idx) => this.play.split('')[idx]);
  }

  submitRound(round: number, sequence: string, final?: boolean): void {
    if (sequence.length !== 5) { return }
    if (this.wordService.inDict(sequence)) {
      const classBoardRow = this.matchedLetters(sequence, this.currentWord);
      this.classBoard[round - 1] = classBoardRow;
      setTimeout(() => {
        if (classBoardRow.every(letter => letter === 'match')) {
          this.toggleNotice('YOU WIN!', 'good');
        } else if (final) {
          this.toggleNotice('YOU LOSE!', 'bad');
        }
      }, 1000);
      this.play = '';
      this.round = this.incrementRound(this.round);
      this.storageService.set('round', `${this.round}`);
      this.populateAlphabetDict([...sequence], classBoardRow);

    } else {
      this.toggleNotice('Invalid word!', 'warn');
    }
  }

  populateAlphabetDict(sequence: string[], classes: string[]): void {
    sequence.forEach((letter, idx) => {
      this.alphabetClass[letter] = classes[idx];
    });
    console.log(this.alphabetClass, `alphabetClass populated.`);
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

  attribution(): void {
    this.toggleNotice(`Built by&nbsp;<a target="_blank" href="https://twitter.com/ky">@ky</a>`, 'default');
  }

  toggleNotice(message: string, type: string): void {
    this.notice = {message, type};
    this.clearNotice();
  }

  clearNotice(timeout = 1500): void {
    setTimeout(() => {
      this.notice = {message: '', type: ''};
    }, timeout);
  }

  get play(): string {
    return this._play;
  }

  set play(sequence: string) {
    if (sequence.length > 5) { return; }
    // if (!sequence.match(/[A-Z]/i) || sequence.length === 1) { return; }
    this._play = sequence;
  }

  resetBoard(): void {
    [...'abcdefghijklmnopqrstuvwxyz'].forEach(letter => {
      this.alphabetClass[letter] = GuessClass.DEFAULT;
    });

    this.board = [
      ['', '', '', '', ''],
      ['', '', '', '', ''],
      ['', '', '', '', ''],
      ['', '', '', '', ''],
      ['', '', '', '', ''],
      ['', '', '', '', '']
    ];
    this.classBoard = [
      [GuessClass.DEFAULT, GuessClass.DEFAULT, GuessClass.DEFAULT, GuessClass.DEFAULT, GuessClass.DEFAULT],
      [GuessClass.DEFAULT, GuessClass.DEFAULT, GuessClass.DEFAULT, GuessClass.DEFAULT, GuessClass.DEFAULT],
      [GuessClass.DEFAULT, GuessClass.DEFAULT, GuessClass.DEFAULT, GuessClass.DEFAULT, GuessClass.DEFAULT],
      [GuessClass.DEFAULT, GuessClass.DEFAULT, GuessClass.DEFAULT, GuessClass.DEFAULT, GuessClass.DEFAULT],
      [GuessClass.DEFAULT, GuessClass.DEFAULT, GuessClass.DEFAULT, GuessClass.DEFAULT, GuessClass.DEFAULT],
      [GuessClass.DEFAULT, GuessClass.DEFAULT, GuessClass.DEFAULT, GuessClass.DEFAULT, GuessClass.DEFAULT]
    ];
    this.round = 1;
  }

  private intendedTheme(currentTheme: string) {
    return (currentTheme === 'light') ? 'dark' : 'light';
  }
}
