import { createSeededRandom, type RandomSource } from '../domain/random'
import { ManualTimeSource } from '../race/manualTimeSource'
import type { TimeSource } from '../race/raceClock'

export interface BrowserTestConfig {
  readonly seed: number
  readonly random: RandomSource
  readonly manualClock: boolean
  readonly timeSource: TimeSource
}

export function readBrowserTestConfig(): BrowserTestConfig | null {
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

  const seed = seedParam ? Number.parseInt(seedParam, 10) : 42_024
  const random = createSeededRandom(Number.isFinite(seed) ? seed : 42_024)
  const timeSource = manualClock ? new ManualTimeSource() : { now: () => performance.now() }

  return {
    seed: Number.isFinite(seed) ? seed : 42_024,
    random,
    manualClock,
    timeSource,
  }
}
