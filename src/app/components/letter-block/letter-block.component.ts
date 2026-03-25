import { Component, input } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-letter-block',
  templateUrl: './letter-block.component.html',
  styleUrls: ['./letter-block.component.scss']
})
export class LetterBlockComponent {
  readonly char = input<string>('');
  readonly letterClass = input<string>('');
  readonly active = input<boolean>(false);
  readonly next = input<boolean>(false);

  get charClass(): string {
    const active = this.active() ? 'char--active' : '';
    const next = this.next() ? 'char--next' : '';
    return `${this.letterClass()} ${active} ${next}`;
  }
}
