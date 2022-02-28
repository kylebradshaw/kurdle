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

  describe('solver() algo', () => {
    it('should solve frame/frame', () => {
      expect(service.solver('frame', 'frame')).toEqual([GuessClass.MATCH, GuessClass.MATCH, GuessClass.MATCH, GuessClass.MATCH, GuessClass.MATCH]);
    });
    it('should solve retry/rebut', () => {
      expect(service.solver('retry', 'rebut')).toEqual([GuessClass.MATCH, GuessClass.MATCH, GuessClass.MISMATCH, GuessClass.USED, GuessClass.USED]);
    });
    it('should solve mammy/mommy', () => {
      expect(service.solver('mammy', 'mommy')).toEqual([GuessClass.MATCH, GuessClass.USED, GuessClass.MATCH, GuessClass.MATCH, GuessClass.MATCH]);
    });
    it('should solve plate/pleat', () => {
      expect(service.solver('plate', 'pleat')).toEqual([GuessClass.MATCH, GuessClass.MATCH, GuessClass.MISMATCH, GuessClass.MISMATCH, GuessClass.MISMATCH]);
    });
    it('should solve bully/blurt', () => {
      expect(service.solver('bully', 'blurt')).toEqual([GuessClass.MATCH, GuessClass.MISMATCH, GuessClass.MISMATCH, GuessClass.USED, GuessClass.USED]);
    });
    it('should solve terse/trend', () => {
      expect(service.solver('terse', 'trend')).toEqual([GuessClass.MATCH, GuessClass.MISMATCH, GuessClass.MISMATCH, GuessClass.USED, GuessClass.USED]);
    });
    it('should solve stiff/swift', () => {
      expect(service.solver('stiff', 'swift')).toEqual([GuessClass.MATCH, GuessClass.MISMATCH, GuessClass.MATCH, GuessClass.MATCH, GuessClass.USED]);
    });
    it('should solve swift/stiff', () => {
      expect(service.solver('swift', 'stiff')).toEqual([GuessClass.MATCH, GuessClass.USED, GuessClass.MATCH, GuessClass.MATCH, GuessClass.MISMATCH]);
    });
    it('should solve piece/prize', () => {
      expect(service.solver('piece', 'prize')).toEqual([GuessClass.MATCH, GuessClass.MISMATCH, GuessClass.USED, GuessClass.USED, GuessClass.MATCH]);
    });
    it('should solve evoke/bowel', () => {
      expect(service.solver('evoke', 'bowel')).toEqual([GuessClass.MISMATCH, GuessClass.USED, GuessClass.MISMATCH, GuessClass.USED, GuessClass.USED]);
    });
    it('should solve tally/talon', () => {
      expect(service.solver('tally', 'talon')).toEqual([GuessClass.MATCH, GuessClass.MATCH, GuessClass.MATCH, GuessClass.USED, GuessClass.USED]);
    });
    it('should solve apart/azure', () => {
      expect(service.solver('apart', 'azure')).toEqual([GuessClass.MATCH, GuessClass.USED, GuessClass.USED, GuessClass.MATCH, GuessClass.USED]);
    });
    it('should solve woody/glove', () => {
      expect(service.solver('woody', 'glove')).toEqual([GuessClass.USED, GuessClass.USED, GuessClass.MATCH, GuessClass.USED, GuessClass.USED]);
    });
    it('should solve attic/admit', () => {
      expect(service.solver('attic', 'admit')).toEqual([GuessClass.MATCH, GuessClass.MISMATCH, GuessClass.USED, GuessClass.MATCH, GuessClass.USED]);
    });
  });
});
