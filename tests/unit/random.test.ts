import { describe, expect, it } from 'vitest'

import { createSeededRandom } from '../../src/domain/random'

describe('createSeededRandom', () => {
  it('repeats the same sequence for the same seed', () => {
    const a = createSeededRandom(123)
    const b = createSeededRandom(123)
    for (let i = 0; i < 20; i += 1) {
      expect(a.float01()).toBe(b.float01())
      expect(a.intInclusive(1, 100)).toBe(b.intInclusive(1, 100))
    }
  })

  it('produces well-mixed floats in [0, 1), not a fixed-step sequence', () => {
    const random = createSeededRandom(42)
    const values = Array.from({ length: 2000 }, () => random.float01())

    for (const value of values) {
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }

    const deltas = new Set(
      values.slice(1).map((value, i) => (value - values[i]! + 1) % 1).map((d) => d.toFixed(3)),
    )
    expect(deltas.size).toBeGreaterThan(100)

    const mean = values.reduce((sum, v) => sum + v, 0) / values.length
    expect(mean).toBeGreaterThan(0.45)
    expect(mean).toBeLessThan(0.55)
  })

  it('covers both inclusive integer bounds', () => {
    const random = createSeededRandom(7)
    const seen = new Set<number>()
    for (let i = 0; i < 5000; i += 1) {
      const value = random.intInclusive(1, 100)
      expect(Number.isInteger(value)).toBe(true)
      expect(value).toBeGreaterThanOrEqual(1)
      expect(value).toBeLessThanOrEqual(100)
      seen.add(value)
    }
    expect(seen.has(1)).toBe(true)
    expect(seen.has(100)).toBe(true)
  })
})
