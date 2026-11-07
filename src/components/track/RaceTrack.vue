<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

import type { Horse, ScheduledRound } from '../../domain/types'
import type { FrameLaneProgress } from '../../composables/useRaceRunner'
import TrackLane from './TrackLane.vue'

const props = defineProps<{
  status: string
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

  const progressByLane = new Map(
    props.frameProgress.map((row) => [row.lane, row.progressPercent]),
  )

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
        <span class="finish-distance">{{ distanceLabel }}</span>
        <div class="finish-marker">
          <span class="finish-label">Finish</span>
          <div class="finish-line" />
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

  .finish-column {
    width: 2.25rem;
  }
}

.track-hint {
  margin: 0 0 0.5rem;
  font-size: 0.9rem;
  color: rgba(27, 42, 74, 0.75);
}

.track-inner {
  display: flex;
  align-items: stretch;
  gap: 0.5rem;
}

.lanes-column {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.finish-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  width: 2.75rem;
  flex-shrink: 0;
  align-self: stretch;
}

.finish-distance {
  font-size: 0.65rem;
  font-weight: 600;
  color: var(--text);
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  flex-shrink: 0;
}

.finish-marker {
  display: flex;
  flex: 1;
  align-items: stretch;
  gap: 0.2rem;
  width: 100%;
  align-self: stretch;
}

.finish-label {
  font-size: 0.7rem;
  font-weight: 650;
  color: var(--text);
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  white-space: nowrap;
  flex-shrink: 0;
}

.finish-line {
  width: 8px;
  flex: 1;
  border-radius: 2px;
  background: repeating-linear-gradient(
    to bottom,
    #1f5fe0 0,
    #1f5fe0 8px,
    #f8f5f0 8px,
    #f8f5f0 16px
  );
}
</style>
