import { describe, expect, it } from 'vitest'

import { computeFrameProgress } from '../../src/composables/useRaceRunner'
import { createRoundSimulation } from '../../src/domain/simulation'
import { createRoster } from '../../src/domain/roster'
import { createSchedule } from '../../src/domain/schedule'
import { RaceClock } from '../../src/race/raceClock'
import { ManualTimeSource } from './manualTimeSource'
import { createTestRandom } from './testRandom'

function setup() {
  const roster = createRoster(createTestRandom(1))
  const schedule = createSchedule(roster, createTestRandom(2))
  const simulation = createRoundSimulation(schedule[0]!, roster, createTestRandom(3))
  const time = new ManualTimeSource()
  const clock = new RaceClock(time)
  return { simulation, time, clock }
}

describe('computeFrameProgress', () => {
  it('shows nothing before a round starts', () => {
    const { simulation, clock } = setup()
    expect(computeFrameProgress('ready', simulation.lanes, clock)).toEqual([])
  })

  it('keeps every horse at the finish once the game is complete', () => {
    const { simulation, clock } = setup()
    clock.stop()
    const frame = computeFrameProgress('complete', simulation.lanes, clock)
    expect(frame).toHaveLength(10)
    expect(frame.every((lane) => lane.progressPercent === 100)).toBe(true)
  })

  it('reports partial progress mid-race', () => {
    const { simulation, time, clock } = setup()
    clock.startRacing(simulation.lastFinishTimeMs)
    time.advance(simulation.lastFinishTimeMs / 2)
    const frame = computeFrameProgress('running', simulation.lanes, clock)
    expect(frame.some((lane) => lane.progressPercent > 0 && lane.progressPercent < 100)).toBe(true)
  })
})
