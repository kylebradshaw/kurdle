// import * as base64 from 'base-64';
import {zonedTimeToUtc} from 'date-fns-tz';
import {
  differenceInDays,
  addDays,
  startOfDay
} from 'date-fns'
import { DICTIONARY } from './dict';
import { Handler,  } from '@netlify/functions';
import { Random } from "random-js";
import * as PACKAGE from "./../../package.json";

const TIME_ZONE = 'America/New_York';

interface Solution {
  word: string;
  sequence: number;
}

const handler: Handler = async (event, context) => {

  // PERIODIC WORD
  const baseDate = startOfDay(new Date(2022, 1, 3, 0, 0));
  const now = new Date();
  const tomorrow = startOfDay(addDays(now, 1));

  // let baseDate = zonedTimeToUtc(baseDate, 'UTC');
  // let now = zonedTimeToUtc(now, 'UTC');
  // let tomorrow = zonedTimeToUtc(tomorrow, 'UTC');

  const getWordOfTheDay = (baseDate: any, targetDate: any = tomorrow) => {
    const idx = differenceInDays(targetDate, baseDate);
    console.log(idx, `difference`, baseDate.toISOString(), targetDate.toISOString());
    return { word: DICTIONARY[idx], sequence: idx };
  };

  const periodicWord = getWordOfTheDay(baseDate, tomorrow);

  // function to randomize
  const randomWord = (): Solution => {
    const idx = new Random().integer(0, DICTIONARY.length);
    return { word: DICTIONARY[idx], sequence: idx };
  }

  const rawQuery = event.rawQuery;
  const chooseRandom = randomWord();

  /**
   * Periodic for Daily Word in Sequence, else Random
   * to send plaintext btoa(word), use base64.decode(word)
   * @returns proper word in context
   */
  const bodyText = () => {
    const sequenceIdx = Number(rawQuery.split('sequenceIdx=')[1]);
    if (sequenceIdx  > 0) {
      return {
        word: DICTIONARY[sequenceIdx],
        sequence: `${sequenceIdx}`,
        action: 'random',
        version: PACKAGE.version,
        dates: [
          baseDate,
          now,
          tomorrow,
        ],
        // process: process.env
      };
    } else if (rawQuery.includes('rando=true')) {
      return {
        word: chooseRandom.word,
        sequence: chooseRandom.sequence,
        action: 'random',
        version: PACKAGE.version,
        dates: [
          baseDate,
          now,
          tomorrow,
        ],
        // process: process.env
      };
    } else {
      return {
        word: periodicWord.word,
        sequence: periodicWord.sequence,
        action: 'periodic',
        version: PACKAGE.version,
        dates: [
          baseDate,
          now,
          tomorrow,
        ],
        // process: process.env
      };
    }
  }
  return {
    statusCode: 200,
    body: JSON.stringify(bodyText())
  };
};

export { handler };
