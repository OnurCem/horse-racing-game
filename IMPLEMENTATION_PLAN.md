# Horse Racing Game · Implementation plan

Build a responsive browser game in which the player sees a randomly generated horse roster, generates a six-round schedule, starts it once, and watches the finishing order appear after each round. Use `horse-racing-game` for the repository and package, and **Horse Racing** for the visible title. Keep all source files, metadata, documentation, and assets free of company names and branding.

## Start in Cursor

Copy this file and the `mockups/` directory into the project root. Open the project in Cursor and use this prompt in Agent mode.

> Read @IMPLEMENTATION_PLAN.md and inspect the linked mockups. Check the working tree, current branch, and existing setup, then implement the first unfinished phase only. Follow the branch, commit, and review workflow in the plan: start from an up-to-date `main` and create that phase's branch before changing any file. After the phase passes its checks, commit the scoped changes on the phase branch and report the branch name, commit hash, what works, and what you verified. Do not merge into `main`. Stop at that checkpoint so I can review it before asking you to continue.

After each phase, review it in a new chat with the review prompt in **Review stage** before merging.

## Requirements and settled choices

| Area             | Behavior                                                                                                                                                                                                                                                      | Basis                                                                                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Horse roster     | Generate exactly 20 horses **when the app loads**, with stable numbers 1–20, distinct named colors, names, and random integer condition scores from 1 to 100 inclusive. The roster stays the same for the page session; reloading the page creates a new one. | The brief lists the horse list as its own requirement, gives a 1–20 range, and sets a pool of 20. A fixed pool of 20 makes every 10-horse draw possible. |
| Schedule         | **Generate** creates six rounds in order at 1,200, 1,400, 1,600, 1,800, 2,000, and 2,200 m from the current roster. Draw 10 distinct horses for each round. A horse may enter multiple rounds.                                                                | Brief rules.                                                                                                                                             |
| Race             | One Start action runs all six rounds in order. Horses visibly move from start to finish in fixed lanes, with lead changes during the race.                                                                                                                    | Brief requirements. Lead changes are a design choice so the outcome is not obvious from the first frame.                                                 |
| Results          | Publish all 10 finishing positions together once the last horse finishes. Append one round at a time and retain earlier rounds until the next Generate.                                                                                                       | Brief requirements, with the publication point made explicit.                                                                                            |
| Pause and resume | Keep one primary control in the same place. Pausing freezes race progress and resuming continues from the same positions.                                                                                                                                     | The example shows Start/Pause. Resume behavior is a design choice.                                                                                       |
| Technology       | Vue 3, TypeScript, Vite, and Pinia, with ESLint and Prettier. Use Vue components for the screen and keep race calculations and timing separate from rendering.                                                                                                | Vue components and a store come from the brief. The specific stack is the proposed implementation choice.                                                |
| Bonus coverage   | Unit tests, browser end-to-end tests, and screenshot regression tests.                                                                                                                                                                                        | All three bonuses are in scope.                                                                                                                          |
| Delivery         | Public repository with a README and a live deployment on GitHub Pages.                                                                                                                                                                                        | The brief's example shows a hosted build.                                                                                                                |

Document every choice marked as a design choice above, plus the roster interpretation, in the README's **Assumptions** section so a reviewer sees them as deliberate.

## Project structure

Use this layout and keep framework-free logic out of Vue files.

```
src/
  domain/          Pure TypeScript, no Vue imports
    types.ts         Horse, RoundEntry, ScheduledRound, RoundResult, GameStatus
    random.ts        Seedable random source (interface plus a default implementation)
    palette.ts       The 20 named colors
    names.ts         Neutral horse names
    roster.ts        createRoster(random)
    schedule.ts      createSchedule(roster, random)
    simulation.ts    Speeds, pace curves, finish times, ranking, progress at time t
  race/
    raceClock.ts     Active-time clock with injectable time source (see "Race clock")
  stores/
    game.ts          Pinia store: roster, schedule, status, active round, results
  composables/
    useRaceRunner.ts Connects the race clock to the store and requestAnimationFrame
    useReducedMotion.ts
  components/
    layout/          App shell and responsive columns
    controls/        Round heading, Generate, Start/Pause/Resume
    track/           RaceTrack, TrackLane, HorseSilhouette (inline SVG)
    schedule/        Schedule list and expandable round rows
    roster/          Roster table and color swatch
    results/         Result groups and tables
tests/
  unit/            Vitest specs mirroring src/
  e2e/             Playwright flows
  visual/          Playwright screenshot tests and baselines
```

## Screen design

Use the [selected desktop mockup](mockups/desktop.png) and [matching mobile mockup](mockups/mobile.png). Carry over the warm white surface, navy lane labels, cobalt controls, and blue checkered finish line. Both mockups show only the running state of round 2, with the same sample data: horse numbers, names, colors, conditions, lane entrants, and round 1 results agree across the roster, track, and results. Where this section describes something the mockups do not show, the text takes precedence.

- **Wide screens.** Put the schedule and the roster in a slim left column. Show the roster **expanded by default** on desktop, with a control to collapse it. The roster lists all 20 horses. The mockup shows only rows 1–10; when the list is taller than the remaining column height, scroll it inside the column, with a visible scrollbar or bottom fade so the reader knows more rows exist. Place the current round, controls, and ten-lane track in the main column, with results directly below. Keep the schedule visible and mark upcoming, current, and completed rounds using text or symbols as well as color: plain row for upcoming, highlighted row with ● and the visually hidden text "now running" for current, ✓ for completed.
- **Narrow screens.** Start with a single column below about 900 px and adjust at the point the track or sidebar gets cramped. Order the sections as round and controls, track, results, schedule, then roster. Use expandable Schedule and Horse roster rows, collapsed by default. Keep the track, lane labels, and finish line within the viewport at 320 px. Give controls at least 44 px of height on touch layouts.
- **Track sizing.** Use lanes about 42 px tall on both layouts, giving a track of about 420 px. On mobile, make the lane-label column about 64 px wide. Size horse silhouettes about 32 × 22 px and draw the finish line as an 8 px two-column checkered strip. On a phone (390 × 844), the round heading, controls, and the whole track must fit on one screen below the title, so the player never scrolls during a race. Result rows are at least 44 px tall on mobile.
- **Track identity.** Each lane label shows the lane number and the entrant's horse number, for example `1 · #14`, so lane numbers and horse numbers are never confused. Show the round distance and a **Finish** label at the finish line.
- **Schedule and roster.** Each schedule row shows the round and distance. Expanding it reveals the 10 assigned entrants in lane order. The roster shows horse number, name, color as a swatch plus the color name, and condition. Use readable horse identifiers so color is supplementary.
- **Results.** Each round is a group with a heading such as "Round 1 · 1,200 m". Open the latest completed round by default and keep earlier groups collapsed but available in order. Each row shows position, a color swatch, horse number, and name. On desktop, an open group shows all 10 rows. On mobile, show the first three positions in the open group and expand the same table with **Show all 10**. Appending a result should preserve scroll and focus. Provide a brief polite announcement when a round concludes.
- **Motion.** Use a small inline SVG horse silhouette drawn for this project, tinted with each horse's color and given a thin dark outline so light colors stay visible on the warm white track. Keep lane labels readable and use discrete position updates for players who prefer reduced motion.

### Horse colors

Use these 20 named colors as the starting palette. During Phase 5, view all 20 on the track and in the roster, and adjust any hex values that look too similar. Keep the names stable.

| No. | Name   | Hex       | No. | Name     | Hex       |
| --- | ------ | --------- | --- | -------- | --------- |
| 1   | Red    | `#D62828` | 11  | Lime     | `#8CC63F` |
| 2   | Blue   | `#1F5FE0` | 12  | Sky      | `#47B8F0` |
| 3   | Green  | `#2E9E3F` | 13  | Maroon   | `#7A1E2C` |
| 4   | Yellow | `#E9C31B` | 14  | Lavender | `#B49BE0` |
| 5   | Purple | `#7B2CBF` | 15  | Gray     | `#8A8F98` |
| 6   | Orange | `#F47C00` | 16  | Olive    | `#6E7B1E` |
| 7   | Pink   | `#E0217A` | 17  | Coral    | `#FF7B6B` |
| 8   | Teal   | `#0FA3A0` | 18  | Tan      | `#C8A165` |
| 9   | Navy   | `#1B2A4A` | 19  | Mint     | `#6FDDB0` |
| 10  | Brown  | `#8B4A1F` | 20  | Black    | `#111111` |

## Game states and controls

| State    | What the screen shows                                                                                                                                              | Generate                                                      | Primary control               |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------- | ----------------------------- |
| Initial  | Roster visible. Schedule reads "No schedule yet". Track shows ten empty lanes with "Generate a schedule to begin". Results read "Results appear after each round". | Enabled                                                       | Start disabled                |
| Ready    | Heading "Round 1 of 6 · 1,200 m". Round 1's horses wait at the starting line. Round 1 is marked as next in the schedule.                                           | Enabled, replaces the schedule                                | Start                         |
| Running  | Animate the current round. Publish its result after the final finisher and hold the finished track for roughly 800 ms before loading the next round.               | Disabled                                                      | Pause                         |
| Paused   | Hold the current positions, or the finish view if paused between rounds. Show a **Paused** label next to the heading.                                              | Enabled, discards the current game and creates a new schedule | Resume                        |
| Complete | Keep the final track and six result groups visible. Show **Race complete**.                                                                                        | Enabled, clears results and prepares a new game               | Start disabled until Generate |

The game transitions to Complete as soon as round six's result is recorded. A fresh Generate creates a new schedule from the current roster, clears results, and resets elapsed time. Guard state transitions in the store as well as disabling buttons in the UI.

## Phase and commit workflow

Each phase is developed on its own branch, reviewed, and merged into `main` before the next phase starts. `main` only ever holds reviewed phases. Phase 1 was committed directly on `main` before this workflow was added; it counts as finished.

| Phase | Branch                          |
| ----- | ------------------------------- |
| 1     | `phase-1-setup` (on `main`)     |
| 2     | `phase-2-roster-schedule`       |
| 3     | `phase-3-simulation-state`      |
| 4     | `phase-4-playable-race`         |
| 5     | `phase-5-responsive`            |
| 6     | `phase-6-verification-delivery` |

**Starting a phase.** Read `git status --short`, the current branch, `git branch`, and the recent history of `main`. A phase is finished when its branch has been merged into `main`. If the working tree has uncommitted changes, stop and report them instead of continuing. If the previous phase's branch exists but is not merged, stop and say that it is waiting for review. Otherwise switch to `main` and create the next phase's branch from it (`git switch main && git switch -c <branch>`) before changing any file. If you are already on the correct unmerged branch with work in progress, continue there.

**During a phase.** Commit only on the phase branch. Never commit to `main`, merge, rebase, or push unless the user asks. Treat the commit messages below as examples and adapt them to the changes actually made.

**Ending a phase.** Report the branch name and commit hashes, then stop. The phase is not finished until it passes the review stage below and the user merges it. Merge only when the user explicitly asks you to.

### Review stage

Every phase goes through this loop before it is merged:

1. **Build.** The phase chat implements the phase on its branch and stops at the checkpoint.
2. **Review.** The user opens a new chat, separate from the one that wrote the code, on the phase branch, and pastes the review prompt below. The reviewer reads and runs checks only; it does not edit files.
3. **Fix.** The user pastes the must-fix findings back into the phase chat. The phase chat fixes them on the same branch in focused commits, such as `fix: guard resume while not paused`, and reruns the phase checks.
4. **Re-review.** If any must-fix finding changed code, run the review prompt again in the review chat with "Re-review: check that the previous must-fix findings are resolved and nothing regressed."
5. **Verify and merge.** The user runs the phase's **Check** by hand, then merges with `git switch main && git merge --no-ff <branch>` and pushes `main`. The next phase starts in a new chat.

Optional findings can be fixed in the same loop, deferred to a later phase, or dropped. Note deferred ones in the phase report so they are not lost.

**Review prompt**

> Review the changes on this branch against `main` (`git diff main...HEAD`) for Phase N of @IMPLEMENTATION_PLAN.md. Do not edit any files.
>
> 1. Correctness: bugs, edge cases, state transitions the state table forbids, and timing errors around pause, resume, and the inter-round hold.
> 2. Plan conformance: everything Phase N asks for is present, nothing from later phases leaked in, and the **Project structure** is followed (no Vue or Pinia imports in `src/domain` or `src/race`).
> 3. Tests: the Phase N **Check** and the relevant **Acceptance tests** rows are covered, tests assert behavior rather than implementation details, and randomness and time are injected rather than mocked globally.
> 4. Maintainability: naming, component size, duplication, types (no `any`), and dead code.
> 5. Brief rules this phase touches: 20 horses, unique colors, condition 1–100, six rounds at the fixed distances, and 10 horses per round.
>
> Run lint, type-check, and the unit tests (plus any end-to-end or visual suites that exist) and report the results. List findings ranked by severity with `file:line`, what is wrong, and a concrete fix. Mark each one **must-fix** or **optional**, and end with a verdict: **ready to merge** or **needs fixes**.

A second, independent reviewer such as Claude Code's `/code-review high main` on the phase branch can be run alongside this prompt. It checks for bugs, not plan conformance.

An atomic commit has one purpose and includes the tests and configuration needed to verify that change. Run the phase checks, review the diff, stage only the relevant changes, and inspect `git diff --cached` before committing. Leave each checkpoint buildable and keep its existing tests and lint green. If a phase has independently useful changes, give them separate commits and verify each one. At the end of the phase, report the commit hash or hashes, checks run, and what to try locally.

### Phase 1 · Project setup

**Example commit** `chore: scaffold the Vue application`

Set up Vue, TypeScript, Vite, and Pinia. Add ESLint (with the Vue and TypeScript configs) and Prettier, configured to work together. Commit the dependency lockfile and add `dev`, `build`, `type-check`, `lint`, and `format` commands. Create the folders from **Project structure**. Show a minimal screen with the game title.

**Check** Lint, type checking, and production build pass. The dev server opens the initial screen.

### Phase 2 · Roster and schedule

**Example commit** `feat: generate the horse roster and race schedule`

Define types for horses, round entries, scheduled rounds, and results. Use the named palette above and assign names from a neutral list. Generate the roster and schedule with pure functions and an injectable random source. Sample each round independently by shuffling a copy of the roster and taking the first 10. Set up Vitest and cover the roster and schedule rules in this commit.

**Check** Unit tests verify roster size, condition bounds, unique colors and color names, round distances, and entrant selection.

### Phase 3 · Race simulation, clock, and state

**Example commits** `feat: calculate race progress and finish order`, `feat: add the race clock`, and `feat: manage the six-round race in Pinia`

**Simulation.** Calculate a positive average speed per entrant once per round using condition and a bounded random variation. The average pace is 240 simulated meters per real second × (0.9 + 0.002 × (condition − 1) + jitter), with jitter uniformly drawn from −0.15 to +0.15. Derive finish time from distance divided by speed. Rank by finish time, breaking exact ties by lane order.

**Pace curve.** So horses overtake each other, give each entrant a pace curve generated once per round. Split the distance into 5 equal segments and draw a weight for each segment uniformly from 0.8 to 1.2. Set each segment's duration to its weight divided by the sum of weights, times the finish time. Progress is piecewise linear across those durations. It starts at 0%, increases monotonically, and reaches 100% exactly at the finish time, so ranking is unaffected. Clamp progress to 0–100%.

**Race clock.** Put all timing in `race/raceClock.ts`, a framework-free class with an injectable time source (`now(): number`). It accumulates active time across pauses, including the inter-round hold, and reports when the current round's last horse finishes and when the hold ends. It does not import Vue or Pinia. `useRaceRunner` connects it to the store and to `requestAnimationFrame` in Phase 4.

**Store.** Use Pinia for the roster, schedule, active round, game status, and committed results. Expose actions such as `generateSchedule`, `start`, `pause`, `resume`, and `completeRound`. Guard every transition against the state table above and record each round's result once. Cover simulation, clock, and store with unit tests as the corresponding code lands.

**Check** Unit tests verify progress at the start, mid-race, and after finish; that the pace curve is monotonic and ends at the finish time; that at least one seeded fixture contains a lead change; ranking and tie-breaking; clock pause and resume during racing and during the hold; round advancement; duplicate completion protection; Generate while paused; and reset after completion.

### Phase 4 · Playable race

**Example commits** `feat: add race controls, schedule, and roster` and `feat: animate the track and reveal round results`

Connect the controls and game panels using focused Vue components. In `useRaceRunner`, drive the race clock from one `requestAnimationFrame` loop using `performance.now()` and call store actions on round completion and hold end. Provide per-frame progress to the track without making it reactive in Pinia. Clean up the loop on unmount. Follow the performance guidance below.

**Check** Play from load through all six rounds. Pause and resume, confirm results arrive in order, generate while paused, and generate a new game after completion.

### Phase 5 · Responsive design

**Example commit** `feat: adapt the race screen for desktop and mobile`

Match the selected mockups with a shared component tree. Apply the responsive ordering, expandable sections, track sizing, track identity labels, results disclosure, and every state described above. Check the 20 colors side by side and adjust similar hex values.

**Check** Compare at desktop and 390 px widths, then verify the track fits at 320 px. At 390 × 844, confirm the round heading, controls, and whole track are visible together without scrolling. Confirm the desktop roster scrolls to horse 20. Review each game state. Try keyboard operation, visible focus, and reduced motion.

### Phase 6 · Browser verification and delivery

**Example commits** `test: cover the complete race in Playwright`, `test: add desktop and mobile visual baselines`, `ci: run checks and deploy to GitHub Pages`, and `docs: explain how to run and verify the game`

Use Playwright for browser flows and screenshots. Seed randomness and control the clock through test configuration so fixtures use the same game logic. Generate and compare visual baselines only inside the official Playwright Docker image (`mcr.microsoft.com/playwright`) with the tag matching the installed `@playwright/test` version. Add an `npm run test:visual` command that runs in that container and an update command for baselines. Review baseline images before committing them with their screenshot tests.

Add a GitHub Actions workflow that runs lint, type check, unit tests, build, and the Playwright suites in the same container, then deploys the production build to GitHub Pages from the default branch. Set Vite's `base` for the Pages path.

Write a short README covering how to run, play, and test the game, the live link, the project structure, and an **Assumptions** section listing the interpretation of the 1–20 horse rule, when results are published, pause and resume behavior, Generate while paused, and lead-changing pace curves.

**Check** From a clean install, run lint, the type check, production build, unit suite, end-to-end suite, and visual suite. Confirm the CI run passes and the deployed page plays a full game. Profile the production build as described below and record the conditions and findings.

## Animation performance

- Keep elapsed time and per-frame positions in the race clock and the track. Pinia receives discrete state changes such as start, pause, resume, and round completion. This keeps schedule, roster, and results updates off the animation path.
- Use a single `requestAnimationFrame` callback for all ten horses. Update their horizontal CSS transforms from normalized progress. Measure the available travel width on initial render and resize, then reuse that width across frames. Suspend frame scheduling while paused and stop it when the game completes or the track unmounts.
- Reuse one inline SVG horse silhouette across lanes and tint it with each horse's assigned color. The mockup PNGs are design references only; do not copy or trace third-party artwork. Use CSS for the lane markings and checkered finish line.
- Profile a running round in the production build at a 390 px viewport with CPU throttling or on a representative phone. Use roughly 16.7 ms per frame as a reference for a 60 Hz display. Check for repeated slow frames or forced layout during movement, and verify pause and resume feel immediate. Record the browser and test conditions alongside the findings so the trace can be reproduced.

## Acceptance tests

| Layer             | Minimum passing coverage                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit              | Verify 20 unique IDs, colors, and color names, inclusive condition boundaries, the six distances in order, and 10 distinct valid entrants per round. Cover progress before start, mid-race, and after finish; monotonic pace curves ending at the finish time; a seeded lead change; finish-time ordering; tie-breaking; pause and resume during racing and between rounds; duplicate completion protection; Generate while paused; and regeneration after completion.                                         |
| End-to-end        | On load, verify the roster shows 20 horses. Generate the schedule, start, observe a horse move, pause, verify progress stays fixed, and resume. At each round boundary, verify exactly one result is appended after all 10 finish. Verify six results at completion and that Generate resets the game. Verify Generate while paused starts a fresh schedule. At a phone viewport, expand Schedule, Horse roster, and **Show all 10**, and confirm the heading, controls, and track fit the 390 × 844 viewport. |
| Visual regression | Capture the initial, ready, reproducibly paused mid-race, and completed states at desktop and mobile sizes. Fix the fixture seed, elapsed time, viewport, browser, and font environment, and run only in the pinned Playwright container. Compare against reviewed baselines.                                                                                                                                                                                                                                  |
