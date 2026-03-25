import { Page } from '@playwright/test';

// 'slick' and 'ratty' are confirmed entries in PLURAL_PAST_DICTIONARY
export const MOCK_WORD = 'slick';
export const MOCK_WORD_B64 = Buffer.from(MOCK_WORD).toString('base64'); // c2xpY2s=

// A valid dict word that is NOT the answer
export const WRONG_WORD = 'ratty'; // cmF0dHk= — first entry in dictionary

// Mock the Netlify word function so tests don't need `netlify dev`
export async function mockWordApi(page: Page, word = MOCK_WORD_B64): Promise<void> {
  await page.route('**/.netlify/functions/word*', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        word,
        sequence: 1,
        mode: 'RANDOM',
        version: '0.14.11',
        dates: [new Date('2022-02-03T05:00:00.000Z'), new Date('2022-03-02T05:00:00.000Z')],
      }),
    });
  });
}

// Type letters using lowercase key presses (avoids Shift interference)
export async function typeWord(page: Page, word: string): Promise<void> {
  for (const char of word.toLowerCase()) {
    await page.keyboard.press(char);
  }
}

// Click on-screen keyboard keys (keyboard renders lowercase keys)
export async function clickWord(page: Page, word: string): Promise<void> {
  for (const char of word.toLowerCase()) {
    await page.locator(`button.keyboard__key`, { hasText: char }).first().click();
  }
}

// Wait for the game to fully initialise (API response received + decodedWord set)
export async function waitForGameReady(page: Page): Promise<void> {
  await page.waitForFunction(() => !!window.localStorage.getItem('word'), { timeout: 5_000 });
}
