import type { RandomSource } from './random'
import { shuffleInPlace } from './random'
import type { Roster, RoundEntry, ScheduledRound } from './types'

/** Distances for rounds 1–6, in meters. */
export const ROUND_DISTANCES_METERS: readonly number[] = [1200, 1400, 1600, 1800, 2000, 2200]

const LANES = 10

/**
 * Draws six rounds from the roster. Each round independently shuffles a copy
 * of the roster and takes the first ten horses as entrants (lanes 1–10).
 */
export function createSchedule(roster: Roster, random: RandomSource): readonly ScheduledRound[] {
  return ROUND_DISTANCES_METERS.map((distanceMeters, index) => {
    const round = index + 1
    const ids = roster.map((h) => h.id)
    shuffleInPlace(ids, random)

    const entries: RoundEntry[] = []
    for (let lane = 0; lane < LANES; lane += 1) {
      entries.push({
        lane: lane + 1,
        horseId: ids[lane]!,
      })
    }

    return {
      round,
      distanceMeters,
      entries,
    }
  })
}
