import * as base64 from 'base-64';
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
  const baseDate = new Date(2022, 1, 4, 0, 0, 0, 0);
  const today = new Date();
  const tomorrow = today.setDate(today.getDate() + 1);

  const dateDifference = (then: any, now: any) => {
    const diff = new Date(now).setHours(0, 0, 0, 0) - new Date(then).setHours(0, 0, 0, 0);
    return Math.floor(diff / 864e5)
  }

  // const callGetDateDifference = (today: any) =>{
  //   const dateDiff = getDateDifference(baseDate, today);
  //   return dateDiff;
  // }

  const getWordOfTheDay = (baseDate: any, targetDay: any = tomorrow) => {
    const idx = dateDifference(baseDate, targetDay);
    return { word: DICTIONARY[idx], sequence: idx};
  }

  // function to restrict the index to a 24-hour time frame. (incrementing)
  const periodicWord = getWordOfTheDay(baseDate, tomorrow);

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
    const sequenceIdx = Number(rawQuery.split('sequenceIdx=')[1]);
    const hash = `${COMMIT_REF}`;
    if (sequenceIdx  > 0) {
      return {
        word: DICTIONARY[sequenceIdx],
        sequence: `${sequenceIdx}`,
        action: 'random',
        cache: `${hash}`,
        dates: [
          baseDate,
          today,
          dateDifference(baseDate, today),
        ]
      };
    } else if (rawQuery.includes('rando=true')) {
      return {
        word: chooseRandom.word,
        sequence: chooseRandom.sequence,
        action: 'random',
        cache: `${hash}`,
        dates: [
          baseDate,
          today,
          dateDifference(baseDate, today),
        ]
      };
    } else {
      return {
        word: periodicWord.word,
        sequence: periodicWord.sequence,
        action: 'periodic',
        cache: `${hash}`,
        dates: [
          baseDate,
          today,
          dateDifference(baseDate, today),
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
