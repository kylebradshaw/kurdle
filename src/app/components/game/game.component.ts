import { Meta } from '@angular/platform-browser';
import { FuncWord } from 'src/app/services/word.service';
import { Component, OnInit, HostListener } from '@angular/core';
import { WordService } from 'src/app/services/word.service';
import { GamePosition, GameState } from 'src/app/models/game';
import { GuessClass, GuessAction, AlphaDict, Letter } from 'src/app/models/guess';
import { Notice } from 'src/app/models/notice';
import { ActivatedRoute } from '@angular/router';
import { ThemeService } from '@bcodes/ngx-theme-service';
import { StorageService } from 'src/app/services/storage.service';
import { NgNavigatorShareService } from 'ng-navigator-share';
import { StatsService } from 'src/app/services/stats.service';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})
export class GameComponent implements OnInit {
  prevRound: number = 0;
  board: string[][] = [[]];
  classBoard: GuessClass[][] = [[]];
  ghostBoard: string[][] = [[]];
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
  currPos: number[] = [0, 0];
  nextPos: number[] = [0, 0];
  indexCode: string = '';
  public ngNavigatorShareService: NgNavigatorShareService;
  private _play: string = '';
  private _soln: boolean = false;

  constructor(
    private activatedRoute: ActivatedRoute,
    private wordService: WordService,
    private themeService: ThemeService,
    private storageService: StorageService,
    private meta: Meta,
    ngNavigatorShareService: NgNavigatorShareService,
    private statsService: StatsService
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
    this.meta.addTag(
      { name: 'theme-color', content: '#ffffff' }
    );
  }

  ngOnInit(): void {
    this.initTheme();
    this.setupGame();
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
      this.play += $event.key.toLowerCase(); // no numbers, no spaces
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
  reloadGame(mode: boolean): void {
    this.storageService.clear(true);
    const l = window.location;
    if (mode && !l.href.includes('rando')) {
      l.href = l.href.includes(`?`) ? `${l.href}/${l.search}&rando=true` : `${l.href}?rando=true`;
    } else {
      window.location.href = window.origin;
    }
    this.updatePos();
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
        this.reloadGame(false);
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
      // this.currentWord = btoa('gonad');
      // this.currentWord = btoa('rebut');
      // this.currentWord = btoa('mammy');
      // this.currentWord = btoa('pleat');
      // this.currentWord = btoa('blurt'); // 'bully'
      // this.currentWord = btoa('trend'); // 'terse'
      this.currentWord = btoa('swift'); // 'stiff'
      this.decodedWord = this.wordService.decode(this.currentWord);
      this.alphabetKey = this.wordService.getAlphabetKey(this.decodedWord);
      if (this.rando) {
        this.indexCode = this.wordService.numberToLetters(response.sequence);
      }
    });

    this.board = this.emptyBoard('');
    this.classBoard = this.emptyBoard(GuessClass.DEFAULT);
    this.ghostBoard = this.emptyBoard('');
  }

  emptyBoard(fill: string | GuessClass): any[][] {
    return [
      [fill, fill, fill, fill, fill],
      [fill, fill, fill, fill, fill],
      [fill, fill, fill, fill, fill],
      [fill, fill, fill, fill, fill],
      [fill, fill, fill, fill, fill],
      [fill, fill, fill, fill, fill]
    ];
  }

  switchTheme(previousTheme: string, flip = false): void {
    let nextTheme = (flip) ? this.intendedTheme(previousTheme) : previousTheme;
    this.themeService.switchTheme(nextTheme);
    this.meta.updateTag({ content: (nextTheme === 'light') ? '#ffffff' : '#0a0a0a' }, 'name=theme-color');
    this.storageService.set('theme', nextTheme);
    this.currentTheme = nextTheme;
  }

  removeLastSequenceLetter(play: string): void {
    this.play = play.slice(0, -1);
    this.refreshLetters(this.play);
  }

  updatePos(play = this.play, prevRound = this.prevRound) {
    this.currPos = [prevRound, play.length || 0];
    if (this.currPos[1] < 5) {
      this.nextPos = [prevRound, play.length + 1];
    }
    if (this.currPos[1] === 5) {
      this.nextPos = [prevRound + 1, 0];
    }
  }

  keyboardClick($event: MouseEvent): void {
    const element = $event.target as HTMLElement;
    if (element && element.classList.value.includes('keyboard__row')) {
      $event.preventDefault();
      $event.stopPropagation;
    }
  }
  refreshLetters(sequence: string): void {
    this.storageService.set('gameState', GameState.PLAYING);
    // leading GuessAction.ENTER, submit if populated but round hasn't ended
    if (sequence.startsWith(GuessAction.ENTER) && //check if the row is filled
      this.board[this.prevRound].every(letter => !letter) ) {
      return;
    } else if (sequence.startsWith(GuessAction.ENTER)) {
      this._play = this.board[this.prevRound].map(letter => letter).join('');
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
    this.updatePos();
    this.board[this.prevRound] = this.board[this.prevRound].map((_, idx) => {
      if (idx < this.play.length) {
        this.classBoard[this.prevRound][idx] = GuessClass.DEFAULT;
      }
      return this._play.split('')[idx];
      // skip over ghosting approach, but was not intuitive
      // const playArr = this.play.split('');
      // if (!!letter && !this.play.split('')[idx]) {
      //   return letter;
      // } else {
      //   this.classBoard[this.prevRound][idx] = GuessClass.DEFAULT;
      //   return this.play.split('')[idx];
      // }
    });
    this.saveBoard('board', this.board);
  }

  saveBoard(type: string = 'board', targetBoard: string[][]): void {
    if (type === 'board') {
      this.storageService.set('board', JSON.stringify(targetBoard));
      this.storageService.set('combinedBoard', JSON.stringify(this.combinedBoard));
    } else if (type === 'class') {
      this.storageService.set('classBoard', JSON.stringify(targetBoard));
    }
  }

  loadGameState(): void {
    this.board = JSON.parse(this.storageService.get('board'));
    this.classBoard = JSON.parse(this.storageService.get('classBoard'));
    this.prevRound = Number(this.storageService.get('prevRound'));
    this.updatePos();
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
      this.saveBoard('class', this.classBoard);
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
      this.updatePos();
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
    const repeatedSequence = this.wordService.repeatedCharacters(sequence);
    const repeatedDecoded = this.wordService.repeatedCharacters(decodedWord);

    return [...sequence].map((letter, i) => {
      const soln = decodedWord;
      // letter in sequence at proper solution[idx]
      if (alphabetKey[letter] && alphabetKey[letter].idx.includes(i)) {
        return GuessClass.MATCH;
      } else if (alphabetKey[letter].idx.length === 0) {
        return GuessClass.USED;
      } else { // misfires can happen here
        // if the letter is in the repeatedSequence array and it makes it this far and it's
        // NOT in the LAST found index of the solution (still more to match against), set it as used NOT MISMATCH
        // OR
        // if the guess has a repeated letter, but the solution does NOT have a repeated letter, set it as used NOT MISMATCH
        if (repeatedSequence.includes(letter) && sequence.lastIndexOf(letter) !== i) {
          return GuessClass.USED;
        } else {
          // if the repeated letter in the guess is the _last_ opportunity to match a the letter in the solution, set mismatch
          // scenario: repeat has already matched, but it is in the last index
          if (repeatedSequence.includes(letter) && sequence.lastIndexOf(letter) === i) {
            if (soln.indexOf(letter) !== i) {
              return GuessClass.MISMATCH;
            } else {
              return GuessClass.USED;
            }
          }
          // if there is a repeated letter in the guess but there is not repeated letter in the solution
           else if (repeatedSequence.includes(letter) && !repeatedDecoded.includes(letter)) {
            return GuessClass.USED;
          } else {
            return GuessClass.MISMATCH;
          }
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

  /**
   * if a MATCH is applied to the board, apply that letter + index to the current round
   */
  carryForward(char: string, letterClass: GuessClass, pos: GamePosition): void {
    this.ghostBoard[this.prevRound][pos[1]] = char;
    if (letterClass === GuessClass.GHOST || char === '') {
      this.classBoard[this.prevRound][pos[1]] = GuessClass.DEFAULT; //letterClass;
    } else {
      this.classBoard[this.prevRound][pos[1]] = GuessClass.GHOST; //letterClass;
    }

  }

  /**
   * Generates final GameStats record and consolidates with existing stats
   * sets GameState
   * sets user expectation
   */
  conclude(): void {
  };

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
