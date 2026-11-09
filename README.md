# Horse Racing

A responsive browser game: generate a six-round schedule from a roster of 20 horses, run the races with lane animation, and read finishing orders after each round.

**Live demo:** [https://onurcem.github.io/horse-racing-game/](https://onurcem.github.io/horse-racing-game/) (after GitHub Pages is enabled for this repository).

## How to play

1. Open the app. Twenty horses load automatically with stable numbers 1–20.
2. Click **Generate** to draw ten horses per round for distances 1,200–2,200 m.
3. Click **Start** to run all six rounds in order. **Pause** / **Resume** freezes and continues the current race.
4. **Round time** under the controls shows the current round's elapsed time. Results appear after every round with each horse's finish time; the game ends with **Race complete** after round six.
5. **Generate** during **Ready**, **Paused**, or **Complete** builds a new schedule from the same roster and clears prior results.

## Scripts

| Command                      | Description                                          |
| ---------------------------- | ---------------------------------------------------- |
| `npm run dev`                | Dev server (base `/`)                                |
| `npm run build`              | Production build (`VITE_BASE` optional, default `/`) |
| `npm run preview`            | Preview the production build                         |
| `npm run type-check`         | Type-check without emitting                          |
| `npm run lint`               | ESLint                                               |
| `npm run format`             | Prettier                                             |
| `npm run format:check`       | Prettier check (run in CI)                           |
| `npm run test`               | Vitest unit suite                                    |
| `npm run test:e2e`           | Playwright browser flows                             |
| `npm run test:visual`        | Visual snapshots in the Playwright Docker image      |
| `npm run test:visual:local`  | Visual snapshots on the host (Chromium required)     |
| `npm run test:visual:update` | Refresh baselines inside Docker                      |
| `npm run profile`            | Profile a running round inside Docker (see below)    |

For GitHub Pages, build with `VITE_BASE=/horse-racing-game/ npm run build`.

## Project layout

Pure game logic lives under `src/domain` and `src/race` (no Vue imports). Pinia holds discrete game state; `useRaceRunner` drives animation via `requestAnimationFrame` without storing per-frame data in the store. See `IMPLEMENTATION_PLAN.md` for the full structure.

Builds made with `VITE_ENABLE_TEST_HOOKS=1` accept `?seed=` for a deterministic roster and `?test=1` for a manual race clock exposed as `window.__HORSE_RACING_TEST__`. Playwright sets the flag when it builds the app; the deployed build has no test hooks. If you reuse a local preview server for Playwright, start it from a build made with the flag.

## Assumptions

- **Horse pool:** The brief’s 1–20 range is implemented as exactly twenty horses with IDs 1–20, unique named colors, and conditions 1–100. The roster is created once per page load; reload for a new draw.
- **Results timing:** All ten positions for a round are published together when the last horse finishes; the track holds ~800 ms before the next round loads.
- **Pause / resume:** Pause stops the active race clock; resume continues from the same progress (or the inter-round hold if paused between rounds).
- **Generate while paused:** Starting a new schedule abandons the in-progress game, clears results, and returns to **Ready**.
- **Pace curves:** Independent segment weights per horse produce lead changes during a round without changing finish-time ranking.
- **Lead changes:** Outcomes are not obvious from the first animation frame; mid-race overtakes are intentional.
- **Reduced motion:** When the system asks for reduced motion, horses move in 10% steps instead of gliding, and still land exactly on the finish line.

## Performance

`npm run profile` builds the production bundle (no test hooks), serves it, and runs `scripts/profile-race.mjs` in the pinned Playwright container. For each CPU throttle rate it starts round 1, samples every frame for 4 s, then pauses and resumes.

**Conditions (9 Nov 2026):** Headless Chromium 141.0.7390.37 from `mcr.microsoft.com/playwright:v1.56.1-noble`, Docker on an Apple Silicon Mac (4 arm64 cores), 390 × 844 viewport at 3× device scale with touch, CPU throttling through the DevTools protocol (`Emulation.setCPUThrottlingRate`).

| CPU throttle | Frame p50 / p95 / max | Frames > 25 ms | Long animation frames | Layouts in 4 s | Style recalcs in 4 s | Pause → frame | Resume → frame |
| ------------ | --------------------- | -------------- | --------------------- | -------------- | -------------------- | ------------- | -------------- |
| 1×           | 16.7 / 16.7 / 16.8 ms | 0 of 280       | 0                     | 4 (1.2 ms)     | 244                  | 18 ms         | 30 ms          |
| 4×           | 16.7 / 16.7 / 16.8 ms | 0 of 282       | 1                     | 5 (3.2 ms)     | 245                  | 23 ms         | 19 ms          |
| 6×           | 16.7 / 16.7 / 16.8 ms | 0 of 284       | 1                     | 5 (8.0 ms)     | 246                  | 30 ms         | 23 ms          |

**Findings**

- The race holds 60 fps at every throttle rate. Only transforms change per frame, for both the horses and the round timer's digits; the roughly 60 style recalculations per second are those transform updates. The 4–5 layouts in 4 s are the screen-reader copy of the timer, which updates once per second.
- **Round timer.** A first version wrote the time as text every frame. Any text change forces a layout pass, so it ran 241 layouts in 4 s (75–188 ms of layout work, depending on throttle), and `contain: strict` on the value did not reduce it. Each digit is now a 0–9 strip in a clipped one-character box, moved with `translateY` only when that digit changes, which brought layouts back to 4–5. The visible digits are `aria-hidden`; a visually hidden `role="timer"` element (implicit `aria-live="off"`) carries the value, updated once per second while running and exactly when the clock stops.
- The long animation frame at 4× and 6× is the Generate render, which builds the schedule and draws the ten lanes just before Start. In earlier runs during development, a single 33–50 ms frame occasionally appeared mid-race; it did not repeat within the round.
- Pause and resume reach the screen within about two frames (20–33 ms, measured from the click to the second frame after it), and horse positions stay fixed while paused.
- Limits: headless Chromium in Docker composites in software and caps animation frames at 60 Hz, and CPU throttling doesn't model a phone's GPU or thermal throttling. Check on a real mid-range phone before relying on these numbers for older devices.
