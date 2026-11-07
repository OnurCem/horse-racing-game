export interface TimeSource {
  now(): number
}

export const DEFAULT_INTER_ROUND_HOLD_MS = 800

const TIME_EPSILON_MS = 1e-6

export type RaceClockPhase = 'idle' | 'racing' | 'hold'

/**
 * Accumulates active (unpaused) elapsed time for the current racing or hold phase.
 * Framework-free; inject wall time via {@link TimeSource}.
 */
export class RaceClock {
  private phase: RaceClockPhase = 'idle'

  private phaseDurationMs = 0

  private phaseStartedAt = 0

  private paused = false

  private pauseStartedAt = 0

  private totalPausedMs = 0

  private readonly timeSource: TimeSource

  constructor(timeSource: TimeSource) {
    this.timeSource = timeSource
  }

  getPhase(): RaceClockPhase {
    return this.phase
  }

  isPaused(): boolean {
    return this.paused
  }

  /** Elapsed active milliseconds inside the current phase. */
  getPhaseElapsedMs(): number {
    if (this.phase === 'idle') {
      return 0
    }

    const now = this.timeSource.now()
    let pausedExtra = 0
    if (this.paused) {
      pausedExtra = now - this.pauseStartedAt
    }

    return Math.max(0, now - this.phaseStartedAt - this.totalPausedMs - pausedExtra)
  }

  startRacing(lastHorseFinishTimeMs: number): void {
    this.resetPhase('racing', lastHorseFinishTimeMs)
  }

  startHold(holdDurationMs: number): void {
    this.resetPhase('hold', holdDurationMs)
  }

  stop(): void {
    this.phase = 'idle'
    this.phaseDurationMs = 0
    this.paused = false
    this.totalPausedMs = 0
  }

  pause(): void {
    if (this.phase === 'idle' || this.paused) {
      return
    }
    this.paused = true
    this.pauseStartedAt = this.timeSource.now()
  }

  resume(): void {
    if (!this.paused) {
      return
    }
    this.totalPausedMs += this.timeSource.now() - this.pauseStartedAt
    this.paused = false
  }

  isRoundComplete(): boolean {
    return (
      this.phase === 'racing' &&
      this.getPhaseElapsedMs() + TIME_EPSILON_MS >= this.phaseDurationMs
    )
  }

  isHoldComplete(): boolean {
    return (
      this.phase === 'hold' &&
      this.getPhaseElapsedMs() + TIME_EPSILON_MS >= this.phaseDurationMs
    )
  }

  private resetPhase(phase: Exclude<RaceClockPhase, 'idle'>, durationMs: number): void {
    this.phase = phase
    this.phaseDurationMs = durationMs
    this.phaseStartedAt = this.timeSource.now()
    this.paused = false
    this.pauseStartedAt = 0
    this.totalPausedMs = 0
  }
}
