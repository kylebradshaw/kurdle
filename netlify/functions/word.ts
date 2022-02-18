// import * as base64 from 'base-64';
import {
  differenceInDays,
} from 'date-fns'
import { DICTIONARY } from './dict';
import { Handler,  } from '@netlify/functions';
import { Random } from "random-js";
import * as PACKAGE from "./../../package.json";

interface Solution {
  word: string;
  sequence: number;
}

const handler: Handler = async (event, context) => {

  // PERIODIC WORD
  const baseDate = new Date(Date.UTC(2022,1,3,5,0,0,0));
  let nowTomorrow = new Date(Date.now());
  nowTomorrow.setUTCDate(nowTomorrow.getUTCDate() + 1);
  const midnightTomorrow = new Date(new Date(nowTomorrow).setUTCHours(5,0,0,0));

  const getWordOfTheDay = (baseDate: any, targetDate: any = midnightTomorrow) => {
    const idx = differenceInDays(new Date(targetDate), new Date(baseDate));
    return { word: DICTIONARY[idx], sequence: idx };
  };

  const periodicWord = getWordOfTheDay(baseDate, midnightTomorrow);

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
          midnightTomorrow,
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
          midnightTomorrow,
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
          midnightTomorrow,
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
