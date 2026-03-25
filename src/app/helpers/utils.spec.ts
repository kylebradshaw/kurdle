import { nextRoundTime, forceRefresh, LocationLike } from './utils';
import { GameMode } from 'src/app/models/game';

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
});
