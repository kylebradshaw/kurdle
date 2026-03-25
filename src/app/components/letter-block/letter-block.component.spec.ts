import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { LetterBlockComponent } from './letter-block.component';
import { GuessClass } from 'src/app/models/guess';

@Component({
  standalone: true,
  imports: [LetterBlockComponent],
  template: `<app-letter-block
    [char]="char"
    [letterClass]="letterClass"
    [active]="active"
    [next]="next"
  />`,
})
class TestHostComponent {
  char = '';
  letterClass = '';
  active = false;
  next = false;
}

describe('LetterBlockComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();
  });

  function create(overrides: Partial<TestHostComponent> = {}) {
    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    Object.assign(host, overrides);
    fixture.detectChanges();
  }

  it('should create', () => {
    create();
    const letterBlock = fixture.debugElement.children[0].componentInstance as LetterBlockComponent;
    expect(letterBlock).toBeTruthy();
  });

  it('renders the character', () => {
    create({ char: 'A' });
    const inner = fixture.nativeElement.querySelector('.char--inner');
    expect(inner.textContent.trim()).toBe('A');
  });

  it('applies letterClass to charClass', () => {
    create({ letterClass: GuessClass.MATCH });
    const charDiv = fixture.nativeElement.querySelector('.char');
    expect(charDiv.className).toContain(GuessClass.MATCH);
  });

  it('applies char--active when active is true', () => {
    create({ active: true });
    const charDiv = fixture.nativeElement.querySelector('.char');
    expect(charDiv.className).toContain('char--active');
  });

  it('does not apply char--active when active is false', () => {
    create({ active: false });
    const charDiv = fixture.nativeElement.querySelector('.char');
    expect(charDiv.className).not.toContain('char--active');
  });

  it('applies char--next when next is true', () => {
    create({ next: true });
    const charDiv = fixture.nativeElement.querySelector('.char');
    expect(charDiv.className).toContain('char--next');
  });

  it('does not apply char--next when next is false', () => {
    create({ next: false });
    const charDiv = fixture.nativeElement.querySelector('.char');
    expect(charDiv.className).not.toContain('char--next');
  });

  it('renders correctly for MATCH', () => {
    create({ letterClass: GuessClass.MATCH, char: 'X' });
    expect(fixture.nativeElement.querySelector('.char').className).toContain(GuessClass.MATCH);
  });

  it('renders correctly for MISMATCH', () => {
    create({ letterClass: GuessClass.MISMATCH, char: 'X' });
    expect(fixture.nativeElement.querySelector('.char').className).toContain(GuessClass.MISMATCH);
  });

  it('renders correctly for USED', () => {
    create({ letterClass: GuessClass.USED, char: 'X' });
    expect(fixture.nativeElement.querySelector('.char').className).toContain(GuessClass.USED);
  });

  it('renders correctly for DEFAULT', () => {
    create({ letterClass: GuessClass.DEFAULT, char: 'X' });
    expect(fixture.nativeElement.querySelector('.char').className).toContain(GuessClass.DEFAULT);
  });

  it('combines all class flags', () => {
    create({ letterClass: GuessClass.MATCH, active: true, next: true });
    const charDiv = fixture.nativeElement.querySelector('.char');
    expect(charDiv.className).toContain(GuessClass.MATCH);
    expect(charDiv.className).toContain('char--active');
    expect(charDiv.className).toContain('char--next');
  });
});
