import { test, expect } from '@playwright/test';
import { mockWordApi, typeWord, clickWord, waitForGameReady, MOCK_WORD, WRONG_WORD } from './helpers';

test.beforeEach(async ({ page }) => {
  await mockWordApi(page);
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector('app-keyboard', { timeout: 10_000 });
  await waitForGameReady(page);
});

test('app shell loads', { tag: '@stopgap' }, async ({ page }) => {
  await expect(page.locator('app-game')).toBeVisible();
  await expect(page.locator('main')).toBeVisible();
  await expect(page.locator('app-keyboard')).toBeVisible();
  await expect(page.locator('h1')).toContainText('Kurdle');
});

test('board renders 6 rows × 5 tiles', { tag: '@stopgap' }, async ({ page }) => {
  await expect(page.locator('.letter-row')).toHaveCount(6);
  await expect(page.locator('app-letter-block')).toHaveCount(30);
});

test('typing populates tiles', { tag: '@stopgap' }, async ({ page }) => {
  await typeWord(page, 'hello');
  const firstRowTiles = page.locator('.letter-row').first().locator('app-letter-block');
  // Wait for all 5 tiles to fill
  for (let i = 0; i < 5; i++) {
    await expect(firstRowTiles.nth(i)).not.toBeEmpty({ timeout: 2_000 });
  }
});

test('backspace clears a tile', { tag: '@stopgap' }, async ({ page }) => {
  await typeWord(page, 'hel');
  await page.keyboard.press('Backspace');
  const firstRowTiles = page.locator('.letter-row').first().locator('app-letter-block');
  // 3rd tile should be empty after backspace
  await expect(firstRowTiles.nth(2)).toBeEmpty({ timeout: 2_000 });
  // First two should still have content
  await expect(firstRowTiles.nth(0)).not.toBeEmpty();
  await expect(firstRowTiles.nth(1)).not.toBeEmpty();
});

test('short guess rejected on Enter', { tag: '@stopgap' }, async ({ page }) => {
  await typeWord(page, 'hel');
  await page.keyboard.press('Enter');
  const flashText = await page.locator('.flash').textContent();
  expect(flashText?.trim()).toBe('');
  await expect(page.locator('.letter-row')).toHaveCount(6);
});

test('unknown word rejected with notice', { tag: '@stopgap' }, async ({ page }) => {
  await typeWord(page, 'zzzzz');
  await page.keyboard.press('Enter');
  await expect(page.locator('.flash')).toContainText('not the dictionary');
});

test('correct guess wins', { tag: '@stopgap' }, async ({ page }) => {
  await typeWord(page, MOCK_WORD);
  await page.keyboard.press('Enter');
  // decodedWord appears in h1 (lowercase), endState = true
  await expect(page.locator('h1')).toContainText(MOCK_WORD, { timeout: 5_000 });
  await expect(page.locator('.flash')).not.toBeEmpty({ timeout: 5_000 });
});

test('wrong guess advances row', { tag: '@stopgap' }, async ({ page }) => {
  await typeWord(page, WRONG_WORD);
  await page.keyboard.press('Enter');
  // Second row's tiles should all be empty after the first guess
  const secondRow = page.locator('.letter-row').nth(1);
  await expect(secondRow.locator('app-letter-block').first()).toBeEmpty({ timeout: 2_000 });
});

test('6 wrong guesses loses', { tag: '@stopgap' }, async ({ page }) => {
  for (let i = 0; i < 6; i++) {
    await typeWord(page, WRONG_WORD);
    await page.keyboard.press('Enter');
  }
  await expect(page.locator('.flash')).not.toBeEmpty({ timeout: 5_000 });
  await expect(page.locator('h1')).toContainText(MOCK_WORD, { timeout: 5_000 });
});

test('theme toggle changes data-theme', { tag: '@stopgap' }, async ({ page }) => {
  await page.locator('.hamburger').click();
  const initialTheme = await page.locator('html').getAttribute('data-theme');
  await page.locator('.nav-drawer .t').click();
  const newTheme = await page.locator('html').getAttribute('data-theme');
  expect(newTheme).not.toBe(initialTheme);
});

test('keyboard reflects letter states after guess', { tag: '@stopgap' }, async ({ page }) => {
  await typeWord(page, WRONG_WORD); // 'ratty' — no letters overlap with 'slick'
  await page.keyboard.press('Enter');
  // 'r' key should now have class 'char--used' (letter not in answer)
  const rKey = page.locator('button.keyboard__key', { hasText: 'r' }).first();
  await expect(rKey).toHaveClass(/char--used/, { timeout: 3_000 });
});
