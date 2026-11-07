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

const trackInnerRef = ref<HTMLElement | null>(null)
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
  const el = trackInnerRef.value
  if (!el) {
    return
  }
  const finishStrip = 8
  const padding = 8
  travelWidthPx.value = Math.max(0, el.clientWidth - finishStrip - padding - 32)
}

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  measureTravelWidth()
  if (typeof ResizeObserver !== 'undefined' && trackInnerRef.value) {
    resizeObserver = new ResizeObserver(() => measureTravelWidth())
    resizeObserver.observe(trackInnerRef.value)
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
    <div ref="trackInnerRef" class="track-inner">
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
      <div class="finish-column" aria-hidden="true">
        <span v-if="activeRound" class="finish-distance">{{ distanceLabel }}</span>
        <div class="finish-line">
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

.track-hint {
  margin: 0 0 0.5rem;
  font-size: 0.9rem;
  color: rgba(27, 42, 74, 0.75);
}

.track-inner {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.25rem;
  align-items: stretch;
}

.finish-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  gap: 0.35rem;
}

.finish-distance {
  font-size: 0.65rem;
  font-weight: 600;
  color: var(--text);
  writing-mode: vertical-rl;
  transform: rotate(180deg);
}

.finish-line {
  width: 8px;
  flex: 1;
  min-height: 120px;
  border-radius: 2px;
  background: repeating-linear-gradient(
    to bottom,
    #1f5fe0 0,
    #1f5fe0 8px,
    #f8f5f0 8px,
    #f8f5f0 16px
  );
  position: relative;
}

.finish-label {
  position: absolute;
  right: -3rem;
  top: 50%;
  transform: translateY(-50%) rotate(90deg);
  font-size: 0.7rem;
  font-weight: 650;
  color: var(--text);
  white-space: nowrap;
}

.finish-line {
  position: relative;
}
</style>
