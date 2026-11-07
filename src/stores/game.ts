import { defineStore } from 'pinia'

import {
  createRoundSimulation,
  progressPercentAtTime,
  rankByFinishTime,
  type RoundSimulation,
} from '../domain/simulation'
import { createDefaultRandom, type RandomSource } from '../domain/random'
import { createRoster } from '../domain/roster'
import { createSchedule } from '../domain/schedule'
import type { GameStatus, Horse, RoundResult, ScheduledRound } from '../domain/types'
import { DEFAULT_INTER_ROUND_HOLD_MS, RaceClock, type TimeSource } from '../race/raceClock'

export interface LaneProgress {
  readonly lane: number
  readonly horseId: number
  readonly progressPercent: number
}

interface GameState {
  roster: Horse[]
  schedule: ScheduledRound[]
  status: GameStatus
  activeRoundIndex: number
  results: RoundResult[]
  currentSimulation: RoundSimulation | null
  clock: RaceClock | null
  pendingHold: boolean
  random: RandomSource
}

function toRoundResult(simulation: RoundSimulation): RoundResult {
  const finishingOrder = rankByFinishTime(simulation).map((row) => ({
    position: row.position,
    horseId: row.horseId,
  }))

  return {
    round: simulation.round,
    distanceMeters: simulation.distanceMeters,
    finishingOrder,
  }
}

export const useGameStore = defineStore('game', {
  state: (): GameState => ({
    roster: [],
    schedule: [],
    status: 'initial',
    activeRoundIndex: 0,
    results: [],
    currentSimulation: null,
    clock: null,
    pendingHold: false,
    random: createDefaultRandom(),
  }),

  getters: {
    activeRound(state): ScheduledRound | null {
      return state.schedule[state.activeRoundIndex] ?? null
    },

    laneProgress(state): LaneProgress[] {
      if (!state.currentSimulation || !state.clock) {
        return []
      }
      const elapsed = state.clock.getPhaseElapsedMs()
      if (state.clock.getPhase() !== 'racing') {
        const atFinish =
          state.clock.getPhase() === 'hold' ||
          state.status === 'complete' ||
          state.clock.isRoundComplete()
        return state.currentSimulation.lanes.map((lane) => ({
          lane: lane.lane,
          horseId: lane.horseId,
          progressPercent: atFinish ? 100 : progressPercentAtTime(lane, elapsed),
        }))
      }

      return state.currentSimulation.lanes.map((lane) => ({
        lane: lane.lane,
        horseId: lane.horseId,
        progressPercent: progressPercentAtTime(lane, elapsed),
      }))
    },
  },

  actions: {
    loadRoster(random?: RandomSource): void {
      const source = random ?? this.random
      this.random = source
      this.roster = [...createRoster(source)]
    },

    attachClock(timeSource: TimeSource): RaceClock {
      const clock = new RaceClock(timeSource)
      this.clock = clock
      return clock
    },

    generateSchedule(): void {
      if (this.status === 'running') {
        return
      }
      if (this.roster.length === 0) {
        this.loadRoster(this.random)
      }

      this.schedule = [...createSchedule(this.roster, this.random)]
      this.results = []
      this.activeRoundIndex = 0
      this.currentSimulation = null
      this.pendingHold = false
      this.clock?.stop()
      this.status = 'ready'
    },

    start(): void {
      if (this.status !== 'ready' || this.schedule.length === 0) {
        return
      }

      this.activeRoundIndex = 0
      this.beginRound(0)
      this.status = 'running'
    },

    pause(): void {
      if (this.status !== 'running') {
        return
      }
      this.clock?.pause()
      this.status = 'paused'
    },

    resume(): void {
      if (this.status !== 'paused') {
        return
      }
      this.clock?.resume()
      this.status = 'running'
    },

    /**
     * Call when the race clock reports the last horse has finished the active round.
     * Idempotent per round index.
     */
    completeRound(): void {
      if (this.status !== 'running' && this.status !== 'paused') {
        return
      }
      const simulation = this.currentSimulation
      const scheduled = this.activeRound
      if (!simulation || !scheduled) {
        return
      }
      if (this.results.some((result) => result.round === scheduled.round)) {
        return
      }

      this.results.push(toRoundResult(simulation))

      const isFinalRound = scheduled.round === 6
      if (isFinalRound) {
        this.status = 'complete'
        this.pendingHold = false
        this.clock?.stop()
        return
      }

      this.pendingHold = true
      this.clock?.startHold(DEFAULT_INTER_ROUND_HOLD_MS)
    },

    /** After the inter-round hold, load the next scheduled round. */
    advanceToNextRound(): void {
      if (!this.pendingHold) {
        return
      }
      if (this.status !== 'running' && this.status !== 'paused') {
        return
      }
      if (this.clock && !this.clock.isHoldComplete()) {
        return
      }

      const nextIndex = this.activeRoundIndex + 1
      if (nextIndex >= this.schedule.length) {
        this.pendingHold = false
        return
      }

      this.pendingHold = false
      this.activeRoundIndex = nextIndex
      this.beginRound(nextIndex)
    },

    beginRound(roundIndex: number): void {
      const scheduled = this.schedule[roundIndex]
      if (!scheduled) {
        return
      }

      const simulation = createRoundSimulation(scheduled, this.roster, this.random)
      this.currentSimulation = simulation

      if (!this.clock) {
        throw new Error('Race clock not attached')
      }
      this.clock.startRacing(simulation.lastFinishTimeMs)
    },

    /**
     * Poll clock milestones (for tests and the Phase 4 animation loop).
     * Returns whether state changed.
     */
    syncFromClock(): boolean {
      const clock = this.clock
      if (!clock) {
        return false
      }

      let changed = false

      if (clock.getPhase() === 'racing' && clock.isRoundComplete()) {
        const before = this.results.length
        this.completeRound()
        changed = this.results.length !== before || this.status === 'complete'
      }

      if (this.pendingHold && clock.isHoldComplete()) {
        this.advanceToNextRound()
        changed = true
      }

      return changed
    },
  },
})
