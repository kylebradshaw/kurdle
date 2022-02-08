import { FuncWord } from 'src/app/services/word.service';
import { Component, OnInit, HostListener } from '@angular/core';
import { WordService } from 'src/app/services/word.service';
import { GuessClass, GuessAction, AlphaDict } from 'src/app/models/guess';
import { Notice } from 'src/app/models/notice';
import { ActivatedRoute } from '@angular/router';
import { ThemeService } from '@bcodes/ngx-theme-service';
import { StorageService } from 'src/app/services/storage.service';
import { NgNavigatorShareService } from 'ng-navigator-share';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})
export class GameComponent implements OnInit {
  round: number = 1;
  board: string[][] = [[]];
  classBoard: GuessClass[][] = [[]];
  currentWord = "";
  decodedWord = "";
  solved = false;
  alphabetKey: AlphaDict = {};
  debugMode: boolean = false;
  notice: Notice = {message: '', type: '', again: false};
  currentTheme = '';
  endState = false;
  buffer = '';
  navigator: any;
  onSubmit: { reset: boolean } = { reset: false };
  rando = '';
  sequenceIdx: number = 0;
  public ngNavigatorShareService: NgNavigatorShareService;
  private _play: string = '';

  constructor(
    private activatedRoute: ActivatedRoute,
    private wordService: WordService,
    private themeService: ThemeService,
    private storageService: StorageService,
    ngNavigatorShareService: NgNavigatorShareService,
  ) {
    this.activatedRoute.queryParams.subscribe(params => {
      if (params[`debug`] !== undefined) {
        this.debugMode = true;
      }
      if (params[`rando`] !== undefined) {
        this.rando = `rando`;
      }
    });
    this.ngNavigatorShareService = ngNavigatorShareService;
  }

  ngOnInit(): void {
    this.initTheme();
    this.setupGame();
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

  boardMatrix(classBoard: GuessClass[][]): GuessClass[][] {
    return classBoard.map((r: GuessClass[]) => {
      return r.map((c: GuessClass) => {
        if (c === GuessClass.MISMATCH) {
          return '🟨';
        } else if (c === GuessClass.MATCH) {
          return '🟩';
        } else if (c === GuessClass.USED) {
          return '⬛';
        }
        return;
      });
    }) as any;
  }

  /**
   * Reloads game
   * Gross but a mouse click that fires setupGame() has downstream issues ¯\_(ツ)_/¯
   */
  reloadGame(mode?: string): void {
    const l = window.location;
    if (mode === 'rando' && !l.href.includes('rando')) {
      l.href = l.href.includes(`?`) ? `${l.href}/${l.search}&rando` : `${l.href}?rando`;
    } else {
      location.reload();
    }
  }

  /**
   * Sets Up Game / Resets
   * only works properly when toggled from desktop (shift + ~), not mouse click ¯\_(ツ)_/¯
   */
  setupGame(): void {
    this.endState = false;
    this.round = 1;
    this.play = '';

    this.wordService.seedWordFromFunc(this.rando).subscribe((response: FuncWord) => {
      this.currentWord = response.word;
      this.sequenceIdx = response.sequence;
      // this.currentWord = btoa('model');
      // this.currentWord = btoa('pleat');
      // this.currentWord = btoa('tract');
      // this.currentWord = btoa('stair');
      this.decodedWord = this.wordService.decode(this.currentWord);
      this.alphabetKey = this.wordService.getAlphabetKey(this.decodedWord);
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
  }

  switchTheme(previousTheme: string, flip = false): void {
    let nextTheme = (flip) ? this.intendedTheme(previousTheme) : previousTheme;
    this.themeService.switchTheme(nextTheme);
    this.storageService.set('theme', nextTheme);
    this.currentTheme = nextTheme;
  }

  @HostListener('window:keyup', ['$event'])
  keyEvent($event: KeyboardEvent): void {
    if ($event.code === 'Backquote' && $event.shiftKey === true) {
      this.setupGame();
    } else if ($event.code === 'Backspace') {
      this.removeLastSequenceLetter(this.play);
    } else if ($event.code === 'Enter') {
      this.submitRound(this.round, this.play, this.round === 6);
    } else if ($event.code.startsWith('Key')) {
      this.buffer += $event.key.toLowerCase();
      this.play +=  $event.key.toLowerCase(); // no numbers, no spaces
      this.refreshLetters(this.play);
    }
    this.buffer = this.bufferListener(this.buffer);
  }

  bufferListener(buffer: string): string {
    if (buffer === 'josie') {
      this.debugMode = true;
    } else if (buffer === 'evieb') {
      this.debugMode = false;
    }
    return this.buffer.slice(-5);
  }

  removeLastSequenceLetter(play: string): void {
    this.play = play.slice(0, -1);
    this.refreshLetters(this.play);
  }

  refreshLetters(sequence: string): void {
    if(sequence.startsWith(GuessAction.ENTER)) {
      return;
    }
    if (sequence.endsWith(GuessAction.ENTER)) {
      return this.submitRound(this.round, this.play, this.round === 6);
    }
    if (sequence.endsWith(GuessAction.DEL)) {
      return this.removeLastSequenceLetter(this.play);
    }
    if (sequence === 'josie') {
      this.debugMode = true;
    }
    if (sequence === 'evieb') {
      this.debugMode = false;
    }
    this.play = sequence;
    this.board[this.round - 1] = this.board[this.round - 1].map((_, idx) => this.play.split('')[idx]);
  }

  get combinedBoard(): any {
    return this.board.map((r, i) => {
      return this.classBoard[i].map((c, j) => {
        return {
          letter: r[j],
          class: c
        };
      });
    });
  }

  submitRound(round: number, sequence: string, final?: boolean): void {
    if (sequence.length !== 5) { return }
    if (this.wordService.inDict(sequence)) {
      const classBoardRow = this.matchedLetters(sequence, this.decodedWord, this.alphabetKey);
      this.classBoard[round - 1] = classBoardRow;
      setTimeout(() => {
        if (classBoardRow.every(letter => letter === 'match')) {
          this.toggleNotice('You won!', 'good', true, 36e6);
          this.endState = true;
        } else if (final) {
          this.toggleNotice(`${this.decodedWord.toUpperCase()} was the answer.`, 'bad', true, 36e6);
          this.endState = true;
        }
        if (this.endState) {
          console.log(this.boardMatrix(this.classBoard));
          this.onSubmit = { reset: true };
          // this.recordStats()
          // this.showStats();
        }
      }, 1000);
      this.play = '';
      this.round = this.incrementRound(this.round);
      this.storageService.set('round', `${this.round}`);
    } else {
      this.toggleNotice('The word is not the dictionary. Try again.', 'warn');
    }
  }

  /**
   * Matched letters
   * @param sequence
   * @param solutionWord
   * @returns an array of GuessClass for each letter in sequence based on solution
   */
  matchedLetters(sequence: string, decodedWord: string, alphabetKey: AlphaDict): GuessClass[] {
    let guessClass = [] as GuessClass[];
    const repeatedSequence = this.wordService.repeatedCharacters(sequence);
    const repeatedDecoded = this.wordService.repeatedCharacters(decodedWord);

    return [...sequence].map((letter, i) => {
      // letter in sequence at proper solution[idx]
      if (alphabetKey[letter] && alphabetKey[letter].idx.includes(i)) {
        return GuessClass.MATCH;
      } else if (alphabetKey[letter].idx.length === 0) {
        return GuessClass.USED;
      } else { // misfires can happen here
        // if the letter is in the repeatedSequence array and it makes it this far and it's
        // _NOT_ in the _LAST_ found index of the solution (still more to match against), set it as used_ NOT MISMATCH
        if (repeatedSequence.includes(letter) && sequence.lastIndexOf(letter) !== i) {
          return GuessClass.USED;
        } else {
          return GuessClass.MISMATCH;
        }
      }
    });
  }

  incrementRound(round: number): number {
    return round < 6 ? round + 1 : 1;
  }

  attribution(): void {
    this.toggleNotice(`Built by&nbsp;<a target="_blank" href="https://twitter.com/ky">@ky</a>`, 'default');
  }

  toggleNotice(message: string, type: string, again = false, timeOut = 8000): void {
    this.notice = {message, type, again};
    this.clearNotice(timeOut);
  }

  clearNotice(timeout = 1500): void {
    setTimeout(() => {
      this.notice = {message: '', type: '', again: false};
    }, timeout);
  }

  recordStats(): void {
    // this.storageService.set('stats', JSON.stringify(this.stats));
  }

  showStats(): void {
    // this.stats = this.storageService.get('stats');
  }

  /**
   * Shares game, share board matrix and link
   */
  shareGame(): void {
    // if (!this.ngNavigatorShareService.canShare()) {
    //   alert(`This service/api is not supported in your Browser`);
    //   return;
    // }
    this.ngNavigatorShareService.share({
      title: ``,
      text: `KURDLE ${("0000" + this.sequenceIdx).slice(-4)} ${this.round - 1}/6\n\n` + this.boardMatrix(this.classBoard).map(r => r.join('')).join('\n'),
    })
    .then(() => { console.log(`Successful share`); })
    .catch((error) => { console.log(error); });
  }

  get svgFill(): string {
    const themeColor = this.storageService.get('theme');
    return (themeColor === 'light') ? "fill: #ffffff;" : "fill: #000000;";
  }

  get play(): string {
    return this._play;
  }

  set play(sequence: string) {
    if (sequence.length > 5) { return; }
    this._play = sequence;
  }

  private intendedTheme(currentTheme: string) {
    return (currentTheme === 'light') ? 'dark' : 'light';
  }
}
