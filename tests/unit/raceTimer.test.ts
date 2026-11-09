import { describe, expect, it } from 'vitest'

import { formatRaceTime, raceTimeDigits } from '../../src/domain/formatRaceTime'
import { computeRoundElapsedMs } from '../../src/composables/useRaceRunner'
import { RaceClock } from '../../src/race/raceClock'
import { ManualTimeSource } from './manualTimeSource'

const simulation = { lastFinishTimeMs: 6_000 }

function setup() {
  const time = new ManualTimeSource()
  const clock = new RaceClock(time)
  return { time, clock }
}

describe('formatRaceTime', () => {
  it.each([
    [0, '0:00.00'],
    [5_379, '0:05.37'],
    [61_005, '1:01.00'],
    [-20, '0:00.00'],
  ])('formats %d ms as %s', (ms, expected) => {
    expect(formatRaceTime(ms)).toBe(expected)
  })
})

describe('raceTimeDigits', () => {
  it.each([0, 5_379, 61_005, 599_999])('matches formatRaceTime for %d ms', (ms) => {
    const digits = formatRaceTime(ms).replace(/\D/g, '').split('').map(Number)
    expect(raceTimeDigits(ms)).toEqual(digits)
  })
})

describe('computeRoundElapsedMs', () => {
  it('is zero with no round loaded', () => {
    const { clock } = setup()
    expect(computeRoundElapsedMs('ready', null, clock)).toBe(0)
  })

  it('tracks active time while racing and freezes while paused', () => {
    const { time, clock } = setup()
    clock.startRacing(simulation.lastFinishTimeMs)
    time.advance(2_500)
    expect(computeRoundElapsedMs('running', simulation, clock)).toBe(2_500)

    clock.pause()
    time.advance(3_000)
    expect(computeRoundElapsedMs('paused', simulation, clock)).toBe(2_500)
  })

  it('stops at the last finisher and holds that time between rounds and at the end', () => {
    const { time, clock } = setup()
    clock.startRacing(simulation.lastFinishTimeMs)
    time.advance(9_000)
    expect(computeRoundElapsedMs('running', simulation, clock)).toBe(6_000)

    clock.startHold(800)
    expect(computeRoundElapsedMs('running', simulation, clock)).toBe(6_000)

    clock.stop()
    expect(computeRoundElapsedMs('complete', simulation, clock)).toBe(6_000)
  })
})
