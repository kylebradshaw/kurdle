import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DICTIONARY } from 'netlify/functions/dict';

export interface FuncWord {
  word: string;
  wordText: string;
}
@Injectable({
  providedIn: 'root'
})
export class WordService {

  constructor (
    private http: HttpClient,
  ) { }

  public seedWordFromFunc(query: string): Observable<FuncWord> {
    const url = `/.netlify/functions/word?=${query}`;
    return this.http.get(url).pipe(map((response: any) => response));
  }

  public seedWord(index?: number): string {
    return (index) ? DICTIONARY[index] : DICTIONARY[Math.floor(Math.random() * DICTIONARY.length)];
  }

  public compare(play: string, obfuscated: string): boolean {
    return play === atob(obfuscated);
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

}
