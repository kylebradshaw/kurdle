// import * as base64 from 'base-64';
import {
  differenceInDays,
  addDays,
  startOfDay
} from 'date-fns'
import { DICTIONARY } from './dict';
import { Handler,  } from '@netlify/functions';
import { Random } from "random-js";

// https://flaviocopes.com/netlify-functions-env-variables/
const { COMMIT_REF } = process.env;
// console.log(process.env, `COMMIT_REF used to cache-bust`);

interface Solution {
  word: string;
  sequence: number;
}

const handler: Handler = async (event, context) => {

  // PERIODIC WORD
  const baseDate = startOfDay(new Date(2022, 1, 3, 0, 0)); // 2022-02-03
  const now = new Date();
  const tomorrow = startOfDay(addDays(now, 1));

  const getWordOfTheDay = (baseDate: any, targetDate: any = tomorrow) => {
    const idx = differenceInDays(targetDate, baseDate);
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
    const hash = `${COMMIT_REF}`;
    if (sequenceIdx  > 0) {
      return {
        word: DICTIONARY[sequenceIdx],
        sequence: `${sequenceIdx}`,
        action: 'random',
        cache: hash,
        dates: [
          baseDate,
          now,
          tomorrow,
        ]
      };
    } else if (rawQuery.includes('rando=true')) {
      return {
        word: chooseRandom.word,
        sequence: chooseRandom.sequence,
        action: 'random',
        cache: hash,
        dates: [
          baseDate,
          now,
          tomorrow,
        ]
      };
    } else {
      return {
        word: periodicWord.word,
        sequence: periodicWord.sequence,
        action: 'periodic',
        cache: hash,
        dates: [
          baseDate,
          now,
          tomorrow,
        ]
      };
    }
  }
  return {
    statusCode: 200,
    body: JSON.stringify(bodyText())
  };
};

export { handler };
