import type { TimeSource } from './raceClock'

/** Injectable wall clock for deterministic race timing in tests. */
export class ManualTimeSource implements TimeSource {
  private current = 0

  now(): number {
    return this.current
  }

  advance(ms: number): void {
    this.current += ms
  }

  set(ms: number): void {
    this.current = ms
  }
}
