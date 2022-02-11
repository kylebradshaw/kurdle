import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-letter-block',
  templateUrl: './letter-block.component.html',
  styleUrls: ['./letter-block.component.scss']
})
export class LetterBlockComponent implements OnInit {
  @Input() char: string = "";
  @Input() letterClass: string = "";
  @Input() active: boolean = false;
  @Input() next: boolean = false;

  constructor() {}

  ngOnInit(): void {
  }

  get charClass(): string {
    const active = (this.active) ? 'char--active' : '';
    const next = (this.next) ? 'char--next' : '';
    return `char--${this.letterClass} ${active} ${next}`;
  }

}
