# Horse Racing

A responsive browser game: generate a six-round schedule from a roster of 20 horses, run the races with lane animation, and read finishing orders after each round.

**Live demo:** [https://onurcem.github.io/horse-racing-game/](https://onurcem.github.io/horse-racing-game/) (after GitHub Pages is enabled for this repository).

## How to play

1. Open the app. Twenty horses load automatically with stable numbers 1–20.
2. Click **Generate** to draw ten horses per round for distances 1,200–2,200 m.
3. Click **Start** to run all six rounds in order. **Pause** / **Resume** freezes and continues the current race.
4. Results appear after every round; the game ends with **Race complete** after round six.
5. **Generate** during **Ready**, **Paused**, or **Complete** builds a new schedule from the same roster and clears prior results.

## Scripts

| Command                    | Description                                              |
| -------------------------- | -------------------------------------------------------- |
| `npm run dev`              | Dev server (base `/`)                                    |
| `npm run build`            | Production build (`VITE_BASE` optional, default `/`)     |
| `npm run preview`          | Preview the production build                             |
| `npm run type-check`       | Type-check without emitting                              |
| `npm run lint`             | ESLint                                                   |
| `npm run format`           | Prettier                                                 |
| `npm run test`             | Vitest unit suite                                        |
| `npm run test:e2e`         | Playwright browser flows                                 |
| `npm run test:visual`      | Visual snapshots in the Playwright Docker image          |
| `npm run test:visual:local`| Visual snapshots on the host (Chromium required)         |
| `npm run test:visual:update` | Refresh baselines inside Docker                        |

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

## Performance notes

Profile the production build at a ~390 px viewport with CPU throttling when validating animation. Target ~16.7 ms frames on a 60 Hz display; pause and resume should feel immediate because the store only sees discrete transitions while transforms update in the runner loop. Record browser, viewport, and throttle settings with any findings so traces can be replayed.
