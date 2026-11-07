import type { useGameStore } from '../stores/game'
import { ManualTimeSource } from '../race/manualTimeSource'
import type { BrowserTestConfig } from './browserTestConfig'

type GameStore = ReturnType<typeof useGameStore>

export interface HorseRacingTestApi {
  readonly seed: number
  getStore(): GameStore
  advanceTime(ms: number): void
  syncRace(): void
}

interface RunnerHooks {
  refreshProgress: () => void
  scheduleFrame: () => void
}

export function installWindowTestApi(
  config: BrowserTestConfig,
  getStore: () => GameStore,
  hooks: RunnerHooks,
): void {
  if (!config.manualClock || !(config.timeSource instanceof ManualTimeSource)) {
    return
  }

  const manualTime = config.timeSource

  const api: HorseRacingTestApi = {
    seed: config.seed,
    getStore,
    advanceTime(ms: number) {
      manualTime.advance(ms)
      const store = getStore()
      store.syncFromClock()
      hooks.refreshProgress()
      if (store.status === 'running' && !store.clock?.isPaused()) {
        hooks.scheduleFrame()
      }
    },
    syncRace() {
      getStore().syncFromClock()
      hooks.refreshProgress()
    },
  }

  window.__HORSE_RACING_TEST__ = api
}

declare global {
  interface Window {
    __HORSE_RACING_TEST__?: HorseRacingTestApi
  }
}
