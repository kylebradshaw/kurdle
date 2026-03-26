import { test, expect, Page } from '@playwright/test';

/**
 * Visual regression tests that compare local dev against production.
 *
 * These capture screenshots of both environments for each UI state.
 * Production screenshots serve as the reference ("golden") images.
 * Local dev screenshots are compared against them for parity.
 *
 * Run with: npm run e2e:visual
 */

const PROD_URL = 'https://kurdle.netlify.app';
const MOCK_WORD = 'slick';
const MOCK_WORD_B64 = Buffer.from(MOCK_WORD).toString('base64');
const WRONG_WORD = 'ratty';
const VIEWPORT = { width: 390, height: 844 }; // iPhone 14 size for consistent captures

async function mockWordApi(page: Page): Promise<void> {
  await page.route('**/.netlify/functions/word*', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        word: MOCK_WORD_B64,
        sequence: 1,
        mode: 'RANDOM',
        version: '0.14.11',
        dates: [new Date('2022-02-03T05:00:00.000Z'), new Date('2022-03-02T05:00:00.000Z')],
      }),
    });
  });
}

async function typeWord(page: Page, word: string): Promise<void> {
  for (const char of word.toLowerCase()) {
    await page.keyboard.press(char);
    await page.waitForTimeout(50);
  }
}

async function waitForReady(page: Page): Promise<void> {
  await page.waitForSelector('app-keyboard', { timeout: 15_000 });
}

async function setupLocalPage(page: Page): Promise<void> {
  await mockWordApi(page);
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await waitForReady(page);
  await page.waitForTimeout(500); // Allow CSS transitions to settle
}

// --- State 1: Empty board on load ---
test('visual: empty board on load', { tag: '@continuous' }, async ({ browser }) => {
  // Production
  const prodCtx = await browser.newContext({ viewport: VIEWPORT });
  const prodPage = await prodCtx.newPage();
  await prodPage.goto(PROD_URL);
  await waitForReady(prodPage);
  await prodPage.waitForTimeout(1000);
  await prodPage.screenshot({ path: 'e2e/visual/screenshots/01-empty-board-prod.png', fullPage: true });
  await prodCtx.close();

  // Local
  const localCtx = await browser.newContext({ viewport: VIEWPORT });
  const localPage = await localCtx.newPage();
  await setupLocalPage(localPage);
  await localPage.screenshot({ path: 'e2e/visual/screenshots/01-empty-board-local.png', fullPage: true });
  await localCtx.close();
});

// --- State 2: Mid-game with letters typed ---
test('visual: mid-game with letters typed', { tag: '@continuous' }, async ({ browser }) => {
  // Production
  const prodCtx = await browser.newContext({ viewport: VIEWPORT });
  const prodPage = await prodCtx.newPage();
  await prodPage.goto(PROD_URL);
  await waitForReady(prodPage);
  await prodPage.waitForTimeout(500);
  await typeWord(prodPage, 'power');
  await prodPage.waitForTimeout(500);
  await prodPage.screenshot({ path: 'e2e/visual/screenshots/02-mid-game-prod.png', fullPage: true });
  await prodCtx.close();

  // Local
  const localCtx = await browser.newContext({ viewport: VIEWPORT });
  const localPage = await localCtx.newPage();
  await setupLocalPage(localPage);
  await typeWord(localPage, 'power');
  await localPage.waitForTimeout(500);
  await localPage.screenshot({ path: 'e2e/visual/screenshots/02-mid-game-local.png', fullPage: true });
  await localCtx.close();
});

// --- State 3: After guess submission with color feedback ---
test('visual: after guess submission with color feedback', { tag: '@continuous' }, async ({ browser }) => {
  // Production — can't control the word, so just submit a common word
  const prodCtx = await browser.newContext({ viewport: VIEWPORT });
  const prodPage = await prodCtx.newPage();
  await prodPage.goto(PROD_URL);
  await waitForReady(prodPage);
  await prodPage.waitForTimeout(500);
  await typeWord(prodPage, 'power');
  await prodPage.keyboard.press('Enter');
  await prodPage.waitForTimeout(1500);
  await prodPage.screenshot({ path: 'e2e/visual/screenshots/03-guess-submitted-prod.png', fullPage: true });
  await prodCtx.close();

  // Local — mock word is 'slick', type 'power' (no letters match)
  const localCtx = await browser.newContext({ viewport: VIEWPORT });
  const localPage = await localCtx.newPage();
  await setupLocalPage(localPage);
  await typeWord(localPage, 'power');
  await localPage.keyboard.press('Enter');
  await localPage.waitForTimeout(1500);
  await localPage.screenshot({ path: 'e2e/visual/screenshots/03-guess-submitted-local.png', fullPage: true });
  await localCtx.close();
});

// --- State 4: Win state ---
test('visual: win state', { tag: '@continuous' }, async ({ browser }) => {
  // Local only — we can control the answer via mock
  const localCtx = await browser.newContext({ viewport: VIEWPORT });
  const localPage = await localCtx.newPage();
  await setupLocalPage(localPage);
  await typeWord(localPage, MOCK_WORD);
  await localPage.keyboard.press('Enter');
  await localPage.waitForTimeout(1500);
  await localPage.screenshot({ path: 'e2e/visual/screenshots/04-win-state-local.png', fullPage: true });
  await localCtx.close();
});

// --- State 5: Loss state ---
test('visual: loss state', { tag: '@continuous' }, async ({ browser }) => {
  const localCtx = await browser.newContext({ viewport: VIEWPORT });
  const localPage = await localCtx.newPage();
  await setupLocalPage(localPage);
  for (let i = 0; i < 6; i++) {
    await typeWord(localPage, WRONG_WORD);
    await localPage.keyboard.press('Enter');
    await localPage.waitForTimeout(800);
  }
  await localPage.waitForTimeout(1000);
  await localPage.screenshot({ path: 'e2e/visual/screenshots/05-loss-state-local.png', fullPage: true });
  await localCtx.close();
});

// --- State 6: Menu/dropdown expanded ---
test('visual: menu expanded', { tag: '@continuous' }, async ({ browser }) => {
  // Production
  const prodCtx = await browser.newContext({ viewport: VIEWPORT });
  const prodPage = await prodCtx.newPage();
  await prodPage.goto(PROD_URL);
  await waitForReady(prodPage);
  await prodPage.waitForTimeout(500);
  await prodPage.locator('.hamburger').click();
  await prodPage.waitForTimeout(500);
  await prodPage.screenshot({ path: 'e2e/visual/screenshots/06-menu-expanded-prod.png', fullPage: true });
  await prodCtx.close();

  // Local
  const localCtx = await browser.newContext({ viewport: VIEWPORT });
  const localPage = await localCtx.newPage();
  await setupLocalPage(localPage);
  await localPage.locator('.hamburger').click();
  await localPage.waitForTimeout(500);
  await localPage.screenshot({ path: 'e2e/visual/screenshots/06-menu-expanded-local.png', fullPage: true });
  await localCtx.close();
});

// --- State 7: Light theme ---
test('visual: light theme', { tag: '@continuous' }, async ({ browser }) => {
  // Production
  const prodCtx = await browser.newContext({ viewport: VIEWPORT });
  const prodPage = await prodCtx.newPage();
  await prodPage.goto(PROD_URL);
  await waitForReady(prodPage);
  // Ensure light theme
  const prodTheme = await prodPage.locator('html').getAttribute('data-theme');
  if (prodTheme === 'dark') {
    await prodPage.locator('.hamburger').click();
    await prodPage.locator('.nav-drawer .t').click();
    await prodPage.waitForTimeout(300);
    await prodPage.locator('.hamburger').click();
    await prodPage.waitForTimeout(300);
  }
  await prodPage.screenshot({ path: 'e2e/visual/screenshots/07-light-theme-prod.png', fullPage: true });
  await prodCtx.close();

  // Local
  const localCtx = await browser.newContext({ viewport: VIEWPORT });
  const localPage = await localCtx.newPage();
  await setupLocalPage(localPage);
  // Ensure light theme
  const localTheme = await localPage.locator('html').getAttribute('data-theme');
  if (localTheme === 'dark') {
    await localPage.locator('.hamburger').click();
    await localPage.locator('.nav-drawer .t').click();
    await localPage.waitForTimeout(300);
    await localPage.locator('.hamburger').click();
    await localPage.waitForTimeout(300);
  }
  await localPage.screenshot({ path: 'e2e/visual/screenshots/07-light-theme-local.png', fullPage: true });
  await localCtx.close();
});

// --- State 8: Dark theme ---
test('visual: dark theme', { tag: '@continuous' }, async ({ browser }) => {
  // Production
  const prodCtx = await browser.newContext({ viewport: VIEWPORT });
  const prodPage = await prodCtx.newPage();
  await prodPage.goto(PROD_URL);
  await waitForReady(prodPage);
  // Switch to dark
  await prodPage.locator('.hamburger').click();
  await prodPage.waitForTimeout(300);
  const prodTheme = await prodPage.locator('html').getAttribute('data-theme');
  if (prodTheme !== 'dark') {
    await prodPage.locator('.nav-drawer .t').click();
    await prodPage.waitForTimeout(300);
  }
  await prodPage.locator('.hamburger').click();
  await prodPage.waitForTimeout(500);
  await prodPage.screenshot({ path: 'e2e/visual/screenshots/08-dark-theme-prod.png', fullPage: true });
  await prodCtx.close();

  // Local
  const localCtx = await browser.newContext({ viewport: VIEWPORT });
  const localPage = await localCtx.newPage();
  await setupLocalPage(localPage);
  await localPage.locator('.hamburger').click();
  await localPage.waitForTimeout(300);
  const localTheme = await localPage.locator('html').getAttribute('data-theme');
  if (localTheme !== 'dark') {
    await localPage.locator('.nav-drawer .t').click();
    await localPage.waitForTimeout(300);
  }
  await localPage.locator('.hamburger').click();
  await localPage.waitForTimeout(500);
  await localPage.screenshot({ path: 'e2e/visual/screenshots/08-dark-theme-local.png', fullPage: true });
  await localCtx.close();
});
