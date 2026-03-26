import { nextRoundTime, forceRefresh, LocationLike, repeatedCharacters, solveGuess, sample } from './utils';
import { GameMode } from 'src/app/models/game';
import { GuessClass } from 'src/app/models/guess';

describe('Helpers', () => {
  describe('nextRoundTime', () => {
    it('returns hours, minutes, seconds remaining until expiry', () => {
      const now = new Date();
      const future = new Date(now.getTime() + (2 * 36e5) + (30 * 6e4) + (15 * 1e3));
      const result = nextRoundTime(future.toISOString());
      expect(result.hours).toBe(2);
      expect(result.minutes).toBe(30);
      expect(result.seconds).toBeGreaterThanOrEqual(14);
      expect(result.seconds).toBeLessThanOrEqual(15);
    });

    it('returns negative-ish values when expiry is in the past', () => {
      const past = new Date(Date.now() - 10000);
      const result = nextRoundTime(past.toISOString());
      expect(result.hours).toBeLessThanOrEqual(0);
      expect(result.minutes).toBeLessThanOrEqual(0);
      expect(result.seconds).toBeLessThanOrEqual(0);
    });

    it('returns correct values for exactly 1 hour from now', () => {
      const now = new Date();
      const oneHourFromNow = new Date(now.getTime() + 36e5);
      const result = nextRoundTime(oneHourFromNow.toISOString());
      expect(result.hours).toBe(1);
      expect(result.minutes).toBe(0);
      expect(result.seconds).toBeLessThanOrEqual(0);
    });

    it('handles zero time left', () => {
      const now = new Date();
      const result = nextRoundTime(now.toISOString());
      expect(result.hours).toBe(0);
      expect(result.minutes).toBe(0);
      expect(result.seconds).toBeLessThanOrEqual(0);
    });
  });

  describe('forceRefresh', () => {
    function makeLoc(overrides: Partial<LocationLike> = {}): LocationLike {
      return {
        href: 'http://localhost:4200',
        origin: 'http://localhost:4200',
        search: '',
        reload: vi.fn(),
        ...overrides,
      };
    }

    it('sets href to rando URL for RANDOM mode when not already rando', () => {
      const loc = makeLoc();
      forceRefresh(GameMode.RANDOM, loc);
      expect(loc.href).toBe('http://localhost:4200?rando=true');
    });

    it('appends rando when URL already has query params', () => {
      const loc = makeLoc({
        href: 'http://localhost:4200?foo=bar',
        search: '?foo=bar',
      });
      forceRefresh(GameMode.RANDOM, loc);
      expect(loc.href).toContain('rando=true');
    });

    it('calls reload when already in RANDOM mode', () => {
      const loc = makeLoc({
        href: 'http://localhost:4200?rando=true',
        search: '?rando=true',
      });
      forceRefresh(GameMode.RANDOM, loc);
      expect(loc.reload).toHaveBeenCalled();
    });

    it('navigates to origin for SEQUENCE mode', () => {
      const loc = makeLoc({
        href: 'http://localhost:4200?rando=true',
      });
      forceRefresh(GameMode.SEQUENCE, loc);
      expect(loc.href).toBe('http://localhost:4200');
    });

    it('returns early for unrecognized game mode', () => {
      const loc = makeLoc();
      forceRefresh('' as GameMode, loc);
      expect(loc.href).toBe('http://localhost:4200');
      expect(loc.reload).not.toHaveBeenCalled();
    });
  });

  describe('sample', () => {
    it('returns an element from the array', () => {
      const arr = ['a', 'b', 'c'];
      const result = sample(arr);
      expect(arr).toContain(result);
    });

    it('returns undefined for empty array', () => {
      const result = sample([]);
      expect(result).toBeUndefined();
    });

    it('returns the only element for single-element array', () => {
      const result = sample(['only']);
      expect(result).toBe('only');
    });

    it('returns elements with roughly equal probability over many samples', () => {
      const arr = ['a', 'b', 'c', 'd'];
      const counts: Record<string, number> = { a: 0, b: 0, c: 0, d: 0 };
      const iterations = 4000;

      for (let i = 0; i < iterations; i++) {
        const result = sample(arr);
        if (result) counts[result]++;
      }

      // Each element should be sampled roughly 1000 times (1/4 of 4000)
      // Allow 30% variance (700-1300)
      Object.values(counts).forEach(count => {
        expect(count).toBeGreaterThan(700);
        expect(count).toBeLessThan(1300);
      });
    });
  });

  describe('repeatedCharacters', () => {
    it('returns empty array for no repeats', () => {
      expect(repeatedCharacters('frame')).toEqual([]);
    });

    it('returns repeated characters', () => {
      expect(repeatedCharacters('mammy')).toEqual(['m']);
    });

    it('returns multiple repeated characters', () => {
      const result = repeatedCharacters('aabbb');
      expect(result).toContain('a');
      expect(result).toContain('b');
    });

    it('handles empty string', () => {
      expect(repeatedCharacters('')).toEqual([]);
    });
  });

  describe('solveGuess', () => {
    it('all matches', () => {
      expect(solveGuess('frame', 'frame')).toEqual([
        GuessClass.MATCH, GuessClass.MATCH, GuessClass.MATCH, GuessClass.MATCH, GuessClass.MATCH,
      ]);
    });

    it('all used', () => {
      expect(solveGuess('woody', 'glove')).toEqual([
        GuessClass.USED, GuessClass.USED, GuessClass.MATCH, GuessClass.USED, GuessClass.USED,
      ]);
    });

    it('handles mismatches', () => {
      expect(solveGuess('retry', 'rebut')).toEqual([
        GuessClass.MATCH, GuessClass.MATCH, GuessClass.MISMATCH, GuessClass.USED, GuessClass.USED,
      ]);
    });

    it('handles duplicate letters in guess: mammy/mommy', () => {
      expect(solveGuess('mammy', 'mommy')).toEqual([
        GuessClass.MATCH, GuessClass.USED, GuessClass.MATCH, GuessClass.MATCH, GuessClass.MATCH,
      ]);
    });

    it('handles salsa/lasso (repeated in both)', () => {
      expect(solveGuess('salsa', 'lasso')).toEqual([
        GuessClass.MISMATCH, GuessClass.MATCH, GuessClass.MISMATCH, GuessClass.MATCH, GuessClass.USED,
      ]);
    });

    it('handles moody/motto (repeated o)', () => {
      expect(solveGuess('moody', 'motto')).toEqual([
        GuessClass.MATCH, GuessClass.MATCH, GuessClass.MISMATCH, GuessClass.USED, GuessClass.USED,
      ]);
    });

    it('handles stiff/swift (repeated f)', () => {
      expect(solveGuess('stiff', 'swift')).toEqual([
        GuessClass.MATCH, GuessClass.MISMATCH, GuessClass.MATCH, GuessClass.MATCH, GuessClass.USED,
      ]);
    });

    it('handles triple letter in guess with 2 in solution', () => {
      // guess 'aaacx' has 3 a's at [0,1,2], solution 'xaayz' has 2 a's at [1,2]
      // idx 0: a vs x → MISMATCH, idx 1: a vs a → MATCH, idx 2: a vs a → MATCH
      // idx 3: c vs y → USED, idx 4: x vs z → MISMATCH (x in solution)
      // 2nd pass idx 0: indicies.length===3, indicies[0]===0===idx → MISMATCH
      expect(solveGuess('aaacx', 'xaayz')).toEqual([
        GuessClass.MISMATCH, GuessClass.MATCH, GuessClass.MATCH, GuessClass.USED, GuessClass.MISMATCH,
      ]);
    });

    it('handles triple letter, 2nd index mismatch', () => {
      // guess 'cacax' has 3 a's? No. c-a-c-a-x → a at [1,3], c at [0,2]
      // Need: 3 of same letter where 2nd is the one being resolved
      // guess 'xaaax' → a at [1,2,3], solution 'axyzx' → a at [0]
      // 1st: x vs a → MISMATCH, a vs x → MISMATCH, a vs y → MISMATCH, a vs z → MISMATCH, x vs x → MATCH
      // 2nd idx 1: len=3, indicies[0]=1 === idx=1 → MISMATCH (already hit above)
      // 2nd idx 2: len=3, indicies[1]=2 === idx=2 → MISMATCH (hits other branch!)
      // 2nd idx 3: len=3, neither [0] nor [1] → falls to USED
      expect(solveGuess('xaaax', 'axyzx')).toEqual([
        GuessClass.MISMATCH, GuessClass.MISMATCH, GuessClass.MISMATCH, GuessClass.USED, GuessClass.MATCH,
      ]);
    });
  });
});
