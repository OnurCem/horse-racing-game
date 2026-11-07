import type { RandomSource } from '../../src/domain/random'

/** Deterministic RNG for stable assertions (mulberry32). */
export function createTestRandom(seed: number): RandomSource {
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
