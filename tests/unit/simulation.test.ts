import { describe, expect, it } from 'vitest'

import { createRoster } from '../../src/domain/roster'
import { createSchedule } from '../../src/domain/schedule'
import {
  createRoundSimulation,
  hasLeadChangeAtTime,
  progressPercentAtTime,
  rankByFinishTime,
} from '../../src/domain/simulation'
import { createTestRandom } from './testRandom'

describe('createRoundSimulation', () => {
  it('starts at 0%, moves mid-race, and reaches 100% at finish time', () => {
    const random = createTestRandom(11)
    const roster = createRoster(createTestRandom(1))
    const schedule = createSchedule(roster, createTestRandom(2))
    const simulation = createRoundSimulation(schedule[0]!, roster, random)

    for (const lane of simulation.lanes) {
      expect(progressPercentAtTime(lane, 0)).toBe(0)
      const mid = lane.finishTimeMs / 2
      const midProgress = progressPercentAtTime(lane, mid)
      expect(midProgress).toBeGreaterThan(0)
      expect(midProgress).toBeLessThan(100)
      expect(progressPercentAtTime(lane, lane.finishTimeMs)).toBe(100)
      expect(progressPercentAtTime(lane, lane.finishTimeMs + 500)).toBe(100)
    }
  })

  it('keeps pace progress monotonic toward the finish', () => {
    const roster = createRoster(createTestRandom(3))
    const schedule = createSchedule(roster, createTestRandom(4))
    const simulation = createRoundSimulation(schedule[0]!, roster, createTestRandom(5))

    for (const lane of simulation.lanes) {
      const samples = [0, 0.1, 0.35, 0.7, 1].map((f) => lane.finishTimeMs * f)
      let previous = -1
      for (const t of samples) {
        const value = progressPercentAtTime(lane, t)
        expect(value).toBeGreaterThanOrEqual(previous)
        previous = value
      }
      expect(previous).toBe(100)
    }
  })

  it('breaks exact finish-time ties by lower lane number', () => {
    const simulation = {
      round: 1,
      distanceMeters: 1200,
      lastFinishTimeMs: 5000,
      lanes: [
        {
          lane: 2,
          horseId: 20,
          speedMps: 1,
          finishTimeMs: 5000,
          segments: [{ durationMs: 5000, distanceFraction: 1 }],
        },
        {
          lane: 1,
          horseId: 10,
          speedMps: 1,
          finishTimeMs: 5000,
          segments: [{ durationMs: 5000, distanceFraction: 1 }],
        },
      ],
    }

    const ranking = rankByFinishTime(simulation)
    expect(ranking[0]!.horseId).toBe(10)
    expect(ranking[0]!.lane).toBe(1)
    expect(ranking[1]!.horseId).toBe(20)
  })

  it('ranks by finish time and breaks ties by lane order', () => {
    const roster = createRoster(createTestRandom(8))
    const schedule = createSchedule(roster, createTestRandom(9))
    const simulation = createRoundSimulation(schedule[0]!, roster, createTestRandom(10))

    const ranking = rankByFinishTime(simulation)
    expect(ranking).toHaveLength(10)

    const sortedLanes = [...simulation.lanes].sort((a, b) => {
      if (a.finishTimeMs !== b.finishTimeMs) {
        return a.finishTimeMs - b.finishTimeMs
      }
      return a.lane - b.lane
    })

    for (let i = 0; i < ranking.length; i += 1) {
      expect(ranking[i]!.position).toBe(i + 1)
      expect(ranking[i]!.horseId).toBe(sortedLanes[i]!.horseId)
      expect(ranking[i]!.lane).toBe(sortedLanes[i]!.lane)
    }
  })

  it('includes a seeded fixture with a mid-race lead change', () => {
    const roster = createRoster(createTestRandom(21))
    const schedule = createSchedule(roster, createTestRandom(22))

    let found = false
    for (let seed = 0; seed < 200; seed += 1) {
      const simulation = createRoundSimulation(
        schedule[0]!,
        roster,
        createTestRandom(seed),
      )
      const sampleTime = simulation.lastFinishTimeMs * 0.45
      if (hasLeadChangeAtTime(simulation, sampleTime)) {
        found = true
        break
      }
    }
    expect(found).toBe(true)
  })
})
