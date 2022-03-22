import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LetterBlockComponent } from './letter-block.component';

describe('LetterBlockComponent', () => {
  let component: LetterBlockComponent;
  let fixture: ComponentFixture<LetterBlockComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LetterBlockComponent ],
      schemas: [ CUSTOM_ELEMENTS_SCHEMA ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LetterBlockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
