import { FuncWord } from 'src/app/services/word.service';
import { Component, OnInit, HostListener } from '@angular/core';
import { WordService } from 'src/app/services/word.service';
import { GameState } from 'src/app/models/game';
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
  prevRound: number = 0;
  board: string[][] = [[]];
  classBoard: GuessClass[][] = [[]];
  currentWord = "";
  decodedWord = "";
  alphabetKey: AlphaDict = {};
  debugMode: boolean = false;
  notice: Notice = {message: '', type: '', again: false};
  currentTheme = '';
  endState = false;
  buffer = '';
  navigator: any;
  rando = false;
  sequenceIdx: number = 0;
  cache: string = '';
  public ngNavigatorShareService: NgNavigatorShareService;
  private _play: string = '';
  private _soln: boolean = false;

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
        this.rando = true;
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
    this.storageService.clear(true);
    const l = window.location;
    if (mode === 'rando' && !l.href.includes('rando')) {
      l.href = l.href.includes(`?`) ? `${l.href}/${l.search}&rando=true` : `${l.href}?rando=true`;
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
    this.prevRound = 0;
    this.play = '';

    if (this.storageService.get('sequenceIdx')) {
      this.sequenceIdx = Number(this.storageService.get('sequenceIdx'));
      this.storageService.set('gameState', GameState.RESTORED);
    } else {
      this.storageService.set('gameState', GameState.INITIALIZED);
    }

    this.wordService.seedWordFromFunc(this.rando, this.sequenceIdx).subscribe((response: FuncWord) => {
      if (this.storageService.get('board') && this.storageService.get('classBoard')) {
        this.loadGameState();
      }
      if (this.storageService.get('cache') !== response.cache) {
        this.storageService.set('cache', response.cache);
        // NEW BUILD, CACHE BUST!
        this.reloadGame();
      }
      if (this.storageService.get('word') !== response.word) {
        this.storageService.set('word', response.word);
      }
      if (this.storageService.get('roundIdx')) {
        this.prevRound = Number(this.storageService.get('roundIdx'));
      }
      if (Number(this.storageService.get('sequenceIdx')) !== response.sequence) {
        this.storageService.set('sequenceIdx', `${response.sequence}`);
      }

      this.currentWord = response.word;
      this.sequenceIdx = response.sequence;
      // this.currentWord = btoa('model');
      // this.currentWord = btoa('pleat');
      // this.currentWord = btoa('tract');
      // this.currentWord = btoa('stair');
      this.decodedWord = this.wordService.decode(this.currentWord);
      this.alphabetKey = this.wordService.getAlphabetKey(this.decodedWord);
    });

    this.board = this.emptyBoard();
    this.classBoard = this.setupClassBoard();
  }

  emptyBoard(): string[][] {
    return [
      ['', '', '', '', ''],
      ['', '', '', '', ''],
      ['', '', '', '', ''],
      ['', '', '', '', ''],
      ['', '', '', '', ''],
      ['', '', '', '', '']
    ];
  }

  setupClassBoard(): GuessClass[][] {
    return [
      [GuessClass.DEFAULT, GuessClass.DEFAULT, GuessClass.DEFAULT, GuessClass.DEFAULT, GuessClass.DEFAULT],
      [GuessClass.DEFAULT, GuessClass.DEFAULT, GuessClass.DEFAULT, GuessClass.DEFAULT, GuessClass.DEFAULT],
      [GuessClass.DEFAULT, GuessClass.DEFAULT, GuessClass.DEFAULT, GuessClass.DEFAULT, GuessClass.DEFAULT],
      [GuessClass.DEFAULT, GuessClass.DEFAULT, GuessClass.DEFAULT, GuessClass.DEFAULT, GuessClass.DEFAULT],
      [GuessClass.DEFAULT, GuessClass.DEFAULT, GuessClass.DEFAULT, GuessClass.DEFAULT, GuessClass.DEFAULT],
      [GuessClass.DEFAULT, GuessClass.DEFAULT, GuessClass.DEFAULT, GuessClass.DEFAULT, GuessClass.DEFAULT]
    ]
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
      this.submitRound(this.prevRound, this.play, this.prevRound === 5);
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
    this.storageService.set('gameState', GameState.PLAYING);
    if(sequence.startsWith(GuessAction.ENTER)) {
      return;
    }
    if (sequence.endsWith(GuessAction.ENTER)) {
      return this.submitRound(this.prevRound, this.play, this.prevRound === 5);
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
    this.board[this.prevRound] = this.board[this.prevRound].map((_, idx) => this.play.split('')[idx]);
    this.saveBoard(this.board, null);
  }

  saveBoard(board: string[][] | null, classBoard: string[][] | null): void {
    if (board) {
      this.storageService.set('board', JSON.stringify(board));
    }
    if (classBoard) {
      this.storageService.set('classBoard', JSON.stringify(classBoard));
    }
  }

  loadGameState(): void {
    this.board = JSON.parse(this.storageService.get('board'));
    this.classBoard = JSON.parse(this.storageService.get('classBoard'));
    this.prevRound = Number(this.storageService.get('prevRound'));
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

  submitRound(prevRound: number, sequence: string, final?: boolean): void {
    if (sequence.length !== 5) { return }
    if (this.wordService.inDict(sequence)) {
      const classBoardRow = this.matchedLetters(sequence, this.decodedWord, this.alphabetKey);
      this.classBoard[prevRound] = classBoardRow;
      this.saveBoard(null, this.classBoard);
      setTimeout(() => {
        if (classBoardRow.every(letter => letter === 'match')) {
          this.toggleNotice('You won!', 'good', true, 36e6);
          this._soln = true;
          this.endGame(true);
        } else if (final) {
          this.toggleNotice(`${this.decodedWord.toUpperCase()}`, 'bad', true, 36e6);
          this.endGame(true);
        }
      }, 0);
      this.play = '';
      this.prevRound = this.incrementRound(this.prevRound);
      this.storageService.set('roundIdx', `${this.prevRound}`);
    } else {
      this.toggleNotice('The word is not the dictionary.', 'warn');
    }
  }

  endGame(ended: boolean): void {
    this.storageService.set('shareText', JSON.stringify(this.shareText()));
    this.storageService.set('gameState', GameState.ENDED);
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

  incrementRound(prevRound: number): number {
    return prevRound < 6 ? prevRound + 1 : 0;
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
    this.storageService.set('gameState', GameState.PAUSED);
  }

  /**
   * Shares game, share board matrix and link
   *
   */
  // TODO: Refactor for testability
  shareText(): any {
    const numerator = (this.soln) ? this.prevRound : `X`;
    return {
      title: ``,
        text: `KURDLE ${("0000" + this.sequenceIdx).slice(-4)} ${numerator}/6\n\n` + this.boardMatrix(this.classBoard).map(r => r.join('')).join('\n'),
    }
  }
  /**
   * Shares game
   */
  shareGame(): void {
    // if (!this.ngNavigatorShareService.canShare()) {
    //   alert(`This service/api is not supported in your Browser`);
    //   return;
    // }
    this.ngNavigatorShareService.share(this.shareText())
      .then(() => { console.log(`Successful share`); })
      .catch((error) => { console.log(error); });
  }

  get svgFill(): string {
    const themeColor = this.storageService.get('theme');
    return (themeColor === 'light') ? "fill: #ffffff;" : "fill: #000000;";
  }

  get soln(): boolean {
    return this._soln;
  }

  set soln(value: boolean) {
    this._soln = value;
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
