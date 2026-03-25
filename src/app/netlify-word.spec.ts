import {
  BASE_DATE,
  getMidnightTomorrow,
  getWordOfTheDay,
  getRandomWord,
  buildResponse,
} from 'netlify/functions/word-logic';
import { PLURAL_PAST_DICTIONARY } from 'netlify/functions/plural-past-dict';

describe('word function', () => {
  describe('BASE_DATE', () => {
    it('is Feb 3, 2022 05:00 UTC', () => {
      expect(BASE_DATE.toISOString()).toBe('2022-02-03T05:00:00.000Z');
    });
  });

  describe('getMidnightTomorrow', () => {
    it('returns tomorrow at 05:00 UTC', () => {
      const now = new Date('2022-03-01T12:00:00Z');
      const result = getMidnightTomorrow(now);
      expect(result.toISOString()).toBe('2022-03-02T05:00:00.000Z');
    });

    it('works with default (current time)', () => {
      const result = getMidnightTomorrow();
      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('getWordOfTheDay', () => {
    it('returns word at correct index based on day difference', () => {
      const targetDate = new Date('2022-02-04T05:00:00.000Z'); // 1 day after base
      const result = getWordOfTheDay(BASE_DATE, targetDate);
      expect(result.word).toBe(PLURAL_PAST_DICTIONARY[1]);
      expect(result.sequence).toBe(1);
    });

    it('returns index 0 for base date', () => {
      const result = getWordOfTheDay(BASE_DATE, BASE_DATE);
      expect(result.word).toBe(PLURAL_PAST_DICTIONARY[0]);
      expect(result.sequence).toBe(0);
    });
  });

  describe('getRandomWord', () => {
    it('returns a word and sequence from dictionary', () => {
      const result = getRandomWord();
      expect(result.word).toBeTruthy();
      expect(typeof result.sequence).toBe('number');
      expect(result.sequence).toBeGreaterThanOrEqual(0);
      expect(result.sequence).toBeLessThanOrEqual(PLURAL_PAST_DICTIONARY.length);
    });
  });

  describe('buildResponse', () => {
    const version = '1.0.0';
    const baseDate = BASE_DATE;
    const midnightTomorrow = new Date('2022-03-02T05:00:00.000Z');

    it('returns word at sequenceIdx when > 0', () => {
      const result = buildResponse('rando=false&sequenceIdx=5', version, baseDate, midnightTomorrow);
      expect(result.word).toBe(PLURAL_PAST_DICTIONARY[5]);
      expect(result.sequence).toBe('5');
      expect(result.mode).toBe('RANDOM');
      expect(result.version).toBe(version);
      expect(result.dates).toEqual([baseDate, midnightTomorrow]);
    });

    it('returns random word when rando=true', () => {
      const result = buildResponse('rando=true&sequenceIdx=0', version, baseDate, midnightTomorrow);
      expect(result.word).toBeTruthy();
      expect(result.mode).toBe('RANDOM');
    });

    it('returns periodic word for sequence mode', () => {
      const result = buildResponse('rando=false&sequenceIdx=0', version, baseDate, midnightTomorrow);
      expect(result.mode).toBe('SEQUENCE');
      expect(result.word).toBeTruthy();
    });

    it('uses default dates when not provided', () => {
      const result = buildResponse('rando=false&sequenceIdx=0', version);
      expect(result.dates.length).toBe(2);
      expect(result.dates[0]).toEqual(BASE_DATE);
    });
  });

  describe('handler integration', () => {
    function simulateHandler(url: string): Response {
      const parsedUrl = new URL(url);
      const rawQuery = parsedUrl.search.replace('?', '');
      const version = '0.14.11';
      return new Response(JSON.stringify(buildResponse(rawQuery, version)), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    it('returns JSON response with status 200', async () => {
      const response = simulateHandler('https://example.com/.netlify/functions/word?rando=false&sequenceIdx=1');

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/json');

      const body = await response.json();
      expect(body.word).toBe(PLURAL_PAST_DICTIONARY[1]);
      expect(body.sequence).toBe('1');
    });

    it('handles random mode', async () => {
      const response = simulateHandler('https://example.com/.netlify/functions/word?rando=true&sequenceIdx=0');
      const body = await response.json();

      expect(body.mode).toBe('RANDOM');
    });

    it('handles sequence mode', async () => {
      const response = simulateHandler('https://example.com/.netlify/functions/word?rando=false&sequenceIdx=0');
      const body = await response.json();

      expect(body.mode).toBe('SEQUENCE');
    });
  });
});
