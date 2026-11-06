import { describe, expect, it } from 'vitest'

import { createRoster } from '../../src/domain/roster'
import type { RandomSource } from '../../src/domain/random'

/** Deterministic RNG for stable assertions (mulberry32). */
function createTestRandom(seed: number): RandomSource {
  let state = seed >>> 0
  return {
    intInclusive(min: number, max: number): number {
      state = (state + 0x6d2b79f5) >>> 0
      let t = Math.imul(state ^ (state >>> 15), 1 | state)
      t ^= t + Math.imul(t ^ (t >>> 7), 61 | t)
      const u = (t ^ (t >>> 14)) >>> 0
      const lo = Math.ceil(min)
      const hi = Math.floor(max)
      const span = hi - lo + 1
      return lo + (u % span)
    },
    float01(): number {
      state = (state + 0x6d2b79f5) >>> 0
      return (state >>> 0) / 4294967296
    },
  }
}

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
