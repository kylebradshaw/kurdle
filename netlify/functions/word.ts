import { DICTIONARY } from './dict';
import { Handler,  } from '@netlify/functions';
import * as base64 from 'base-64';
import { Random } from "random-js";

// https://flaviocopes.com/netlify-functions-env-variables/
const { CACHED_COMMIT_REF  } = process.env;

interface Solution {
  word: string;
  sequence: number;
}

const handler: Handler = async (event, context) => {

  // PERIODIC WORD
  const todaysDate = new Date();
  const baseDate = new Date(2022, 1, 4, 0, 0, 0, 0);

  const getDateDifference = (then: any, now: any) => {
    const origin = new Date(then);
    const diff = new Date(now).setHours(0, 0, 0, 0) - origin.setHours(0, 0, 0, 0);
    return Math.floor(diff / 864e5)
  }

  const callGetDateDifference = (todaysDate: any) =>{
    const dateDiff = getDateDifference(baseDate, todaysDate);
    return dateDiff;
  }

  const getWordOfTheDay = (today: any) => {
    let s = callGetDateDifference(today);
    return {word: DICTIONARY[s], sequence: s};
  }

  const today = new Date();
  today.setDate(today.getDate() + 1);

  // function to restrict the index to a 24-hour time frame. (incrementing)
  const periodicWord = getWordOfTheDay(today);

  // function to randomize
  const randomWord = (): Solution => {
    const idx = new Random().integer(0, DICTIONARY.length);
    return {word: DICTIONARY[idx], sequence: idx};
  }

  const rawQuery = event.rawQuery;
  const chooseRandom = randomWord();


  /**
   * Periodic for Daily Word in Sequence, else Random
   * to send plaintext btoa(word), use base64.decode(word)
   * @returns proper word in context
   */
  const bodyText = () => {
    if (rawQuery.includes('rando')) {
      return {
        word: chooseRandom.word,
        sequence: chooseRandom.sequence,
        action: 'random',
        cache: `k4e7e9j10??${CACHED_COMMIT_REF.slice(0, 5)}`,
      };
    } else {
      return {
        word: periodicWord.word,
        sequence: periodicWord.sequence,
        action: 'periodic',
        cache: `k4e7e9j10??${CACHED_COMMIT_REF.slice(0, 5)}`,
      };
    }
  }
  return {
    statusCode: 200,
    body: JSON.stringify(bodyText())
  };
};

export { handler };
