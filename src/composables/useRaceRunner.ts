import { onMounted, onUnmounted, shallowRef, watch } from 'vue'
import { storeToRefs } from 'pinia'

import { progressPercentAtTime, type SimulatedLane } from '../domain/simulation'
import type { GameStatus } from '../domain/types'
import { useGameStore } from '../stores/game'
import { readBrowserTestConfig } from '../testSupport/browserTestConfig'
import { installWindowTestApi } from '../testSupport/windowTestApi'

export interface FrameLaneProgress {
  readonly lane: number
  readonly horseId: number
  readonly progressPercent: number
}

function computeFrameProgress(
  status: GameStatus,
  lanes: readonly SimulatedLane[],
  clock: { getPhase(): string; getPhaseElapsedMs(): number; isRoundComplete(): boolean },
): FrameLaneProgress[] {
  const phase = clock.getPhase()
  if (phase === 'idle' || lanes.length === 0) {
    return []
  }

  const elapsed = clock.getPhaseElapsedMs()
  const atFinish =
    phase === 'hold' ||
    status === 'complete' ||
    (phase === 'racing' && clock.isRoundComplete())

  return lanes.map((lane) => ({
    lane: lane.lane,
    horseId: lane.horseId,
    progressPercent: atFinish ? 100 : progressPercentAtTime(lane, elapsed),
  }))
}

/**
 * Drives the race clock from requestAnimationFrame and exposes per-frame lane
 * progress without updating Pinia each frame.
 */
export function useRaceRunner() {
  const store = useGameStore()
  const { status, currentSimulation } = storeToRefs(store)
  const testConfig = readBrowserTestConfig()

  const frameProgress = shallowRef<FrameLaneProgress[]>([])

  let rafId = 0
  let timeSourceAttached = false

  const tick = (): void => {
    rafId = 0
    const clock = store.clock
    const simulation = store.currentSimulation
    if (!clock || !simulation) {
      frameProgress.value = []
      return
    }

    store.syncFromClock()

    frameProgress.value = computeFrameProgress(store.status, simulation.lanes, clock)

    if (store.status === 'running' && !clock.isPaused()) {
      rafId = requestAnimationFrame(tick)
    }
  }

  const scheduleFrame = (): void => {
    if (rafId !== 0) {
      return
    }
    if (store.status !== 'running' || store.clock?.isPaused()) {
      return
    }
    rafId = requestAnimationFrame(tick)
  }

  const refreshProgressOnce = (): void => {
    const clock = store.clock
    const simulation = store.currentSimulation
    if (!clock || !simulation) {
      frameProgress.value = []
      return
    }
    frameProgress.value = computeFrameProgress(store.status, simulation.lanes, clock)
  }

  onMounted(() => {
    if (!timeSourceAttached) {
      store.attachClock(testConfig?.timeSource ?? { now: () => performance.now() })
      timeSourceAttached = true
    }
    if (store.roster.length === 0) {
      store.loadRoster(testConfig?.random)
    }
    refreshProgressOnce()

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
    if (rafId !== 0) {
      cancelAnimationFrame(rafId)
      rafId = 0
    }
    refreshProgressOnce()
  })

  watch(currentSimulation, () => {
    refreshProgressOnce()
    scheduleFrame()
  })

  onUnmounted(() => {
    if (rafId !== 0) {
      cancelAnimationFrame(rafId)
      rafId = 0
    }
    store.clock?.stop()
  })

  return { frameProgress }
}
