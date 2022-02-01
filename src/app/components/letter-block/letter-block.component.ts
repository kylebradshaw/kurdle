import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-letter-block',
  templateUrl: './letter-block.component.html',
  styleUrls: ['./letter-block.component.scss']
})
export class LetterBlockComponent implements OnInit {
  @Input() char: string = "";
  selected = false;

  constructor() {}

  ngOnInit(): void {
  }

}
