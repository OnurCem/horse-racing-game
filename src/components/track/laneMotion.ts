/** Progress step used when the player prefers reduced motion. */
export const REDUCED_MOTION_STEP_PERCENT = 10

/**
 * Progress to draw for a lane, clamped to 0–100. With reduced motion the horse
 * moves in discrete {@link REDUCED_MOTION_STEP_PERCENT} steps instead of
 * gliding every frame, and still lands exactly on the finish line.
 */
export function displayedProgressPercent(progressPercent: number, reducedMotion: boolean): number {
  const clamped = Math.min(100, Math.max(0, progressPercent))
  if (!reducedMotion || clamped >= 100) {
    return clamped
  }
  return Math.floor(clamped / REDUCED_MOTION_STEP_PERCENT) * REDUCED_MOTION_STEP_PERCENT
}
