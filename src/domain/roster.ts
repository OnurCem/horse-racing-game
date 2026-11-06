import { HORSE_NAMES } from './names'
import { HORSE_PALETTE } from './palette'
import type { RandomSource } from './random'
import { shuffleInPlace } from './random'
import type { Horse, Roster } from './types'

const ROSTER_SIZE = 20

/**
 * Builds the 20-horse roster: stable IDs 1–20, unique palette colors and names,
 * and a random condition in [1, 100] per horse.
 */
export function createRoster(random: RandomSource): Roster {
  const colors = [...HORSE_PALETTE]
  const names = [...HORSE_NAMES]
  shuffleInPlace(colors, random)
  shuffleInPlace(names, random)

  const horses: Horse[] = []
  for (let i = 0; i < ROSTER_SIZE; i += 1) {
    const color = colors[i]!
    const name = names[i]!
    horses.push({
      id: i + 1,
      name,
      colorName: color.name,
      colorHex: color.hex,
      condition: random.intInclusive(1, 100),
    })
  }
  return horses
}
