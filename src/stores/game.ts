import { defineStore } from 'pinia'
import { markRaw } from 'vue'

import { createRoundSimulation, rankByFinishTime, type RoundSimulation } from '../domain/simulation'
import { createDefaultRandom, type RandomSource } from '../domain/random'
import { createRoster } from '../domain/roster'
import { createSchedule } from '../domain/schedule'
import type { GameStatus, Horse, RoundResult, ScheduledRound } from '../domain/types'
import { DEFAULT_INTER_ROUND_HOLD_MS, RaceClock, type TimeSource } from '../race/raceClock'

export interface GameStoreOptions {
  readonly random?: RandomSource
  readonly timeSource?: TimeSource
}

interface GameState {
  roster: Horse[]
  schedule: ScheduledRound[]
  status: GameStatus
  activeRoundIndex: number
  results: RoundResult[]
  /** Replaced wholesale each round; kept raw so lane data is not deep-proxied. */
  currentSimulation: RoundSimulation | null
  /** Timing engine; kept raw so per-frame reads stay outside Vue reactivity. */
  clock: RaceClock
  pendingHold: boolean
  random: RandomSource
}

const performanceTimeSource: TimeSource = { now: () => performance.now() }

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
    clock: markRaw(new RaceClock(performanceTimeSource)),
    pendingHold: false,
    random: markRaw(createDefaultRandom()),
  }),

  getters: {
    activeRound(state): ScheduledRound | null {
      return state.schedule[state.activeRoundIndex] ?? null
    },

    isFinalRound(state): boolean {
      return state.schedule.length > 0 && state.activeRoundIndex === state.schedule.length - 1
    },
  },

  actions: {
    /**
     * Prepares a new page session: injects optional random and time sources
     * (used by tests) and creates the 20-horse roster.
     */
    initialize(options: GameStoreOptions = {}): void {
      if (options.timeSource) {
        this.attachClock(options.timeSource)
      }
      this.loadRoster(options.random)
    },

    loadRoster(random?: RandomSource): void {
      if (random) {
        this.random = markRaw(random)
      }
      this.roster = [...createRoster(this.random)]
    },

    attachClock(timeSource: TimeSource): RaceClock {
      const clock = markRaw(new RaceClock(timeSource))
      this.clock = clock
      return clock
    },

    generateSchedule(): void {
      if (this.status === 'running') {
        return
      }
      if (this.roster.length === 0) {
        this.loadRoster()
      }

      this.schedule = [...createSchedule(this.roster, this.random)]
      this.results = []
      this.activeRoundIndex = 0
      this.currentSimulation = null
      this.pendingHold = false
      this.clock.stop()
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
      this.clock.pause()
      this.status = 'paused'
      // Record a round that finished before this frame noticed it.
      this.syncFromClock()
    },

    resume(): void {
      if (this.status !== 'paused') {
        return
      }
      this.clock.resume()
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
      if (this.clock.getPhase() === 'racing' && !this.clock.isRoundComplete()) {
        return
      }

      this.results.push(toRoundResult(simulation))

      if (this.isFinalRound) {
        this.status = 'complete'
        this.pendingHold = false
        this.clock.stop()
        return
      }

      this.pendingHold = true
      this.clock.startHold(DEFAULT_INTER_ROUND_HOLD_MS)
    },

    /** After the inter-round hold, load the next scheduled round. */
    advanceToNextRound(): void {
      if (!this.pendingHold) {
        return
      }
      if (this.status !== 'running' && this.status !== 'paused') {
        return
      }
      if (!this.clock.isHoldComplete()) {
        return
      }

      const nextIndex = this.activeRoundIndex + 1
      this.pendingHold = false
      if (nextIndex >= this.schedule.length) {
        return
      }

      this.activeRoundIndex = nextIndex
      this.beginRound(nextIndex)
    },

    beginRound(roundIndex: number): void {
      const scheduled = this.schedule[roundIndex]
      if (!scheduled) {
        return
      }

      const simulation = createRoundSimulation(scheduled, this.roster, this.random)
      this.currentSimulation = markRaw(simulation)
      this.clock.startRacing(simulation.lastFinishTimeMs)
    },

    /**
     * Poll clock milestones (called by the animation loop and tests).
     * Returns whether state changed.
     */
    syncFromClock(): boolean {
      let changed = false

      if (this.clock.getPhase() === 'racing' && this.clock.isRoundComplete()) {
        const before = this.results.length
        this.completeRound()
        changed = this.results.length !== before || this.status === 'complete'
      }

      if (this.pendingHold && this.clock.isHoldComplete()) {
        this.advanceToNextRound()
        changed = true
      }

      return changed
    },
  },
})
