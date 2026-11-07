import { describe, expect, it } from 'vitest'

import { createRoster } from '../../src/domain/roster'
import { ROUND_DISTANCES_METERS, createSchedule } from '../../src/domain/schedule'
import { createTestRandom } from './testRandom'

describe('createSchedule', () => {
  it('creates six rounds at the fixed distances in order', () => {
    const roster = createRoster(createTestRandom(1))
    const schedule = createSchedule(roster, createTestRandom(2))

    expect(schedule).toHaveLength(6)
    for (let i = 0; i < schedule.length; i += 1) {
      expect(schedule[i]!.round).toBe(i + 1)
      expect(schedule[i]!.distanceMeters).toBe(ROUND_DISTANCES_METERS[i])
    }
  })

  it('draws 10 distinct roster horses per round in lanes 1–10', () => {
    const roster = createRoster(createTestRandom(99))
    const schedule = createSchedule(roster, createTestRandom(100))
    const rosterIds = new Set(roster.map((h) => h.id))

    for (const round of schedule) {
      expect(round.entries).toHaveLength(10)

      const lanes = round.entries.map((e) => e.lane)
      expect(new Set(lanes).size).toBe(10)
      expect(Math.min(...lanes)).toBe(1)
      expect(Math.max(...lanes)).toBe(10)

      const horseIds = round.entries.map((e) => e.horseId)
      expect(new Set(horseIds).size).toBe(10)
      for (const id of horseIds) {
        expect(rosterIds.has(id)).toBe(true)
      }
    }
  })
})
