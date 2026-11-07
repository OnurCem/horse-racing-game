<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

import type { GameStatus, Horse, ScheduledRound } from '../../domain/types'
import type { FrameLaneProgress } from '../../composables/useRaceRunner'
import TrackLane from './TrackLane.vue'

const props = defineProps<{
  status: GameStatus
  activeRound: ScheduledRound | null
  roster: readonly Horse[]
  frameProgress: FrameLaneProgress[]
  reducedMotion: boolean
}>()

const lanesColumnRef = ref<HTMLElement | null>(null)
const travelWidthPx = ref(0)

const horsesById = computed(() => new Map(props.roster.map((h) => [h.id, h])))

const lanes = computed(() => {
  const emptyMessage = props.status === 'initial' || !props.activeRound
  if (emptyMessage) {
    return Array.from({ length: 10 }, (_, i) => ({
      lane: i + 1,
      horseId: null as number | null,
      horse: null as Horse | null,
      progressPercent: 0,
    }))
  }

  const progressByLane = new Map(props.frameProgress.map((row) => [row.lane, row.progressPercent]))

  return props.activeRound.entries.map((entry) => ({
    lane: entry.lane,
    horseId: entry.horseId,
    horse: horsesById.value.get(entry.horseId) ?? null,
    progressPercent: progressByLane.get(entry.lane) ?? 0,
  }))
})

const distanceLabel = computed(() => {
  if (!props.activeRound) {
    return ''
  }
  return `${props.activeRound.distanceMeters.toLocaleString()} m`
})

const measureTravelWidth = (): void => {
  const laneTrack = lanesColumnRef.value?.querySelector('.lane-track')
  if (!(laneTrack instanceof HTMLElement)) {
    return
  }
  const horseWidth = 32
  travelWidthPx.value = Math.max(0, laneTrack.clientWidth - horseWidth)
}

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  measureTravelWidth()
  if (typeof ResizeObserver !== 'undefined' && lanesColumnRef.value) {
    resizeObserver = new ResizeObserver(() => measureTravelWidth())
    resizeObserver.observe(lanesColumnRef.value)
  } else {
    window.addEventListener('resize', measureTravelWidth)
  }
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  window.removeEventListener('resize', measureTravelWidth)
})

watch(
  () => props.activeRound?.round,
  () => {
    requestAnimationFrame(measureTravelWidth)
  },
)
</script>

<template>
  <section class="race-track" aria-label="Race track">
    <p v-if="status === 'initial' || !activeRound" class="track-hint">
      Generate a schedule to begin
    </p>
    <div class="track-inner">
      <div ref="lanesColumnRef" class="lanes-column">
        <TrackLane
          v-for="row in lanes"
          :key="row.lane"
          :lane="row.lane"
          :horse-id="row.horseId"
          :horse="row.horse"
          :progress-percent="row.progressPercent"
          :travel-width-px="travelWidthPx"
          :reduced-motion="reducedMotion"
        />
      </div>
      <div v-if="activeRound" class="finish-column" aria-hidden="true">
        <div class="finish-line" />
        <div class="finish-labels">
          <span class="finish-distance">{{ distanceLabel }}</span>
          <span class="finish-label">Finish</span>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.race-track {
  background: #ebe4d8;
  border: 1px solid rgba(27, 42, 74, 0.15);
  border-radius: 8px;
  padding: 0.75rem 0.5rem 0.75rem 0.75rem;
}

@media (max-width: 899px) {
  .race-track {
    padding: 0.5rem 0.35rem 0.5rem 0.5rem;
  }
}

.track-hint {
  margin: 0 0 0.5rem;
  font-size: 0.9rem;
  color: rgba(27, 42, 74, 0.75);
}

/* No gap: the finish line sits flush with the end of the lanes, so a horse at
   100% progress touches it. */
.track-inner {
  display: flex;
  align-items: stretch;
}

.lanes-column {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.finish-column {
  display: flex;
  align-items: stretch;
  gap: 0.3rem;
  flex-shrink: 0;
}

.finish-labels {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
}

.finish-distance {
  font-size: 0.65rem;
  font-weight: 600;
  color: var(--text);
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  white-space: nowrap;
}

.finish-label {
  font-size: 0.7rem;
  font-weight: 650;
  color: var(--text);
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  white-space: nowrap;
}

.finish-line {
  /* Fixed basis: a growable flex item here would widen past two columns. */
  flex: 0 0 8px;
  border-radius: 2px;
  /* Two-column checkerboard of 4 px squares, as in the mockup. */
  background: conic-gradient(#f8f5f0 0 25%, #1f5fe0 0 50%, #f8f5f0 0 75%, #1f5fe0 0) 0 0 / 8px 8px;
}
</style>
