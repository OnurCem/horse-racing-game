import { describe, expect, it } from 'vitest'

import {
  displayedProgressPercent,
  REDUCED_MOTION_STEP_PERCENT,
} from '../../src/components/track/laneMotion'

describe('displayedProgressPercent', () => {
  it('passes progress through and clamps it with full motion', () => {
    expect(displayedProgressPercent(37.4, false)).toBe(37.4)
    expect(displayedProgressPercent(-5, false)).toBe(0)
    expect(displayedProgressPercent(120, false)).toBe(100)
  })

  it('moves in discrete steps with reduced motion', () => {
    expect(displayedProgressPercent(0, true)).toBe(0)
    expect(displayedProgressPercent(9.9, true)).toBe(0)
    expect(displayedProgressPercent(10, true)).toBe(10)
    expect(displayedProgressPercent(37.4, true)).toBe(30)
    expect(displayedProgressPercent(99.9, true)).toBe(90)
  })

  it('lands exactly on the finish with reduced motion', () => {
    expect(displayedProgressPercent(100, true)).toBe(100)
    expect(displayedProgressPercent(130, true)).toBe(100)
  })

  it('produces only a handful of distinct positions across a race', () => {
    const positions = new Set<number>()
    for (let p = 0; p <= 100; p += 0.25) {
      positions.add(displayedProgressPercent(p, true))
    }
    expect(positions.size).toBe(100 / REDUCED_MOTION_STEP_PERCENT + 1)
  })
})
