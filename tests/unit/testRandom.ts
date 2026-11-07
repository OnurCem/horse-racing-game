import { createSeededRandom, type RandomSource } from '../../src/domain/random'

/** @deprecated Use {@link createSeededRandom} from `src/domain/random`. */
export function createTestRandom(seed: number): RandomSource {
  return createSeededRandom(seed)
}
