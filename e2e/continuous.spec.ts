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

test('app loads without JS errors', { tag: '@continuous' }, async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));
  await page.reload();
  await page.waitForSelector('app-keyboard', { timeout: 10_000 });
  const criticalErrors = errors.filter(e => !e.includes('zone.js'));
  expect(criticalErrors).toHaveLength(0);
});

test('typing and submission flow', { tag: '@continuous' }, async ({ page }) => {
  await typeWord(page, WRONG_WORD);
  await page.keyboard.press('Enter');
  // Second row first tile should be empty (no letters typed yet in row 2)
  await expect(page.locator('.letter-row').nth(1).locator('app-letter-block').first()).toBeEmpty({ timeout: 2_000 });
});

test('correct-word win flow', { tag: '@continuous' }, async ({ page }) => {
  await typeWord(page, MOCK_WORD);
  await page.keyboard.press('Enter');
  await expect(page.locator('h1')).toContainText(MOCK_WORD, { timeout: 5_000 });
  await expect(page.locator('.flash')).not.toBeEmpty({ timeout: 5_000 });
});

test('6-round loss flow', { tag: '@continuous' }, async ({ page }) => {
  for (let i = 0; i < 6; i++) {
    await typeWord(page, WRONG_WORD);
    await page.keyboard.press('Enter');
  }
  await expect(page.locator('.flash')).not.toBeEmpty({ timeout: 5_000 });
  await expect(page.locator('h1')).toContainText(MOCK_WORD, { timeout: 5_000 });
});

test('router: / loads game', { tag: '@continuous' }, async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('app-keyboard')).toBeVisible();
  await expect(page.locator('h1')).toContainText('Kurdle');
});

test('router: unknown path redirects to /', { tag: '@continuous' }, async ({ page }) => {
  await page.goto('/nonexistent-route');
  await page.waitForSelector('app-keyboard', { timeout: 10_000 });
  await expect(page.locator('h1')).toContainText('Kurdle');
});

test('on-screen keyboard click appends letter', { tag: '@continuous' }, async ({ page }) => {
  await clickWord(page, 's');
  const firstTile = page.locator('.letter-row').first().locator('app-letter-block').first();
  await expect(firstTile).not.toBeEmpty({ timeout: 2_000 });
});

test('debug mode: typing josie reveals the answer', { tag: '@continuous' }, async ({ page }) => {
  await expect(page.locator('h1')).toContainText('Kurdle');
  await typeWord(page, 'josie');
  await expect(page.locator('h1')).toContainText(MOCK_WORD, { timeout: 3_000 });
});
