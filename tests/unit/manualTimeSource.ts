import type { TimeSource } from '../../src/race/raceClock'

export class ManualTimeSource implements TimeSource {
  private current = 0

  now(): number {
    return this.current
  }

  advance(ms: number): void {
    this.current += ms
  }
}
