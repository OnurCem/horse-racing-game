<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

import type { FrameListener } from '../../composables/useRaceRunner'
import { formatRaceTime, raceTimeDigits } from '../../domain/formatRaceTime'

const props = defineProps<{
  /** Frame subscription from useRaceRunner; returns an unsubscribe. */
  subscribe: (listener: FrameListener) => () => void
}>()

/*
 * Rendering strategy: the time changes every frame, and changing text forces a
 * layout pass for the whole document (profiling showed one per frame, which
 * containment did not avoid). Instead each digit is a fixed 0–9 strip inside a
 * clipped window, moved with a transform. Like the horses, that is
 * compositor-only work: no layout and no paint while the race runs.
 *
 * Screen readers get a visually hidden role="timer" text (implicit
 * aria-live="off"), updated once per second while running and with the exact
 * value whenever the clock stops (pause, finish, Generate).
 */
type Reel = { readonly sep: string } | { readonly max: number }

const REELS: readonly Reel[] = [
  { max: 9 },
  { sep: ':' },
  { max: 5 },
  { max: 9 },
  { sep: '.' },
  { max: 9 },
  { max: 9 },
]

const stripRefs = ref<HTMLElement[]>([])
const srRef = ref<HTMLElement | null>(null)

const initialText = formatRaceTime(0)
const shownDigits = [0, 0, 0, 0, 0]
let srText = initialText
let srSecond = 0
let unsubscribe: (() => void) | null = null

const setDigit = (index: number, digit: number): void => {
  if (shownDigits[index] === digit) {
    return
  }
  shownDigits[index] = digit
  const strip = stripRefs.value[index]
  if (strip) {
    strip.style.transform = `translateY(${-digit * 1.5}em)`
  }
}

const updateScreenReaderText = (elapsedMs: number, animating: boolean): void => {
  const second = Math.floor(elapsedMs / 1000)
  if (animating && second === srSecond) {
    return
  }
  srSecond = second
  const text = formatRaceTime(elapsedMs)
  if (text === srText || !srRef.value) {
    return
  }
  srText = text
  srRef.value.textContent = text
}

const render: FrameListener = (elapsedMs, animating) => {
  raceTimeDigits(elapsedMs).forEach((digit, index) => setDigit(index, digit))
  updateScreenReaderText(elapsedMs, animating)
}

onMounted(() => {
  unsubscribe = props.subscribe(render)
})

onUnmounted(() => {
  unsubscribe?.()
})
</script>

<template>
  <div class="race-timer">
    <span id="race-timer-label" class="race-timer-label">Round time</span>
    <span class="race-timer-value" aria-hidden="true" data-testid="race-timer-display">
      <template v-for="(reel, i) in REELS" :key="i">
        <span v-if="'sep' in reel" class="race-timer-sep">{{ reel.sep }}</span>
        <span v-else class="race-timer-reel">
          <span ref="stripRefs" class="race-timer-strip">
            <span v-for="d in reel.max + 1" :key="d">{{ d - 1 }}</span>
          </span>
        </span>
      </template>
    </span>
    <span
      ref="srRef"
      class="visually-hidden"
      role="timer"
      aria-labelledby="race-timer-label"
      data-testid="race-timer"
      >{{ initialText }}</span
    >
  </div>
</template>

<style scoped>
.race-timer {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  font-size: 0.9rem;
}

.race-timer-label {
  color: rgba(27, 42, 74, 0.75);
}

.race-timer-value {
  display: inline-flex;
  height: 1.5em;
  line-height: 1.5em;
  font-weight: 650;
  font-variant-numeric: tabular-nums;
}

/* A clipped one-digit window over a 0–9 strip. */
.race-timer-reel {
  display: inline-block;
  width: 1ch;
  height: 1.5em;
  overflow: hidden;
}

.race-timer-strip {
  display: flex;
  flex-direction: column;
  will-change: transform;
}

.race-timer-strip > span {
  height: 1.5em;
  text-align: center;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
