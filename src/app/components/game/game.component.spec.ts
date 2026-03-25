import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import * as stub from 'src/app/testing/stubs';
import { WordService } from 'src/app/services/word.service';
import { GameComponent } from './game.component';
import { StorageService } from 'src/app/services/storage.service';

describe('GameComponent', () => {
  let component: GameComponent;
  let fixture: ComponentFixture<GameComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GameComponent ],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: WordService, useClass: stub.MockWordService },
        { provide: StorageService, useClass: stub.MockStorageService },
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GameComponent);
    component = fixture.componentInstance;
    component.play = 'kurdl'
    fixture.detectChanges();
  });

  xit('should create', () => {
    expect(component).toBeTruthy();
  });
});
