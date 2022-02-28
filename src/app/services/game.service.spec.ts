import { TestBed } from '@angular/core/testing';
import { GuessClass } from 'src/app/models/guess';
import { StorageService } from 'src/app/services/storage.service';
import { HttpClientModule } from '@angular/common/http';

import { GameService } from './game.service';

describe('GameService', () => {
  let service: GameService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientModule
      ],
      providers: [
        { provide: StorageService }
      ]
    });
    service = TestBed.inject(GameService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should test solver() algo', () => {
    expect(service.solver('frame', 'frame')).toEqual([GuessClass.MATCH, GuessClass.MATCH, GuessClass.MATCH, GuessClass.MATCH, GuessClass.MATCH]);
    expect(service.solver('retry', 'rebut')).toEqual([GuessClass.MATCH, GuessClass.MATCH, GuessClass.MISMATCH, GuessClass.USED, GuessClass.USED]);
    expect(service.solver('mammy', 'mommy')).toEqual([GuessClass.MATCH, GuessClass.USED, GuessClass.MATCH, GuessClass.MATCH, GuessClass.MATCH]);
    expect(service.solver('plate', 'pleat')).toEqual([GuessClass.MATCH, GuessClass.MATCH, GuessClass.MISMATCH, GuessClass.MISMATCH, GuessClass.MISMATCH]);
    expect(service.solver('bully', 'blurt')).toEqual([GuessClass.MATCH, GuessClass.MISMATCH, GuessClass.MISMATCH, GuessClass.USED, GuessClass.USED]);
    expect(service.solver('terse', 'trend')).toEqual([GuessClass.MATCH, GuessClass.MISMATCH, GuessClass.MISMATCH, GuessClass.USED, GuessClass.USED]);
    expect(service.solver('stiff', 'swift')).toEqual([GuessClass.MATCH, GuessClass.MISMATCH, GuessClass.MATCH, GuessClass.MATCH, GuessClass.USED]);
    expect(service.solver('swift', 'stiff')).toEqual([GuessClass.MATCH, GuessClass.USED, GuessClass.MATCH, GuessClass.MATCH, GuessClass.MISMATCH]);
    expect(service.solver('piece', 'prize')).toEqual([GuessClass.MATCH, GuessClass.MISMATCH, GuessClass.MISMATCH, GuessClass.USED, GuessClass.MATCH]);
    expect(service.solver('evoke', 'bowel')).toEqual([GuessClass.MISMATCH, GuessClass.USED, GuessClass.MISMATCH, GuessClass.USED, GuessClass.USED]);
    expect(service.solver('tally', 'talon')).toEqual([GuessClass.MATCH, GuessClass.MATCH, GuessClass.MATCH, GuessClass.USED, GuessClass.USED]);
    expect(service.solver('apart', 'azure')).toEqual([GuessClass.MATCH, GuessClass.USED, GuessClass.USED, GuessClass.MATCH, GuessClass.USED]);
    expect(service.solver('woody', 'glove')).toEqual([GuessClass.USED, GuessClass.USED, GuessClass.MATCH, GuessClass.USED, GuessClass.USED]);
    expect(service.solver('attic', 'admit')).toEqual([GuessClass.MATCH, GuessClass.MISMATCH, GuessClass.USED, GuessClass.MATCH, GuessClass.USED]);
  });
});
