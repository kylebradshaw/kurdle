import { Meta } from '@angular/platform-browser';
import { FuncWord } from 'src/app/services/word.service';
import { Component, OnInit, HostListener } from '@angular/core';
import { WordService } from 'src/app/services/word.service';
import { GamePosition, GameState } from 'src/app/models/game';
import { GuessClass, GuessAction, AlphaDict, Letter } from 'src/app/models/guess';
import { Notice } from 'src/app/models/notice';
import { ActivatedRoute } from '@angular/router';
import { ThemeService } from '@bcodes/ngx-theme-service';
import { StorageKey, StorageService } from 'src/app/services/storage.service';
import { NgNavigatorShareService } from 'ng-navigator-share';
import { StatsService } from 'src/app/services/stats.service';
import { GameMode } from 'src/app/models/game';
import { GameService } from 'src/app/services/game.service';
declare var window: any;

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
  notice: Notice = { message: '', type: '', again: false };
  currentTheme = '';
  endState = false;
  buffer = '';
  navigator: any;
  rando = false;
  sequenceIdx: number = 0;
  currPos: number[] = [0, 0];
  nextPos: number[] = [0, 0];
  indexCode: string = '';
  nextSequenceUtc: any;
  randomPlay: GameMode = GameMode.RANDOM;
  sequencePlay: GameMode = GameMode.SEQUENCE;
  private _play: string = '';
  private _soln: boolean = false;

  constructor(
    private activatedRoute: ActivatedRoute,
    private wordService: WordService,
    private themeService: ThemeService,
    private storageService: StorageService,
    private meta: Meta,
    private statsService: StatsService,
    public ngNavigatorShareService: NgNavigatorShareService,
    public gameService: GameService,
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
    this.initBandages();
    this.initGame();
  }

  @HostListener('window:keyup', ['$event'])
  keyEvent($event: KeyboardEvent): void {
    if (this.storageService.get('gameState') === GameState.ENDED) {
      this.toggleNotice('Game Over. Wait or try Random Play.', 'warn');
      return;
    }
    if ($event.code === 'Backquote' && $event.shiftKey === true) {
      this.initGame();
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
   * Sets Up Game / Resets
   * only works properly when toggled from desktop (shift + ~), not mouse click ¯\_(ツ)_/¯
   */
  initGame(): void {
    this.endState = false;
    this.prevRound = 0;
    this.play = '';

    this.gameService.directUserFlow();

    if (this.storageService.get('sequenceIdx')) {
      this.sequenceIdx = Number(this.storageService.get('sequenceIdx'));
      this.storageService.set(StorageKey.GameState, GameState.RESTORED);
    } else {
      this.storageService.set(StorageKey.GameState, GameState.INITIALIZED);
      this.storageService.remove('completedSequenceUtc');
      this.storageService.remove('completedUtc');
    }

    this.wordService.seedWordFromFunc(this.rando, this.sequenceIdx).subscribe((response: FuncWord) => {
      const board = this.storageService.get('board');
      const classBoard = this.storageService.get('classBoard');
      const word = this.storageService.get('word');
      const roundIdx = this.storageService.get('roundIdx');
      const sequenceIdx = Number(this.storageService.get('sequenceIdx'));
      let version = this.storageService.get('version');

      if (board && classBoard) {
        this.loadGameState();
      }
      if (word !== response.word) {
        this.storageService.set(StorageKey.Word, response.word);
      }
      if (roundIdx) {
        this.prevRound = Number(this.storageService.get('roundIdx'));
      }
      if (version === undefined || version === null) {
        this.storageService.set(StorageKey.Version, response.version);
        version = this.storageService.get('version');
      }
      if (version !== response.version) {
        this.storageService.set(StorageKey.Version, response.version);
        // realizing I do a hard refresh and dump them into SEQUENCE here.
        // could use a scalpel
        this.gameService.reloadGame(this.sequencePlay);
      }
      if (sequenceIdx !== response.sequence) {
        this.storageService.set(StorageKey.SequenceIdx, `${response.sequence}`);
      }
      if (response.dates[1] !== undefined) {
        this.nextSequenceUtc = response.dates[1] as Date;
        this.storageService.set(StorageKey.NextSequenceUtc, `${this.nextSequenceUtc}`);
      }
      this.currentWord = response.word;
      this.sequenceIdx = response.sequence;
      // this.currentWord = btoa('gonad');
      // this.currentWord = btoa('rebut'); // 'retry'
      // this.currentWord = btoa('mammy'); // 'mommy'
      // this.currentWord = btoa('pleat'); // 'plate
      // this.currentWord = btoa('blurt'); // 'bully'
      // this.currentWord = btoa('trend'); // 'terse'
      // this.currentWord = btoa('swift'); // 'stiff'
      // this.currentWord = btoa('stiff'); // 'swift'
      // this.currentWord = btoa('prize'); // 'piece'
      // this.currentWord = btoa('bowel'); // 'evoke'
      // this.currentWord = btoa('talon'); // 'tally'
      // this.currentWord = btoa('azure'); // 'apart'
      this.decodedWord = this.wordService.decode(this.currentWord);
      this.alphabetKey = this.wordService.getAlphabetKey(this.decodedWord);
      // this.indexCode = this.wordService.numberToLetters(response.sequence);
      this.indexCode = `${response.sequence}`;
    });

    this.board = this.emptyBoard('');
    this.classBoard = this.emptyBoard(GuessClass.DEFAULT);
    this.ghostBoard = this.emptyBoard('');
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
    if (this.storageService.get('gameState') === GameState.ENDED) {
      this.toggleNotice('Game Over. Wait or try Random Play.', 'warn');
      return;
    } else {
      this.storageService.set(StorageKey.GameState, GameState.PLAYING);
    }
    // leading GuessAction.ENTER, submit if populated but round hasn't ended
    if (sequence.startsWith(GuessAction.ENTER) && //check if the row is filled
      this.board[this.prevRound].every(letter => !letter)) {
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

  clearRow(rIdx: number): void {
    this.board[rIdx] = ['', '', '', '', ''];
    this.classBoard[rIdx] = [GuessClass.DEFAULT, GuessClass.DEFAULT, GuessClass.DEFAULT, GuessClass.DEFAULT, GuessClass.DEFAULT];
    this.saveBoard('board', this.board);
    this.saveBoard('classBoard', this.classBoard);
    this.play = '';
    this.updatePos();
  }

  saveBoard(type: string = 'board', targetBoard: string[][]): void {
    if (type === 'board') {
      this.storageService.set(StorageKey.Board, JSON.stringify(targetBoard));
      this.storageService.set(StorageKey.CombinedBoard, JSON.stringify(this.combinedBoard));
    } else if (type === 'class') {
      this.storageService.set(StorageKey.ClassBoard, JSON.stringify(targetBoard));
    }
  }

  loadGameState(): void {
    this.board = JSON.parse(this.storageService.get(StorageKey.Board));
    this.classBoard = JSON.parse(this.storageService.get(StorageKey.ClassBoard));
    this.prevRound = Number(this.storageService.get(StorageKey.RoundIdx));
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
          window.plausible('Solution', { props: { word: this.decodedWord, board: this.board } });
          this.toggleNotice('You won!', 'good', true, 36e6);
          this._soln = true;
          this.endGame(true);
        } else if (final) {
          window.plausible('Failure', { props: { word: this.decodedWord, board: this.board } });
          this.toggleNotice(`<a class="wordnik" target="_blank" href="https://wordnik.com/words/${this.decodedWord.toLowerCase()}">${this.decodedWord.toUpperCase()}</a>`, 'bad', true, 36e6);
          this.endGame(true);
        }
      }, 0);
      this.play = '';
      this.prevRound = this.incrementRound(this.prevRound);
      this.storageService.set(StorageKey.RoundIdx, `${this.prevRound}`);
      this.updatePos();
    } else {
      this.toggleNotice('The word is not the dictionary.', 'warn');
    }
  }

  endGame(ended: boolean): void {
    const gameMode = this.storageService.get('gameMode') as GameMode;
    this.storageService.remove(StorageKey.SequenceIdx); // not needed any longer
    this.storageService.set(StorageKey.ShareText, JSON.stringify(this.shareText()));
    this.storageService.set(StorageKey.GameState, GameState.ENDED);
    if (this.storageService.get(StorageKey.GameMode) === GameMode.SEQUENCE) {
      this.storageService.set(StorageKey.CompletedSequenceUtc, new Date().toISOString());
      this.storageService.set(StorageKey.CompletedSequenceIdx, `${this.sequenceIdx}`);
    }
    // introduce completedGameMode, the end state of the game mode will allow to determine where to pick up
    this.storageService.set(StorageKey.CompletedGameMode, gameMode)
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
      if (soln[i] === letter) {
        // letter in sequence at proper slot
        return GuessClass.MATCH;
      } else if (alphabetKey[letter].idx.length === 0) {
        // the letter in sequence is not in solution
        return GuessClass.USED;
      } else {
        // the letter is in sequence but does not match
        if (repeatedSequence.includes(letter)) {
          // the guess is repeated
          if (sequence.lastIndexOf(letter) !== i) {
            if (!repeatedDecoded.includes(letter)) {
              // the guess is the first instance of a guessRepeated, _but_ repeatedDecoded is not in the mix,
              // so mark the first instance of the guess as MISMATCH
              return GuessClass.MISMATCH;
            } else {
              // the guess is the first instance letter of a repeated sequence _and_
              // the repeatedDecoded also has a dupe just not at this index
              return GuessClass.USED;
            }
          } else {
            // evoke -> bowel
            // the guess is the last letter of a repeated sequence and the previous guess was USED
            if (sequence.lastIndexOf(letter) <= i) {
              // return GuessClass.MISMATCH;
              // tally -> talon
              // mismatch on second L, so, the last index of has to be compared to the last index of the decoded word and if the decoded word last index is not higher than current index, it is used
              if (decodedWord.lastIndexOf(letter) > i) {
                return GuessClass.MISMATCH;
              } else {
                return GuessClass.USED;
              }

            } else {
              // the guess is the last instance letter of a repeated sequence and the previous guess was a (mis)match
              return GuessClass.USED;
            }
          }
        }
        // the letter is at the improper index
        return GuessClass.MISMATCH;
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
    this.notice = { message, type, again };
    this.clearNotice(timeOut);
  }

  clearNotice(timeout = 1500): void {
    setTimeout(() => {
      this.notice = { message: '', type: '', again: false };
    }, timeout);
  }

  recordStats(): void {
    this.storageService.set(StorageKey.Stats, JSON.stringify({}));
  }

  showStats(): void {
    // this.stats = this.storageService.get(StorageKey.Stats);
    this.storageService.set(StorageKey.GameState, GameState.PAUSED);
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
    const sharePls = () => this.ngNavigatorShareService.share(this.shareText())
      .then(() => { console.log(`Successful share`); })
      .catch((error) => { console.log(error); });

    window.plausible('Share', { callback: sharePls, props: { text: this.shareText() } });
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

  /**
   * Point of this message is to donkey-patch bad gameStates that I introduce in the PWA, whoops
   * Always target a specific sequenceIdx to timebox the shenanigans
   */
  private initBandages(): void {
    // 2022.02.18 @ 07:23:38 hotfix KD, NB could not get daily word, they were frozen out. stuck on LYNCH
    if (this.storageService.get('gameState') === GameState.ENDED && this.storageService.get('sequenceIdx') === `15`) {
      this.storageService.set(StorageKey.Hotfix, '2022.02.18-0015');
      this.gameService.reloadGame(this.sequencePlay);
    }
  }

}
