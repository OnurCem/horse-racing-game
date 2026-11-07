import { describe, expect, it } from 'vitest'

import { DEFAULT_INTER_ROUND_HOLD_MS, RaceClock, type TimeSource } from '../../src/race/raceClock'

class ManualTimeSource implements TimeSource {
  private current = 0

  now(): number {
    return this.current
  }

  advance(ms: number): void {
    this.current += ms
  }
}

describe('RaceClock', () => {
  it('reports round completion after active racing time elapses', () => {
    const time = new ManualTimeSource()
    const clock = new RaceClock(time)

    clock.startRacing(5000)
    expect(clock.isRoundComplete()).toBe(false)

    time.advance(4999)
    expect(clock.isRoundComplete()).toBe(false)

    time.advance(1)
    expect(clock.isRoundComplete()).toBe(true)
  })

  it('pauses and resumes racing without counting paused wall time', () => {
    const time = new ManualTimeSource()
    const clock = new RaceClock(time)

    clock.startRacing(3000)
    time.advance(1000)
    clock.pause()
    time.advance(9000)
    expect(clock.getPhaseElapsedMs()).toBe(1000)
    expect(clock.isRoundComplete()).toBe(false)

    clock.resume()
    time.advance(2000)
    expect(clock.isRoundComplete()).toBe(true)
  })

  it('pauses and resumes during the inter-round hold', () => {
    const time = new ManualTimeSource()
    const clock = new RaceClock(time)

    clock.startHold(DEFAULT_INTER_ROUND_HOLD_MS)
    time.advance(300)
    clock.pause()
    time.advance(5000)
    expect(clock.getPhaseElapsedMs()).toBe(300)
    expect(clock.isHoldComplete()).toBe(false)

    clock.resume()
    time.advance(500)
    expect(clock.isHoldComplete()).toBe(true)
  })
})
