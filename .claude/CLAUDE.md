# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Kurdle is a Wordle-inspired daily word-guessing PWA built with Angular 21. Two modes: **Sequence** (daily word on 24h schedule) and **Random** (random word from dictionary). Live at http://kurdle.netlify.app/.

Node version: 20+ (Angular 21 requirement)

## Commands

```bash
npm start           # Dev server (ng serve)
npm run dev         # Dev server with Netlify functions (netlify dev)
npm run build       # Production build (ESBuild)
npm test            # Run tests (Vitest)
npm run tdd         # Run tests in watch mode
npm run test:coverage # Run tests with 100% coverage enforcement
npm run e2e         # Run Playwright E2E tests
npm run start-pwa   # Build + serve PWA locally on port 8080
```

Run a single test file: `npx vitest run path/to/file.spec.ts`

## Architecture

### Frontend (Angular 21 — Standalone Components + Signals + Zoneless)

All components are `standalone: true` using `inject()` for DI and `@if`/`@for` control flow. The app runs **zoneless** (`provideZonelessChangeDetection()`) — no zone.js polyfill. State that changes outside event handlers (e.g., in `setTimeout` callbacks) must use Angular signals to trigger change detection.

**Components** (`src/app/components/`):
- `game/` — Main orchestrator: keyboard events, board state, guess submission, win/loss handling
- `keyboard/` — On-screen keyboard UI; tracks letter states across guesses. Uses `input()`/`output()` signal APIs
- `letter-block/` — Individual tile for the guess grid. Uses `input()` signal inputs
- `countdown/` — Timer showing time until next daily word. Uses `signal()` for reactive state
- `menu/` — Navigation/settings UI

**Services** (`src/app/services/`):
- `game.service.ts` — Delegates to `solveGuess()` pure function in helpers. Handles game flow via `directUserFlow()` and `reloadGame()`
- `word.service.ts` — Fetches words from Netlify function via `inject(HttpClient)`, base64 encodes/decodes solutions
- `storage.service.ts` — localStorage wrapper with `signal()` for reactive `gameState`, `gameMode`, and `theme`
- `stats.service.ts` — Tracks wins/losses/streaks via `signal<GameStats>()`
- `theme.service.ts` — Signals-based light/dark theme with `data-theme` attribute on `<html>`

**Helpers** (`src/app/helpers/`):
- `utils.ts` — Pure functions: `solveGuess()`, `repeatedCharacters()`, `forceRefresh()`, `nextRoundTime()`

**Models** (`src/app/models/`):
- `game.ts` — `GameState`, `GameMode` enums; game interfaces
- `guess.ts` — `GuessClass` enum (MATCH/MISMATCH/USED/DEFAULT/GHOST), `AlphaDict` type
- `notice.ts` — UI notification types
- `time.ts` — Timing interfaces

**Bootstrap** (`src/main.ts`):
- Uses `bootstrapApplication(AppComponent, { providers: [provideZonelessChangeDetection(), provideRouter(routes), provideHttpClient()] })`
- No NgModules — fully standalone, fully zoneless

### Backend (Netlify Functions v2)

`netlify/functions/word.ts` — Serverless function with `export default` handler pattern. Exported pure functions for testability:
- `getWordOfTheDay()`, `getRandomWord()`, `buildResponse()`, `getMidnightTomorrow()`

`netlify/functions/plural-past-dict.ts` — The canonical word list (base64-encoded).

### Game Flow

1. `directUserFlow()` in game service determines mode (SEQUENCE vs RANDOM)
2. `WordService` calls `/word` endpoint, receives base64-encoded solution
3. User types 5-letter guesses (6 attempts max)
4. `solveGuess()` pure function classifies each letter against the solution
5. Board state persisted to localStorage after each guess
6. On completion: stats recorded, shareable emoji grid generated

### Testing

- **Framework:** Vitest with `@analogjs/vitest-angular`
- **Coverage:** 100% across branches, functions, lines, and statements (enforced by thresholds)
- **Config:** `vite.config.mts` with `@analogjs/vite-plugin-angular`
- **Setup:** `src/test-setup.ts` uses zoneless mode (`setupTestBed({ zoneless: true })`)
- **Patterns:**
  - `v8 ignore start/stop` for SSR guards (`typeof window/document !== 'undefined'`)
  - Test host component pattern for signal inputs
  - `provideHttpClientTesting()` for HTTP mocking
  - `provideRouter([])` replacing deprecated `RouterTestingModule`

### Styling

- Bootstrap 5.1.3 + custom SCSS in `src/stylings/`
- Light/dark theme via signals-based `ThemeService`
- Responsive layout targeting mobile-first

## Key Dependencies

- `lodash`, `date-fns` — utilities
- `random-js` — seeded random for consistent daily words
- `@netlify/functions` ^2.x — serverless function runtime
- `@analogjs/vitest-angular` — Angular Vitest integration
