/** A horse in the stable roster (numbers 1–20). */
export interface Horse {
  readonly id: number
  readonly name: string
  readonly colorName: string
  readonly colorHex: string
  readonly condition: number
}

/** One lane assignment for a scheduled round. */
export interface RoundEntry {
  readonly lane: number
  readonly horseId: number
}

/** A single round in the six-round schedule. */
export interface ScheduledRound {
  readonly round: number
  readonly distanceMeters: number
  readonly entries: readonly RoundEntry[]
}

/**
 * Finishing order for a completed round (used in later phases).
 * Positions are 1–10; lower is better.
 */
export interface RoundResult {
  readonly round: number
  readonly distanceMeters: number
  readonly finishingOrder: readonly {
    readonly position: number
    readonly horseId: number
    /** Real milliseconds from the start of the round to this horse's finish. */
    readonly finishTimeMs: number
  }[]
}

export type Roster = readonly Horse[]

/** High-level game flow (see IMPLEMENTATION_PLAN state table). */
export type GameStatus = 'initial' | 'ready' | 'running' | 'paused' | 'complete'
