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
