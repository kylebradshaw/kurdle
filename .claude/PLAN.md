# Kurdle — Angular 13 → 21 Migration Plan

> **Goal:** Modernize Kurdle to Angular 21 with standalone components, signals, `inject()`, new control flow, Vitest at 100% coverage, ESBuild, and updated Netlify functions.

---

## Task 0 — Dependency Upgrade & Build Tooling

Upgrade all packages from Angular 13 to Angular 21. Switch from Webpack to ESBuild (Angular CLI's default application builder). Remove Karma/Jasmine. Replace `logrocket`, `ng-navigator-share`, and `@bcodes/ngx-theme-service` with native equivalents (these libraries have no Angular 21 counterparts or are abandonware).

### Acceptance Criteria

- [x] `package.json` has `@angular/*` at `^21.x`, `rxjs ^7.8`, `zone.js ^0.15`, `typescript ^5.9`
- [x] `angular.json` uses `@angular-devkit/build-angular:application` builder (ESBuild)
- [x] `karma`, `karma-*`, `jasmine-core`, `@types/jasmine` are removed from `devDependencies`
- [x] `vitest`, `@vitest/coverage-v8`, `@analogjs/vitest-angular` (or `@analogjs/platform`) are in `devDependencies`
- [x] `npm run build` completes without errors
- [x] `logrocket` replaced with `window.plausible` only (already partially in place); `ng-navigator-share` replaced with native `navigator.share`; `@bcodes/ngx-theme-service` replaced with a signals-based theme service
- [x] git commit created: `feat: task 0 - dependency upgrade & build tooling`

**Completion signal:** When all acceptance criteria above are satisfied and the git commit exists, output exactly: `<promise>TESTS COMPLETE</promise>`
---

## Task 1 — Vitest Configuration & Test Infrastructure

Set up Vitest with Angular support. Configure coverage to enforce 100% across branches, functions, lines, and statements. Establish the test environment so that all subsequent tasks can verify as they go.

### Acceptance Criteria

- [x] `vite.config.mts` exists at project root with `@analogjs/vite-plugin-angular`, jsdom environment, and coverage thresholds set to `100` for branches/functions/lines/statements
- [x] `src/test-setup.ts` bootstraps Angular test environment for Vitest with zone.js
- [x] `npm test` runs Vitest and exits 0
- [x] `npm run tdd` runs Vitest in watch mode
- [x] `tsconfig.spec.json` is updated to reference `vitest/globals` and `node` types
- [x] CI-style `npm run test:coverage` command exists and enforces the 100% threshold
- [x] git commit created: `feat: task 1 - vitest configuration & test infrastructure`

**Completion signal:** When all acceptance criteria above are satisfied and the git commit exists, output exactly: `<promise>TESTS COMPLETE</promise>`

---

## Task 2 — Models & Helpers (no-framework layer)

Modernize `src/app/models/` and `src/app/helpers/` to strict TypeScript. No Angular APIs here — pure TS modules that are trivially testable.

### Acceptance Criteria

- [x] `models/game.ts`, `models/guess.ts`, `models/notice.ts`, `models/time.ts` use enums with explicit values and are fully typed
- [x] `helpers/utils.ts` exports pure functions; `helpers/index.ts` re-exports cleanly
- [x] `forceRefresh` helper is typed (with `LocationLike` param) and tested
- [x] Vitest unit tests exist for every exported symbol in `models/` and `helpers/`
- [x] Coverage for these files is 100%
- [x] git commit created: `feat: task 2 - models & helpers modernization`

**Completion signal:** When all acceptance criteria above are satisfied and the git commit exists, output exactly: `<promise>TESTS COMPLETE</promise>`

---

## Task 3 — StorageService → Signals-based

Convert `StorageService` from an `@Injectable()` class with constructor-based DI to a modern `Injectable` using `inject()`. Expose reactive state via Angular signals where values are read by components (e.g., `gameState`, `gameMode`, `theme`). Keep localStorage as the persistence layer.

### Acceptance Criteria

- [x] `StorageService` is decorated with `@Injectable({ providedIn: 'root' })`
- [x] Constructor DI is removed; any dependencies use `inject()`
- [x] `gameState`, `gameMode`, and `theme` are exposed as `Signal<T>` via `signal()` backed by localStorage
- [x] `set()` / `get()` / `remove()` / `clear()` remain as the raw API, but signal values update when `set()` is called with the corresponding key
- [x] `StorageKey` enum is unchanged (public API parity)
- [x] `storage.service.spec.ts` is migrated to Vitest and tests signal reactivity, `clear()` preservation of hotfix/version/theme/completedSequenceUtc keys
- [x] Coverage for `storage.service.ts` is 100%
- [ ] git commit created: `feat: task 3 - storage service modernization`

**Completion signal:** When all acceptance criteria above are satisfied and the git commit exists, output exactly: `<promise>TESTS COMPLETE</promise>`

---

## Task 4 — GameService → Signals-based

Convert `GameService` to standalone injectable using `inject()`. The `solver()` algorithm is pure logic — extract it to a tested pure function. Keep `directUserFlow()` and `reloadGame()` as service methods.

### Acceptance Criteria

- [ ] `GameService` uses `inject(StorageService)` and `inject(WordService)` instead of constructor params
- [ ] `solver()` logic is extracted to a pure function `solveGuess(sequence, decodedWord): GuessClass[]` in `helpers/` and re-exported from `GameService` for backwards compat
- [ ] `directUserFlow()` and `reloadGame()` are tested with mocked storage/word services
- [ ] `game.service.spec.ts` migrated to Vitest; all edge cases for duplicate-letter resolution covered
- [ ] Coverage for `game.service.ts` and `solveGuess` is 100%
- [ ] git commit created: `feat: task 4 - game service modernization`

**Completion signal:** When all acceptance criteria above are satisfied and the git commit exists, output exactly: `<promise>TESTS COMPLETE</promise>`

---

## Task 5 — WordService → Signals + HttpClient (inject-based)

Convert `WordService` to use `inject(HttpClient)`. Expose `currentWord` and `decodedWord` as signals. The `seedWordFromFunc()` observable pipeline remains RxJS (HTTP is naturally observable), but results are written into signals.

### Acceptance Criteria

- [ ] `WordService` uses `inject(HttpClient)` instead of constructor param
- [ ] `seedWordFromFunc()` still returns `Observable<FuncWord>` (no breaking change)
- [ ] `inDict()`, `decode()`, `repeatedCharacters()`, `getAlphabetKey()`, `numberToLetters()` are fully tested pure-function style
- [ ] `word.service.spec.ts` migrated to Vitest with HTTP mocked via `provideHttpClientTesting()`
- [ ] Coverage for `word.service.ts` is 100%
- [ ] git commit created: `feat: task 5 - word service modernization`

**Completion signal:** When all acceptance criteria above are satisfied and the git commit exists, output exactly: `<promise>TESTS COMPLETE</promise>`

---

## Task 6 — StatsService

`StatsService` is a stub with broken `ngOnInit` (services don't have lifecycle hooks). Implement it properly: track wins/losses/streaks from localStorage, expose stats as a signal.

### Acceptance Criteria

- [ ] `ngOnInit` removed; any initialization done in constructor body or via `effect()`
- [ ] `StatsService` exposes a `stats` signal of type `GameStats` (define the interface)
- [ ] `recordGame(won: boolean, round: number, mode: GameMode): void` writes to localStorage and updates the signal
- [ ] `stats.service.spec.ts` migrated to Vitest and covers all stat aggregation logic
- [ ] Coverage for `stats.service.ts` is 100%
- [ ] git commit created: `feat: task 6 - stats service modernization`

**Completion signal:** When all acceptance criteria above are satisfied and the git commit exists, output exactly: `<promise>TESTS COMPLETE</promise>`
---

## Task 7 — ThemeService (replace `@bcodes/ngx-theme-service`)

The `@bcodes/ngx-theme-service` package is not compatible with Angular 21. Replace with a native signals-based `ThemeService`.

### Acceptance Criteria

- [ ] `ThemeService` is a new `@Injectable({ providedIn: 'root' })` class in `src/app/services/`
- [ ] It exposes `theme = signal<'light' | 'dark'>('light')` backed by `StorageService`
- [ ] `toggle()` method switches theme and updates the `<html>` element's `data-theme` attribute
- [ ] `@bcodes/ngx-theme-service` is completely removed from `package.json` and all imports
- [ ] `theme.service.spec.ts` covers toggle, persistence, and initialization from storage
- [ ] Coverage for `theme.service.ts` is 100%
- [ ] git commit created: `feat: task 7 - theme service modernization`

**Completion signal:** When all acceptance criteria above are satisfied and the git commit exists, output exactly: `<promise>TESTS COMPLETE</promise>`

---

## Task 8 — Standalone Components: LetterBlockComponent

Convert `LetterBlockComponent` to standalone. Replace `@Input()` with signal inputs (`input()`). Apply new Angular control flow in template.

### Acceptance Criteria

- [ ] `@Component({ standalone: true, ... })`
- [ ] All `@Input()` decorators replaced with `input<T>()` signal inputs
- [ ] Template uses `@if` / `@for` instead of `*ngIf` / `*ngFor` (if applicable)
- [ ] `letter-block.component.spec.ts` migrated to Vitest; renders correctly for all `GuessClass` values
- [ ] Coverage for component ts+html logic is 100%
- [ ] git commit created: `feat: task 8 - letter block component modernization`

**Completion signal:** When all acceptance criteria above are satisfied and the git commit exists, output exactly: `<promise>TESTS COMPLETE</promise>`

---

## Task 9 — Standalone Components: CountdownComponent

Convert `CountdownComponent` to standalone. Timer logic should use `signal()` + `effect()` or RxJS interval piped into a signal.

### Acceptance Criteria

- [ ] `@Component({ standalone: true, ... })`
- [ ] All `@Input()` replaced with `input<T>()`
- [ ] Any `@Output()` replaced with `output<T>()`
- [ ] Countdown timer uses `signal<string>()` updated on interval; interval cleaned up `onDestroy`
- [ ] Template uses new control flow syntax
- [ ] `countdown.component.spec.ts` migrated to Vitest; timer ticks and cleanup tested with fake timers
- [ ] Coverage is 100%
- [ ] git commit created: `feat: task 9 - countdown component modernization`

**Completion signal:** When all acceptance criteria above are satisfied and the git commit exists, output exactly: `<promise>TESTS COMPLETE</promise>`
---

## Task 10 — Standalone Components: KeyboardComponent

Convert `KeyboardComponent` to standalone. Replace `@Input`/`@Output` with signal inputs/outputs.

### Acceptance Criteria

- [ ] `@Component({ standalone: true, ... })`
- [ ] `alphabetKey` input is `input<AlphaDict>({})`
- [ ] Key-click event uses `output<string>()` (replaces `@Output() EventEmitter`)
- [ ] Template uses new control flow syntax
- [ ] `keyboard.component.spec.ts` migrated to Vitest; all key states and emit paths tested
- [ ] Coverage is 100%
- [ ] git commit created: `feat: task 10 - keyboard component modernization`

**Completion signal:** When all acceptance criteria above are satisfied and the git commit exists, output exactly: `<promise>TESTS COMPLETE</promise>`
---

## Task 11 — Standalone Components: MenuComponent

Convert `MenuComponent` to standalone. Remove `ThemeService` constructor injection; use `inject()`.

### Acceptance Criteria

- [ ] `@Component({ standalone: true, ... })`
- [ ] Uses `inject(ThemeService)` and `inject(StorageService)`
- [ ] Theme toggle calls the new `ThemeService.toggle()`
- [ ] `menu.component.spec.ts` migrated to Vitest
- [ ] Coverage is 100%
- [ ] git commit created: `feat: task 11 - menu component modernization`

**Completion signal:** When all acceptance criteria above are satisfied and the git commit exists, output exactly: `<promise>TESTS COMPLETE</promise>`
---

## Task 12 — Standalone Components: GameComponent (largest task)

Convert `GameComponent` to standalone. This is the main orchestrator — migrate from constructor DI to `inject()`, replace all `@Input`/`@Output` patterns, use signals for all reactive state, replace `ng-navigator-share` with native `navigator.share`, and apply new control flow in the template.

### Acceptance Criteria

- [ ] `@Component({ standalone: true, imports: [RouterModule, LetterBlockComponent, KeyboardComponent, CountdownComponent, MenuComponent], ... })`
- [ ] Constructor params replaced with `inject()` calls at the top of the class
- [ ] `board`, `classBoard`, `alphabetKey`, `notice`, `endState`, `debugMode` converted to `signal<T>()`
- [ ] `combinedBoard` converted to `computed()`
- [ ] `play` getter/setter converted to a `signal<string>('')` with a `WritableSignal`
- [ ] `@HostListener('window:keyup')` kept (this is still valid in standalone components)
- [ ] `ngNavigatorShareService` replaced with direct `navigator.share()` call; guarded by `'share' in navigator`
- [ ] Template updated to use `@if` / `@for` / `@switch` new control flow
- [ ] `game.component.spec.ts` migrated to Vitest; all public methods and keyboard flows tested
- [ ] `initBandages()` hotfix for sequence 15 is kept but tested
- [ ] Coverage is 100%
- [ ] git commit created: `feat: task 12 - game component modernization`

**Completion signal:** When all acceptance criteria above are satisfied and the git commit exists, output exactly: `<promise>TESTS COMPLETE</promise>`

---

## Task 13 — AppComponent & Bootstrap (standalone root)

Remove `AppModule` and `AppRoutingModule`. Bootstrap the app with `bootstrapApplication()`. Define routes as a plain `Routes` array passed to `provideRouter()`.

### Acceptance Criteria

- [ ] `app.module.ts` deleted
- [ ] `app-routing.module.ts` deleted
- [ ] `main.ts` uses `bootstrapApplication(AppComponent, { providers: [...] })`
- [ ] `AppComponent` is `standalone: true` and imports `RouterOutlet`
- [ ] Providers include: `provideRouter(routes)`, `provideHttpClient()`, `provideAnimationsAsync()`, theme config
- [ ] `LogRocket` initialization in `AppComponent.ngOnInit` is preserved (or replaced with Plausible-only if desired)
- [ ] `app.component.spec.ts` migrated to Vitest
- [ ] Coverage is 100%
- [ ] git commit created: `feat: task 13 - app component & bootstrap modernization`

**Completion signal:** When all acceptance criteria above are satisfied and the git commit exists, output exactly: `<promise>TESTS COMPLETE</promise>`

---

## Task 14 — Netlify Functions: Modernize to ESM + latest `@netlify/functions`

Update `netlify/functions/word.ts` and its tsconfig to use the latest `@netlify/functions` API (`Handler` type from v2+), proper ESM imports, and current TypeScript.

### Acceptance Criteria

- [ ] `@netlify/functions` updated to `^2.x` in `package.json`
- [ ] `word.ts` uses named export `export default` handler pattern (Netlify Functions v2)
- [ ] `netlify/functions/tsconfig.json` targets `ES2022` with `module: NodeNext`
- [ ] Dictionary files (`plural-past-dict.ts`, etc.) are valid ESM modules
- [ ] The function can be invoked locally via `netlify dev` without errors (manual verification step)
- [ ] A unit test for the `word.ts` handler logic (word selection, sequence index, date calculation) exists and passes under Vitest
- [ ] Coverage for `word.ts` handler logic is 100%
- [ ] git commit created: `feat: task 14 - netlify functions modernization`

**Completion signal:** When all acceptance criteria above are satisfied and the git commit exists, output exactly: `<promise>TESTS COMPLETE</promise>`

---

## Task 15 — Final: 100% Coverage Sweep & Cleanup

Run the full test suite with coverage. Fix any gaps. Remove dead code. Update `CLAUDE.md` with new commands.

### Acceptance Criteria

- [ ] `npm run test:coverage` passes with 100% across all metrics (branches, functions, lines, statements)
- [ ] No `TODO`, `FIXME`, or commented-out debug code (e.g., `btoa('bowel')` lines) remains in production code
- [ ] `src/test.ts` (Karma entry) deleted
- [ ] `src/polyfills.ts` reviewed — remove anything Angular 21 handles natively
- [ ] `angular.json` has no references to `karma` or `jasmine`
- [ ] `.claude/CLAUDE.md` updated: new commands (`npm test`, `npm run test:coverage`, `npm run tdd`), removed Node 16 requirement (Angular 21 requires Node 20+), updated architecture notes to reflect standalone/signals
- [ ] `npm run build` produces a clean production bundle
- [ ] `npm run start-pwa` works end-to-end
- [ ] git commit created: `feat: task 15 - final coverage sweep & cleanup`

**Completion signal:** When all acceptance criteria above are satisfied and the git commit exists, output exactly: `<promise>TESTS COMPLETE</promise>`

---

## Running Order for Ralph Loop

```
Task 0 → Task 1 → Task 2 → Task 3 → Task 4 → Task 5 → Task 6 → Task 7
→ Task 8 → Task 9 → Task 10 → Task 11 → Task 12 → Task 13 → Task 14 → Task 15
```

Each task: implement → write/migrate tests → verify coverage → commit → next.
