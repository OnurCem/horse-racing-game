import { onMounted, onUnmounted, shallowRef, watch } from 'vue'
import { storeToRefs } from 'pinia'

import { progressPercentAtTime, type SimulatedLane } from '../domain/simulation'
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
 * Drives the race clock from requestAnimationFrame and exposes per-frame lane
 * progress without updating Pinia each frame. Use it once, in the component
 * that owns the track.
 */
export function useRaceRunner() {
  const store = useGameStore()
  const { status, currentSimulation } = storeToRefs(store)

  const frameProgress = shallowRef<FrameLaneProgress[]>([])

  let rafId = 0

  const cancelFrame = (): void => {
    if (rafId !== 0) {
      cancelAnimationFrame(rafId)
      rafId = 0
    }
  }

  const refreshProgressOnce = (): void => {
    const simulation = store.currentSimulation
    frameProgress.value = simulation
      ? computeFrameProgress(store.status, simulation.lanes, store.clock)
      : []
  }

  const tick = (): void => {
    rafId = 0
    store.syncFromClock()
    refreshProgressOnce()

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
    // Nothing drives the clock without the track, so freeze the game.
    store.pause()
  })

  return { frameProgress }
}
