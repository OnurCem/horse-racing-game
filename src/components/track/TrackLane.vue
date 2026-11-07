<script setup lang="ts">
import { computed } from 'vue'

import type { Horse } from '../../domain/types'
import HorseSilhouette from './HorseSilhouette.vue'
import { displayedProgressPercent } from './laneMotion'

const props = defineProps<{
  lane: number
  horseId: number | null
  horse: Horse | null
  progressPercent: number
  travelWidthPx: number
  reducedMotion: boolean
}>()

const label = computed(() => {
  if (props.horseId === null) {
    return `${props.lane}`
  }
  return `${props.lane} · #${props.horseId}`
})

const horseOffsetPx = computed(() => {
  const percent = displayedProgressPercent(props.progressPercent, props.reducedMotion)
  return (percent / 100) * props.travelWidthPx
})
</script>

<template>
  <div class="track-lane">
    <div class="lane-label">{{ label }}</div>
    <div class="lane-track">
      <div v-if="horse" class="lane-horse" :style="{ transform: `translateX(${horseOffsetPx}px)` }">
        <HorseSilhouette :color-hex="horse.colorHex" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.track-lane {
  --lane-label-width: 5.5rem;
  display: grid;
  grid-template-columns: var(--lane-label-width) 1fr;
  align-items: center;
  min-height: 42px;
  border-bottom: 1px dashed rgba(27, 42, 74, 0.2);
}

.track-lane:last-child {
  border-bottom: none;
}

.lane-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #fff;
  background: var(--text);
  padding: 0.35rem 0.5rem;
  border-radius: 4px;
  text-align: center;
  line-height: 1.2;
}

.lane-track {
  position: relative;
  height: 42px;
  margin-left: 0.5rem;
  overflow: hidden;
}

.lane-horse {
  position: absolute;
  left: 0;
  top: 50%;
  margin-top: -12px;
  will-change: transform;
}

@media (max-width: 899px) {
  .track-lane {
    --lane-label-width: 4rem;
  }

  .lane-label {
    font-size: 0.72rem;
    padding: 0.3rem 0.25rem;
  }

  .lane-track {
    margin-left: 0.35rem;
  }
}
</style>
