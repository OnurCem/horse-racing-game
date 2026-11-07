import type { HorseRacingTestApi } from '../../src/testSupport/windowTestApi'

declare global {
  interface Window {
    __HORSE_RACING_TEST__?: HorseRacingTestApi
  }
}

export {}
