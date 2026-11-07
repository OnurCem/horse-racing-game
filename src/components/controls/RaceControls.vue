<script setup lang="ts">
import { computed } from 'vue'

import type { GameStatus, ScheduledRound } from '../../domain/types'

const props = defineProps<{
  status: GameStatus
  activeRound: ScheduledRound | null
  scheduleLength: number
  activeRoundIndex: number
}>()

const emit = defineEmits<{
  generate: []
  start: []
  pause: []
  resume: []
}>()

const heading = computed(() => {
  if (props.status === 'complete') {
    return 'Race complete'
  }
  if (!props.activeRound || props.scheduleLength === 0) {
    return 'Horse Racing'
  }
  const index = props.activeRoundIndex + 1
  const distance = props.activeRound.distanceMeters.toLocaleString()
  let text = `Round ${index} of ${props.scheduleLength} · ${distance} m`
  if (props.status === 'paused') {
    text += ' · Paused'
  }
  return text
})

const canGenerate = computed(() => props.status !== 'running')

const primaryLabel = computed(() => {
  if (props.status === 'paused') {
    return 'Resume'
  }
  if (props.status === 'running') {
    return 'Pause'
  }
  return 'Start'
})

const primaryDisabled = computed(() => {
  if (props.status === 'ready') {
    return false
  }
  if (props.status === 'running' || props.status === 'paused') {
    return false
  }
  return true
})

const onPrimary = (): void => {
  if (props.status === 'paused') {
    emit('resume')
  } else if (props.status === 'running') {
    emit('pause')
  } else if (props.status === 'ready') {
    emit('start')
  }
}
</script>

<template>
  <header class="race-controls">
    <div class="race-controls-row">
      <h2 class="race-heading">{{ heading }}</h2>
      <div class="race-actions">
        <button
          type="button"
          class="btn btn-secondary"
          :disabled="!canGenerate"
          @click="emit('generate')"
        >
          Generate
        </button>
        <button
          type="button"
          class="btn btn-primary"
          :disabled="primaryDisabled"
          @click="onPrimary"
        >
          {{ primaryLabel }}
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.race-controls {
  container-type: inline-size;
}

.race-controls-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

/* When the longest heading ("Round 6 of 6 · 2,200 m · Paused") and the buttons
   can't share a row, always put the heading on its own row. Wrapping only when
   the text gets long would change the header's height between states and shift
   the track. */
@container (max-width: 34rem) {
  .race-controls-row {
    flex-wrap: wrap;
  }

  .race-heading {
    flex-basis: 100%;
  }
}

.race-heading {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 650;
  letter-spacing: -0.01em;
}

.race-actions {
  display: flex;
  gap: 0.5rem;
}

.btn {
  min-height: 2.75rem;
  min-width: 6.5rem;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  border: 2px solid transparent;
}

.btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--accent);
  color: #fff;
}

.btn-primary:focus-visible,
.btn-secondary:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.btn-secondary {
  background: #fff;
  color: var(--text);
  border-color: rgba(27, 42, 74, 0.25);
}
</style>
