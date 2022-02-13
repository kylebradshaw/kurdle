import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DICTIONARY } from 'netlify/functions/dict';
import { AlphaDict, GuessClass } from 'src/app/models/guess';
import { Params } from '@angular/router';

export interface FuncWord {
  word: string;
  sequence: number;
  action: string;
  cache: string;
  dates: string[];
}
@Injectable({
  providedIn: 'root'
})
export class WordService {

  constructor (
    private http: HttpClient,
  ) { }

  public getAlphabetKey(decodedWord: string): AlphaDict {
    let alphabetKey: AlphaDict = {};
    [...'abcdefghijklmnopqrstuvwxyz'].forEach(letter => {
      alphabetKey[letter] = { class: GuessClass.DEFAULT, idx: this.getIndices(decodedWord, letter) };
    });
    return alphabetKey;
  }

  public seedWordFromFunc(rando?: boolean, sequenceIdx?: number): Observable<FuncWord> {
    let sequenceIndex = '';
    if (sequenceIdx && sequenceIdx > 0) {
      sequenceIndex = `${sequenceIdx}`;
    }
    const params = { params: {rando, sequenceIdx: sequenceIdx}} as Params;
    const url = `/.netlify/functions/word`;
    return this.http.get(url, params).pipe(map((response: any) => response));
  }

  public seedWord(index?: number): string {
    return (index) ? DICTIONARY[index] : DICTIONARY[Math.floor(Math.random() * DICTIONARY.length)];
  }

  public compare(play: string, obfuscated: string): boolean {
    return play === atob(obfuscated);
  }

  public repeatedCharacters(str: string): string[] {
    const result = [] as string[];
    const strArr = str.toLowerCase().split("").sort().join("").match(/(.)\1+/g);

    if (strArr != null) {
      strArr.forEach((elem) => {
        result.push(elem[0]);
      });
    }
    return result;
  }

  public getIndices(word: string, letter:string ): number[] {
    return [...word].flatMap((char, i) => (char === letter ? i : []));
  };

  public decode(word: string): string {
    return atob(word);
  }

  public inDict(word: string): boolean {
    return DICTIONARY.includes(btoa(word));
  }

  public lettersMatch(): number[] {
    return [0, 1, 2, 3, 4]
  }

  public numberToLetters(num: number): string {
    const alphabet = 'abcdefghijklmnopqrstuvwxyz';
    const alphabetArr = alphabet.split('');
    return `${num}`.split('').map(num => alphabetArr[Number(num) + 11 % 26] ).join('');
  }

}
