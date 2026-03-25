import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { GuessClass } from 'src/app/models/guess';
import { WordService, FuncWord } from './word.service';
import { GameMode } from 'src/app/models/game';

describe('WordService', () => {
  let service: WordService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(WordService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAlphabetKey', () => {
    it('returns a dictionary with all 26 letters', () => {
      const result = service.getAlphabetKey('frame');
      expect(Object.keys(result).length).toBe(26);
      expect(result['a'].class).toBe(GuessClass.DEFAULT);
    });

    it('maps correct indices for letters in the word', () => {
      const result = service.getAlphabetKey('hello');
      expect(result['h'].idx).toEqual([0]);
      expect(result['e'].idx).toEqual([1]);
      expect(result['l'].idx).toEqual([2, 3]);
      expect(result['o'].idx).toEqual([4]);
      expect(result['z'].idx).toEqual([]);
    });
  });

  describe('seedWordFromFunc', () => {
    it('makes HTTP GET to netlify function', () => {
      const mockResponse: FuncWord = {
        word: btoa('frame'),
        sequence: 1,
        mode: GameMode.SEQUENCE,
        version: '1.0',
        dates: [],
      };

      service.seedWordFromFunc(false, 0).subscribe(result => {
        expect(result).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(r => r.url === '/.netlify/functions/word');
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('passes rando and sequenceIdx params', () => {
      service.seedWordFromFunc(true, 5).subscribe();

      const req = httpMock.expectOne(r => r.url === '/.netlify/functions/word');
      expect(req.request.params.get('rando')).toBe('true');
      expect(req.request.params.get('sequenceIdx')).toBe('5');
      req.flush({});
    });

    it('handles sequenceIdx of 0 (falsy)', () => {
      service.seedWordFromFunc(false, 0).subscribe();

      const req = httpMock.expectOne(r => r.url === '/.netlify/functions/word');
      req.flush({});
    });

    it('handles undefined params', () => {
      service.seedWordFromFunc().subscribe();

      const req = httpMock.expectOne(r => r.url === '/.netlify/functions/word');
      req.flush({});
    });
  });

  describe('seedWord', () => {
    it('returns word at specific index', () => {
      const result = service.seedWord(1);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('returns random word when index is 0 (falsy)', () => {
      const result = service.seedWord(0);
      expect(typeof result).toBe('string');
    });

    it('returns random word when no index provided', () => {
      const result = service.seedWord();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('compare', () => {
    it('returns true when play matches decoded obfuscated', () => {
      expect(service.compare('frame', btoa('frame'))).toBe(true);
    });

    it('returns false when play does not match', () => {
      expect(service.compare('frame', btoa('other'))).toBe(false);
    });
  });

  describe('repeatedCharacters', () => {
    it('returns empty array for no repeated chars', () => {
      expect(service.repeatedCharacters('frame')).toEqual([]);
    });

    it('returns repeated characters', () => {
      expect(service.repeatedCharacters('mammy')).toEqual(['m']);
    });

    it('handles empty string', () => {
      expect(service.repeatedCharacters('')).toEqual([]);
    });
  });

  describe('getIndices', () => {
    it('returns indices of letter in word', () => {
      expect(service.getIndices('hello', 'l')).toEqual([2, 3]);
    });

    it('returns empty for letter not in word', () => {
      expect(service.getIndices('hello', 'z')).toEqual([]);
    });

    it('returns single index', () => {
      expect(service.getIndices('hello', 'h')).toEqual([0]);
    });
  });

  describe('decode', () => {
    it('decodes base64 string', () => {
      expect(service.decode(btoa('frame'))).toBe('frame');
    });

    it('decodes another word', () => {
      expect(service.decode(btoa('hello'))).toBe('hello');
    });
  });

  describe('inDict', () => {
    it('returns true for a word in the dictionary', () => {
      // The dictionary contains base64-encoded words
      const decoded = atob(service.seedWord(0));
      expect(service.inDict(decoded)).toBe(true);
    });

    it('returns false for a word not in the dictionary', () => {
      expect(service.inDict('zzzzz')).toBe(false);
    });
  });

  describe('numberToLetters', () => {
    it('converts number to letter string', () => {
      const result = service.numberToLetters(123);
      expect(typeof result).toBe('string');
      expect(result.length).toBe(3);
    });

    it('converts single digit', () => {
      const result = service.numberToLetters(0);
      expect(typeof result).toBe('string');
      expect(result.length).toBe(1);
    });

    it('is deterministic', () => {
      expect(service.numberToLetters(42)).toBe(service.numberToLetters(42));
    });
  });
});
