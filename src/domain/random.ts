/**
 * Injectable randomness for roster, schedule, and simulation.
 * Keeps domain logic testable with a deterministic implementation.
 */
export interface RandomSource {
  /** Uniform integer in [min, max], inclusive. */
  intInclusive(min: number, max: number): number
  /** Uniform float in [0, 1). */
  float01(): number
}

/** Fisher–Yates shuffle in place using `random`. */
export function shuffleInPlace<T>(items: T[], random: RandomSource): void {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = random.intInclusive(0, i)
    const tmp = items[i] as T
    items[i] = items[j] as T
    items[j] = tmp
  }
}

export function createDefaultRandom(): RandomSource {
  return {
    intInclusive(min: number, max: number): number {
      const lo = Math.ceil(min)
      const hi = Math.floor(max)
      return Math.floor(Math.random() * (hi - lo + 1)) + lo
    },
    float01(): number {
      return Math.random()
    },
  }
}

/** Deterministic RNG (mulberry32) for tests and reproducible browser fixtures. */
export function createSeededRandom(seed: number): RandomSource {
  let state = seed >>> 0

  /** One mulberry32 step: advances the state and returns a mixed float in [0, 1). */
  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  return {
    intInclusive(min: number, max: number): number {
      const lo = Math.ceil(min)
      const hi = Math.floor(max)
      return Math.floor(next() * (hi - lo + 1)) + lo
    },
    float01: next,
  }
}
