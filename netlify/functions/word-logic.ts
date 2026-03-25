import { PLURAL_PAST_DICTIONARY } from './plural-past-dict';
import { differenceInDays } from 'date-fns';
import { Random } from 'random-js';

export interface Solution {
  word: string;
  sequence: number;
}

export interface WordResponse {
  word: string;
  sequence: number | string;
  mode: string;
  version: string;
  dates: Date[];
}

export const BASE_DATE = new Date(Date.UTC(2022, 1, 3, 5, 0, 0, 0));

export function getMidnightTomorrow(now: Date = new Date()): Date {
  const tomorrow = new Date(now);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  return new Date(tomorrow.setUTCHours(5, 0, 0, 0));
}

export function getWordOfTheDay(baseDate: Date, targetDate: Date): Solution {
  const idx = differenceInDays(targetDate, baseDate);
  return { word: PLURAL_PAST_DICTIONARY[idx], sequence: idx };
}

export function getRandomWord(): Solution {
  const idx = new Random().integer(0, PLURAL_PAST_DICTIONARY.length);
  return { word: PLURAL_PAST_DICTIONARY[idx], sequence: idx };
}

export function buildResponse(
  rawQuery: string,
  version: string,
  baseDate: Date = BASE_DATE,
  midnightTomorrow: Date = getMidnightTomorrow(),
): WordResponse {
  const sequenceIdx = Number(rawQuery.split('sequenceIdx=')[1]);
  const dates = [baseDate, midnightTomorrow];

  if (sequenceIdx > 0) {
    return {
      word: PLURAL_PAST_DICTIONARY[sequenceIdx],
      sequence: `${sequenceIdx}`,
      mode: 'RANDOM',
      version,
      dates,
    };
  } else if (rawQuery.includes('rando=true')) {
    const random = getRandomWord();
    return {
      word: random.word,
      sequence: random.sequence,
      mode: 'RANDOM',
      version,
      dates,
    };
  } else {
    const periodic = getWordOfTheDay(baseDate, midnightTomorrow);
    return {
      word: periodic.word,
      sequence: periodic.sequence,
      mode: 'SEQUENCE',
      version,
      dates,
    };
  }
}
