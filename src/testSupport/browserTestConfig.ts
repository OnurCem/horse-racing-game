import { createSeededRandom, type RandomSource } from '../domain/random'
import { ManualTimeSource } from '../race/manualTimeSource'
import type { TimeSource } from '../race/raceClock'

/**
 * True only in builds made with `VITE_ENABLE_TEST_HOOKS=1` (Playwright).
 * Vite inlines the value, so deployed builds drop the test hooks entirely.
 */
export const TEST_HOOKS_ENABLED = import.meta.env.VITE_ENABLE_TEST_HOOKS === '1'

const DEFAULT_SEED = 42_024

export interface BrowserTestConfig {
  readonly seed: number
  readonly random: RandomSource
  readonly manualClock: boolean
  readonly timeSource: TimeSource
}

let cached: BrowserTestConfig | null | undefined

function parseConfig(): BrowserTestConfig | null {
  if (typeof window === 'undefined') {
    return null
  }

  const params = new URLSearchParams(window.location.search)
  const seedParam = params.get('seed')
  const manualClock =
    params.get('test') === '1' ||
    params.get('testMode') === '1' ||
    params.get('manualClock') === '1'

  if (!seedParam && !manualClock) {
    return null
  }

  const parsed = seedParam ? Number.parseInt(seedParam, 10) : DEFAULT_SEED
  const seed = Number.isFinite(parsed) ? parsed : DEFAULT_SEED

  return {
    seed,
    random: createSeededRandom(seed),
    manualClock,
    timeSource: manualClock ? new ManualTimeSource() : { now: () => performance.now() },
  }
}

/**
 * Reads the browser test configuration once per page. Every caller gets the
 * same instance, so the store's clock and the window test API share one
 * manual time source.
 */
export function readBrowserTestConfig(): BrowserTestConfig | null {
  if (!TEST_HOOKS_ENABLED) {
    return null
  }
  if (cached === undefined) {
    cached = parseConfig()
  }
  return cached
}
