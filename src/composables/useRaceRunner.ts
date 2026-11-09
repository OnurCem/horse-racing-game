import { onMounted, onUnmounted, shallowRef, watch } from 'vue'
import { storeToRefs } from 'pinia'

import {
  progressPercentAtTime,
  type RoundSimulation,
  type SimulatedLane,
} from '../domain/simulation'
import type { GameStatus } from '../domain/types'
import type { RaceClock } from '../race/raceClock'
import { useGameStore } from '../stores/game'
import { readBrowserTestConfig, TEST_HOOKS_ENABLED } from '../testSupport/browserTestConfig'
import { installWindowTestApi } from '../testSupport/windowTestApi'

export interface FrameLaneProgress {
  readonly lane: number
  readonly horseId: number
  readonly progressPercent: number
}

/** Lane positions for the current frame; exported for unit tests. */
export function computeFrameProgress(
  status: GameStatus,
  lanes: readonly SimulatedLane[],
  clock: Pick<RaceClock, 'getPhase' | 'getPhaseElapsedMs' | 'isRoundComplete'>,
): FrameLaneProgress[] {
  const phase = clock.getPhase()
  // The store stops the clock on completion, so check status before the idle phase
  // to keep the final round's horses at the finish line.
  if (lanes.length === 0 || (phase === 'idle' && status !== 'complete')) {
    return []
  }

  const elapsed = clock.getPhaseElapsedMs()
  const atFinish =
    status === 'complete' || phase === 'hold' || (phase === 'racing' && clock.isRoundComplete())

  return lanes.map((lane) => ({
    lane: lane.lane,
    horseId: lane.horseId,
    progressPercent: atFinish ? 100 : progressPercentAtTime(lane, elapsed),
  }))
}

/**
 * Elapsed time of the current round in real milliseconds, for the race timer.
 * Capped at the last finisher's time, so it holds through the inter-round hold
 * and after the final round. Exported for unit tests.
 */
export function computeRoundElapsedMs(
  status: GameStatus,
  simulation: Pick<RoundSimulation, 'lastFinishTimeMs'> | null,
  clock: Pick<RaceClock, 'getPhase' | 'getPhaseElapsedMs'>,
): number {
  if (!simulation) {
    return 0
  }
  const phase = clock.getPhase()
  if (status === 'complete' || phase === 'hold') {
    return simulation.lastFinishTimeMs
  }
  if (phase === 'racing') {
    return Math.min(clock.getPhaseElapsedMs(), simulation.lastFinishTimeMs)
  }
  return 0
}

/**
 * Called with the round's elapsed time. `animating` is true inside the
 * requestAnimationFrame loop and false for one-off refreshes (pause, round
 * change, Generate), when the value is about to stay still.
 */
export type FrameListener = (roundElapsedMs: number, animating: boolean) => void

/**
 * Drives the race clock from requestAnimationFrame and exposes per-frame lane
 * progress without updating Pinia each frame. Use it once, in the component
 * that owns the track.
 */
export function useRaceRunner() {
  const store = useGameStore()
  const { status, currentSimulation } = storeToRefs(store)

  const frameProgress = shallowRef<FrameLaneProgress[]>([])

  let rafId = 0

  // Plain (non-reactive) listeners: per-frame values such as the race timer
  // write straight to the DOM instead of re-rendering through Vue.
  const frameListeners = new Set<FrameListener>()

  const notifyFrameListeners = (animating: boolean): void => {
    if (frameListeners.size === 0) {
      return
    }
    const elapsed = computeRoundElapsedMs(store.status, store.currentSimulation, store.clock)
    frameListeners.forEach((listener) => listener(elapsed, animating))
  }

  /** Subscribes to every animation frame and state refresh; returns an unsubscribe. */
  const onFrame = (listener: FrameListener): (() => void) => {
    frameListeners.add(listener)
    listener(computeRoundElapsedMs(store.status, store.currentSimulation, store.clock), false)
    return () => frameListeners.delete(listener)
  }

  const cancelFrame = (): void => {
    if (rafId !== 0) {
      cancelAnimationFrame(rafId)
      rafId = 0
    }
  }

  const refreshProgressOnce = (animating = false): void => {
    const simulation = store.currentSimulation
    frameProgress.value = simulation
      ? computeFrameProgress(store.status, simulation.lanes, store.clock)
      : []
    notifyFrameListeners(animating)
  }

  const tick = (): void => {
    rafId = 0
    store.syncFromClock()
    const keepRunning = store.status === 'running' && !store.clock.isPaused()
    refreshProgressOnce(keepRunning)

    if (store.status === 'running' && !store.clock.isPaused()) {
      rafId = requestAnimationFrame(tick)
    }
  }

  const scheduleFrame = (): void => {
    if (rafId !== 0 || store.status !== 'running' || store.clock.isPaused()) {
      return
    }
    rafId = requestAnimationFrame(tick)
  }

  onMounted(() => {
    refreshProgressOnce()
    scheduleFrame()

    const testConfig = TEST_HOOKS_ENABLED ? readBrowserTestConfig() : null
    if (testConfig) {
      installWindowTestApi(testConfig, () => store, {
        refreshProgress: refreshProgressOnce,
        scheduleFrame,
      })
    }
  })

  watch(status, (next) => {
    if (next === 'running') {
      scheduleFrame()
      return
    }
    cancelFrame()
    refreshProgressOnce()
  })

  watch(currentSimulation, () => {
    refreshProgressOnce()
    scheduleFrame()
  })

  onUnmounted(() => {
    cancelFrame()
    frameListeners.clear()
    // Nothing drives the clock without the track, so freeze the game.
    store.pause()
  })

  return { frameProgress, onFrame }
}
