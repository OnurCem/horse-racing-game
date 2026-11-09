import type { RandomSource } from './random'
import type { Roster, ScheduledRound } from './types'

const SEGMENT_COUNT = 5
const BASE_METERS_PER_SECOND = 240
const JITTER_MIN = -0.15
const JITTER_MAX = 0.15
const WEIGHT_MIN = 0.8
const WEIGHT_MAX = 1.2

export interface PaceSegment {
  readonly durationMs: number
  readonly distanceFraction: number
}

export interface SimulatedLane {
  readonly lane: number
  readonly horseId: number
  readonly speedMps: number
  readonly finishTimeMs: number
  readonly segments: readonly PaceSegment[]
}

export interface RoundSimulation {
  readonly round: number
  readonly distanceMeters: number
  readonly lanes: readonly SimulatedLane[]
  readonly lastFinishTimeMs: number
}

function jitter(random: RandomSource): number {
  return JITTER_MIN + random.float01() * (JITTER_MAX - JITTER_MIN)
}

function speedMpsForCondition(condition: number, random: RandomSource): number {
  const factor = 0.9 + 0.002 * (condition - 1) + jitter(random)
  const speed = BASE_METERS_PER_SECOND * factor
  return Math.max(speed, 0.001)
}

function buildSegments(finishTimeMs: number, random: RandomSource): PaceSegment[] {
  const weights: number[] = []
  for (let i = 0; i < SEGMENT_COUNT; i += 1) {
    weights.push(WEIGHT_MIN + random.float01() * (WEIGHT_MAX - WEIGHT_MIN))
  }
  const weightSum = weights.reduce((acc, w) => acc + w, 0)
  const distanceFraction = 1 / SEGMENT_COUNT

  return weights.map((weight) => ({
    durationMs: (weight / weightSum) * finishTimeMs,
    distanceFraction,
  }))
}

/**
 * Builds per-lane speeds, finish times, and pace curves for one scheduled round.
 */
export function createRoundSimulation(
  scheduledRound: ScheduledRound,
  roster: Roster,
  random: RandomSource,
): RoundSimulation {
  const horsesById = new Map(roster.map((h) => [h.id, h]))

  const lanes: SimulatedLane[] = scheduledRound.entries.map((entry) => {
    const horse = horsesById.get(entry.horseId)
    if (!horse) {
      throw new Error(`Unknown horse id ${entry.horseId}`)
    }

    const speedMps = speedMpsForCondition(horse.condition, random)
    const finishTimeMs = (scheduledRound.distanceMeters / speedMps) * 1000
    const segments = buildSegments(finishTimeMs, random)

    return {
      lane: entry.lane,
      horseId: entry.horseId,
      speedMps,
      finishTimeMs,
      segments,
    }
  })

  const lastFinishTimeMs = Math.max(...lanes.map((lane) => lane.finishTimeMs))

  return {
    round: scheduledRound.round,
    distanceMeters: scheduledRound.distanceMeters,
    lanes,
    lastFinishTimeMs,
  }
}

/** Normalized progress in [0, 100] at `timeMs` along the lane pace curve. */
export function progressPercentAtTime(lane: SimulatedLane, timeMs: number): number {
  if (timeMs <= 0) {
    return 0
  }
  if (timeMs >= lane.finishTimeMs) {
    return 100
  }

  let remaining = timeMs
  let covered = 0
  for (const segment of lane.segments) {
    if (remaining <= segment.durationMs) {
      const fraction = remaining / segment.durationMs
      covered += segment.distanceFraction * fraction
      return Math.min(100, covered * 100)
    }
    remaining -= segment.durationMs
    covered += segment.distanceFraction
  }

  return 100
}

export interface FinishPlacement {
  readonly position: number
  readonly horseId: number
  readonly lane: number
  readonly finishTimeMs: number
}

/** Rank by finish time; break ties by lower lane number. */
export function rankByFinishTime(simulation: RoundSimulation): FinishPlacement[] {
  const sorted = [...simulation.lanes].sort((a, b) => {
    if (a.finishTimeMs !== b.finishTimeMs) {
      return a.finishTimeMs - b.finishTimeMs
    }
    return a.lane - b.lane
  })

  return sorted.map((lane, index) => ({
    position: index + 1,
    horseId: lane.horseId,
    lane: lane.lane,
    finishTimeMs: lane.finishTimeMs,
  }))
}

/** True when mid-race progress ordering differs from finish ranking (lead change). */
export function hasLeadChangeAtTime(simulation: RoundSimulation, timeMs: number): boolean {
  const orderAtTime = [...simulation.lanes].sort((a, b) => {
    const diff = progressPercentAtTime(b, timeMs) - progressPercentAtTime(a, timeMs)
    if (diff !== 0) {
      return diff
    }
    return a.lane - b.lane
  })

  const finishOrder = rankByFinishTime(simulation).map((p) => p.horseId)
  const midOrder = orderAtTime.map((lane) => lane.horseId)

  return midOrder.some((id, index) => id !== finishOrder[index])
}
