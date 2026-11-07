import { describe, expect, it } from 'vitest'

import { createRoster } from '../../src/domain/roster'
import { createTestRandom } from './testRandom'

describe('createRoster', () => {
  it('creates exactly 20 horses with ids 1–20 and unique colors and names', () => {
    const roster = createRoster(createTestRandom(42))

    expect(roster).toHaveLength(20)

    const ids = roster.map((h) => h.id)
    expect(new Set(ids).size).toBe(20)
    expect(Math.min(...ids)).toBe(1)
    expect(Math.max(...ids)).toBe(20)

    const colorNames = roster.map((h) => h.colorName)
    expect(new Set(colorNames).size).toBe(20)

    const colorHex = roster.map((h) => h.colorHex.toLowerCase())
    expect(new Set(colorHex).size).toBe(20)

    const names = roster.map((h) => h.name)
    expect(new Set(names).size).toBe(20)
  })

  it('assigns condition scores between 1 and 100 inclusive', () => {
    const roster = createRoster(createTestRandom(7))
    for (const horse of roster) {
      expect(horse.condition).toBeGreaterThanOrEqual(1)
      expect(horse.condition).toBeLessThanOrEqual(100)
      expect(Number.isInteger(horse.condition)).toBe(true)
    }
  })
})
