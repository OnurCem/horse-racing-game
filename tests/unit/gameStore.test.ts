import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { isReactive } from 'vue'

import { DEFAULT_INTER_ROUND_HOLD_MS } from '../../src/race/raceClock'
import { useGameStore } from '../../src/stores/game'
import { ManualTimeSource } from './manualTimeSource'
import { createTestRandom } from './testRandom'

describe('useGameStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  function setupStore(seed = 42) {
    const store = useGameStore()
    const random = createTestRandom(seed)
    const time = new ManualTimeSource()
    store.initialize({ random, timeSource: time })
    return { store, time, random }
  }

  it('initializes the roster and a working clock without any component', () => {
    const store = useGameStore()
    store.initialize()
    expect(store.roster).toHaveLength(20)

    store.generateSchedule()
    store.start()
    expect(store.status).toBe('running')
    expect(store.currentSimulation?.round).toBe(1)
  })

  it('keeps the clock, random source, and simulation out of Vue reactivity', () => {
    const { store } = setupStore()
    store.generateSchedule()
    store.start()

    expect(isReactive(store.clock)).toBe(false)
    expect(isReactive(store.random)).toBe(false)
    expect(isReactive(store.currentSimulation)).toBe(false)
  })

  it('completes on the last scheduled round', () => {
    const { store, time } = setupStore(11)
    store.generateSchedule()
    store.start()

    for (let round = 1; round <= store.schedule.length; round += 1) {
      expect(store.isFinalRound).toBe(round === store.schedule.length)
      time.advance(store.currentSimulation!.lastFinishTimeMs)
      store.syncFromClock()
      time.advance(DEFAULT_INTER_ROUND_HOLD_MS)
      store.syncFromClock()
    }

    expect(store.status).toBe('complete')
    expect(store.results).toHaveLength(store.schedule.length)
  })

  it('records a finished round and freezes the hold when paused late', () => {
    const { store, time } = setupStore(4)
    store.generateSchedule()
    store.start()

    time.advance(store.currentSimulation!.lastFinishTimeMs + DEFAULT_INTER_ROUND_HOLD_MS * 3)
    store.pause()

    expect(store.results).toHaveLength(1)
    expect(store.clock.getPhase()).toBe('hold')
    expect(store.clock.isPaused()).toBe(true)
    time.advance(10_000)
    store.syncFromClock()
    expect(store.activeRound?.round).toBe(1)
  })

  it('guards start until a schedule exists and guards generate while running', () => {
    const { store } = setupStore()
    store.start()
    expect(store.status).toBe('initial')

    store.generateSchedule()
    expect(store.status).toBe('ready')
    store.start()
    expect(store.status).toBe('running')

    store.generateSchedule()
    expect(store.schedule).toHaveLength(6)
    expect(store.status).toBe('running')
  })

  it('records one result per round and advances through six rounds', () => {
    const { store, time } = setupStore(7)
    store.generateSchedule()
    store.start()

    for (let round = 1; round <= 6; round += 1) {
      const simulation = store.currentSimulation
      expect(simulation?.round).toBe(round)

      time.advance(simulation!.lastFinishTimeMs)
      store.syncFromClock()
      expect(store.results).toHaveLength(round)
      expect(store.results[round - 1]!.round).toBe(round)
      const order = store.results[round - 1]!.finishingOrder
      expect(order).toHaveLength(10)
      // Times rise with position, and the last one matches the round's end.
      order.slice(1).forEach((row, i) => {
        expect(row.finishTimeMs).toBeGreaterThanOrEqual(order[i]!.finishTimeMs)
      })
      expect(order[9]!.finishTimeMs).toBe(simulation!.lastFinishTimeMs)

      if (round < 6) {
        time.advance(DEFAULT_INTER_ROUND_HOLD_MS)
        store.syncFromClock()
        expect(store.activeRound?.round).toBe(round + 1)
      }
    }

    expect(store.status).toBe('complete')
  })

  it('does not complete a round before the clock reaches the last finisher', () => {
    const { store } = setupStore(3)
    store.generateSchedule()
    store.start()
    store.completeRound()
    expect(store.results).toHaveLength(0)
  })

  it('keeps the inter-round hold frozen when paused at the finish line', () => {
    const { store, time } = setupStore(17)
    store.generateSchedule()
    store.start()

    time.advance(store.currentSimulation!.lastFinishTimeMs)
    store.pause()
    expect(store.results).toHaveLength(1)
    expect(store.status).toBe('paused')
    expect(store.clock?.getPhase()).toBe('hold')
    expect(store.clock?.isPaused()).toBe(true)

    time.advance(DEFAULT_INTER_ROUND_HOLD_MS)
    store.syncFromClock()
    expect(store.activeRound?.round).toBe(1)

    store.resume()
    time.advance(DEFAULT_INTER_ROUND_HOLD_MS)
    store.syncFromClock()
    expect(store.activeRound?.round).toBe(2)
  })

  it('prevents duplicate completion for the same round', () => {
    const { store, time } = setupStore(3)
    store.generateSchedule()
    store.start()

    const duration = store.currentSimulation!.lastFinishTimeMs
    time.advance(duration)
    store.completeRound()
    store.completeRound()

    expect(store.results).toHaveLength(1)
  })

  it('supports pause and resume during racing and between rounds', () => {
    const { store, time } = setupStore(5)
    store.generateSchedule()
    store.start()

    time.advance(400)
    store.pause()
    expect(store.status).toBe('paused')

    time.advance(10_000)
    expect(store.clock?.getPhaseElapsedMs()).toBe(400)

    store.resume()
    const remaining = store.currentSimulation!.lastFinishTimeMs - 400
    time.advance(remaining)
    store.syncFromClock()
    expect(store.results).toHaveLength(1)

    store.pause()
    time.advance(10_000)
    expect(store.clock?.isHoldComplete()).toBe(false)

    store.resume()
    time.advance(DEFAULT_INTER_ROUND_HOLD_MS)
    store.syncFromClock()
    expect(store.activeRound?.round).toBe(2)
  })

  it('allows Generate while paused and resets to a fresh ready game', () => {
    const { store, time } = setupStore(9)
    store.generateSchedule()
    store.start()
    time.advance(200)
    store.pause()

    const firstSchedule = store.schedule
    store.generateSchedule()

    expect(store.status).toBe('ready')
    expect(store.results).toHaveLength(0)
    expect(store.schedule).not.toBe(firstSchedule)
    expect(store.schedule).toHaveLength(6)
  })

  it('clears results and prepares a new ready game after completion', () => {
    const { store, time } = setupStore(13)
    store.generateSchedule()
    store.start()

    for (let round = 1; round <= 6; round += 1) {
      time.advance(store.currentSimulation!.lastFinishTimeMs)
      store.syncFromClock()
      if (round < 6) {
        time.advance(DEFAULT_INTER_ROUND_HOLD_MS)
        store.syncFromClock()
      }
    }
    expect(store.status).toBe('complete')

    store.generateSchedule()
    expect(store.status).toBe('ready')
    expect(store.results).toHaveLength(0)
    expect(store.activeRound?.round).toBe(1)
  })

  it('rejects resume when not paused', () => {
    const { store } = setupStore()
    store.generateSchedule()
    store.start()
    store.resume()
    expect(store.status).toBe('running')
  })
})
