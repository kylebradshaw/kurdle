import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { AlphaDict, GuessAction } from 'src/app/models/guess';

@Component({
  selector: 'app-keyboard',
  templateUrl: './keyboard.component.html',
  styleUrls: ['./keyboard.component.scss']
})
export class KeyboardComponent implements OnInit {
  @Input() alphabetClass: AlphaDict = {};
  @Input() sequence: string[] = [];
  @Output() onClick = new EventEmitter<string>();
  keys: string[][];

  constructor() {
    this.keys = [
      ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
      ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
      ['↵', 'z', 'x', 'c', 'v', 'b', 'n', 'm', '⌫']
    ];
  }

  ngOnInit(): void {
  }

  onLetter(letter: any): void {
    console.log(letter);
    // if (letter === GuessAction.DEL) {
    //   this.sequence.length = (this.sequence.length > 0) ? this.sequence.length - 1 : 0;
    // } else {
    //   this.sequence.push(letter);
    // }
    this.onClick.emit(this.sequence.join(''));
    // reset sequence
    if (letter === GuessAction.ENTER) {
      this.sequence = [];
    }
  }
}
