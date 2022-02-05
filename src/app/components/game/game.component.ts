import { StorageService } from './../../services/storage.service';
import { FuncWord } from './../../services/word.service';
import { Component, OnInit, HostListener } from '@angular/core';
import { WordService } from 'src/app/services/word.service';
import { GuessClass, GuessAction, AlphaDict } from 'src/app/models/guess';
import { Notice } from 'src/app/models/notice';
import { ActivatedRoute } from '@angular/router';
import { ThemeService } from '@bcodes/ngx-theme-service';
import { sequenceEqual } from 'rxjs';

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
  alphabetKey: AlphaDict = {};
  debugMode: boolean = false;
  notice: Notice = {message: '', type: '', again: false};
  currentTheme = '';
  endState = false;
  buffer = '';
  navigator: any;
  isShareable = false;
  onSubmit: { reset: boolean } = { reset: false };
  private _play: string = '';

  constructor(
    private activatedRoute: ActivatedRoute,
    private wordService: WordService,
    private themeService: ThemeService,
    private storageService: StorageService,
  ) {
    this.activatedRoute.queryParams.subscribe(params => {
      if (params[`debug`] !== undefined) {
        this.debugMode = true;
      }
    });
  }

  ngOnInit(): void {
    this.initTheme();
    this.setupGame();
    if (this.navigator?.share) {
      this.isShareable = true;
    }
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

  /**
   * Shares game, share board matrix and link
   */
  shareGame(): void {
    if (this.navigator?.share) {
      this.navigator.share({
        title: 'KURDLE',
        text: 'text\n' + this.boardMatrix().map(r => r.join(' ')).join('\n'),
        url: 'https://kurdle.netlify.app',
      })
        .then(() => console.log('Successful share'))
        .catch((error: any) => console.log('Error sharing', error));
    }
  }

  boardMatrix(): string[][] {
    return this.classBoard.map((r) => {
      return r.map((c) => {
        if (c === GuessClass.MISMATCH) {
          return '🟨';
        } else if (c === GuessClass.MATCH) {
          return '🟩';
        } else if (c === GuessClass.USED) {
          return '⬛';
        } else {
          return '🤷🏻';
        }
      });
    }) as string[][];
  }

  /**
   * Reloads game
   * Gross but a mouse click that fires setupGame() has downstream issues ¯\_(ツ)_/¯
   */
  reloadGame(): void {
    location.reload();
  }

  /**
   * Sets Up Game
   * only works properly when toggled from keyboard (shift + ~), not mouse click ¯\_(ツ)_/¯
   */
  setupGame(): void {
    this.endState = false;
    this.round = 1;
    this.play = '';

    this.wordService.seedWordFromFunc('rando').subscribe((response: FuncWord) => {
      this.currentWord = response.word;
      // this.currentWord = btoa('model');
      // this.currentWord = btoa('mammy');
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
    if (buffer === 'josie' || buffer === 'evieb') {
      this.debugMode = true;
    } else if (buffer === 'xxx' || buffer === 'cammy') {
      this.debugMode = false;
    }
    return this.buffer.slice(-5);
  }

  removeLastSequenceLetter(play: string): void {
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
    if (sequence === 'josie' || sequence === 'evieb') {
      this.debugMode = true;
    }
    if (sequence === 'cammy') {
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
          console.log(this.boardMatrix());
          this.onSubmit = { reset: true };
          // this.recordStats()
          // this.showStats();
        }
      }, 1000);
      this.play = '';
      this.round = this.incrementRound(this.round);
      this.storageService.set('round', `${this.round}`);
      // this.populateAlphabetDict([...sequence], classBoardRow, [...this.decodedWord]);
    } else {
      this.toggleNotice('The word is not the dictionary. Try again.', 'warn');
    }
  }

  // populateAlphabetDict(sequence: string[], classes: GuessClass[], decodedWord: string[]): void {
  //   sequence.forEach((letter, idx) => {
  //     console.log(letter, classes[idx], decodedWord[idx]);
  //     // this needs to be immutable. doesn't have to be populated because we set it from the jump?
  //     // this.alphabetKey[letter] = {class: classes[idx], idx: []};
  //   });
  // }

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

    // if (repeatedSequence.length < repeatedDecoded.length || repeatedSequence.length == repeatedDecoded.length) {
    //   guessClass = [...sequence].map((letter, i) => {
    //     // letter in sequence at proper solution[idx]
    //     if (alphabetKey[letter] && alphabetKey[letter].idx.includes(i)) {
    //       return GuessClass.MATCH;
    //     } else if (alphabetKey[letter].idx.length === 0) {
    //       return GuessClass.USED;
    //     } else { // misfires can happen here
    //       return GuessClass.MISMATCH;
    //     }
    //   });
    // } else {
    //   // DUNNO!
    //   let matchQueue = [...sequence].map((letter, i) => {
    //     // letter in sequence at proper solution[idx]
    //     if (alphabetKey[letter] && alphabetKey[letter].idx.includes(i)) {
    //       return letter;
    //     } else {
    //       return null;
    //     }
    //   });

    //   let usedQueue = [...sequence].map((letter, i) => {
    //     // letter in sequence at proper solution[idx]
    //     if (alphabetKey[letter] && alphabetKey[letter].idx.length === 0) {
    //       return letter;
    //     } else {
    //       return null
    //     }
    //   });

    //   let misMatchQueue = [...sequence].map((letter, i) => {
    //     if (alphabetKey[letter] && alphabetKey[letter].idx.length > 0 && !alphabetKey[letter].idx.includes(i)) {
    //       return letter;
    //     } else {
    //       return null
    //     }
    //   });
    //   // debugger;
    // }

    // return guessClass;
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
    // are there dupes in guess?


    // // console.log(sequence, this.wordService.decode(solutionWord), `guess+solution`);
    // const solution = this.wordService.decode(solutionWord);
    // let solutionDuplicateIndicies: number[] = [];
    // let validChars = [...sequence].map((letter, idx) => {
    //   // finds repeat letters in the solution word
    //   const solutionDuplicateIdx = this.wordService.getIndices(solution, letter);
    //   if (solutionDuplicateIdx.length > 1) {
    //     solutionDuplicateIndicies = solutionDuplicateIdx;
    //   }
    //   return solution.indexOf(letter);
    // });

    // // find matched indexes.
    // // solution  [0, 1, 2, 3, 4]
    // // mismatch  [-1, -1, -1, -1, -1]
    // // match(es) [0, -1, 2, -1, -1]
    // // prune [0, 1, 0, -1, -1] => [0, 1, -1, -1, -1]
    // return this.pruneDuplicateLetters(validChars).map((idxMatch: number, slot) => {
    //   if (idxMatch === -1) { return GuessClass.USED; }
    //   else if (idxMatch === slot || solutionDuplicateIndicies.includes(slot)) { return GuessClass.MATCH;} // 🤮
    //   else { return GuessClass.MISMATCH; } //(idxMatch !== slot)
    // });
  }

  /**
   * Scrubs duplicate letters @ improper indices
   * [A][V][A][I][L] 2nd A is mismatch w/o index fix
   * [A][V][E][R][T]
   * no repeated indexes over -1 in array
   * @param [0, 1, 0, -1, -1]
   * @returns [0, 1, -1, -1, -1]
   */
  pruneDuplicateLetters(validChars: number[]): number[] {
    const targetChars: number[] = [];
    validChars.forEach((guessIdx, idx) => {
      if (targetChars.includes(guessIdx) && guessIdx !== idx) {
        targetChars[idx] = -1;
      } else {
        targetChars[idx] = guessIdx;
      }
    });
    return targetChars;
  };

  incrementRound(round: number): number {
    return round < 6 ? round + 1 : 1;
  }

  attribution(): void {
    this.toggleNotice(`Built by&nbsp;<a target="_blank" href="https://twitter.com/ky">@ky</a>`, 'default');
  }

  toggleNotice(message: string, type: string, again = false, timeOut = 1500): void {
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
