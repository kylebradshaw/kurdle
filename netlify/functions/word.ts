import { DICTIONARY } from './dict';
import { Handler } from '@netlify/functions';
import * as base64 from 'base-64';

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
    return getDateDifference(todaysDate, baseDate);
  }

  const getWordOfTheDay = (today: any) => {
    let s = callGetDateDifference(today);
    return DICTIONARY[s];
  }

  const today = new Date();
  today.setDate(today.getDate() + 1);

  // function to restrict the index to a 24-hour time frame. (incrementing)
  const periodicWord = getWordOfTheDay(today);

  // function to randomize
  const randomWord = (index?: number): string => {
    return (index) ? DICTIONARY[index] : DICTIONARY[Math.floor(Math.random() * DICTIONARY.length)];
  }

  const rawQuery = event.rawQuery;
  const chooseRandom = randomWord();

  return {
    statusCode: 200,
    body: JSON.stringify({
      word: (rawQuery.includes('rando')) ? chooseRandom : periodicWord,
      wordText: (rawQuery.includes('rando')) ? base64.decode(chooseRandom) : base64.decode(periodicWord),
      // context,
      // event
     }),
  };
};

export { handler };
