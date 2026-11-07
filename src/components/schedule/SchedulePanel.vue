<script setup lang="ts">
import { computed, ref } from 'vue'

import type { Horse, ScheduledRound } from '../../domain/types'

const props = defineProps<{
  schedule: readonly ScheduledRound[]
  roster: readonly Horse[]
  activeRoundIndex: number
  status: string
  results: readonly { round: number }[]
}>()

const expandedRound = ref<number | null>(null)

const horsesById = computed(() => new Map(props.roster.map((h) => [h.id, h])))

const resolveHorse = (id: number): Horse | undefined => horsesById.value.get(id)

const rowState = (
  index: number,
  round: number,
): 'upcoming' | 'next' | 'current' | 'completed' => {
  if (props.results.some((r) => r.round === round)) {
    return 'completed'
  }
  if (
    (props.status === 'running' || props.status === 'paused') &&
    index === props.activeRoundIndex
  ) {
    return 'current'
  }
  if (props.status === 'ready' && index === props.activeRoundIndex) {
    return 'next'
  }
  return 'upcoming'
}

const toggleRound = (round: number): void => {
  expandedRound.value = expandedRound.value === round ? null : round
}
</script>

<template>
  <section class="schedule-panel" aria-labelledby="schedule-heading">
    <h3 id="schedule-heading" class="panel-heading">Schedule</h3>
    <p v-if="schedule.length === 0" class="empty-copy">No schedule yet</p>
    <ul v-else class="schedule-list">
      <li
        v-for="(item, index) in schedule"
        :key="item.round"
        class="schedule-row"
        :class="`schedule-row--${rowState(index, item.round)}`"
      >
        <button type="button" class="schedule-summary" @click="toggleRound(item.round)">
          <span class="schedule-marker" aria-hidden="true">
            <template v-if="rowState(index, item.round) === 'completed'">✓</template>
            <template v-else-if="rowState(index, item.round) === 'current'">●</template>
            <template v-else-if="rowState(index, item.round) === 'next'">→</template>
          </span>
          <span>
            Round {{ item.round }} · {{ item.distanceMeters.toLocaleString() }} m
          </span>
          <span
            v-if="rowState(index, item.round) === 'current'"
            class="visually-hidden"
          >
            now running
          </span>
        </button>
        <ul v-if="expandedRound === item.round" class="entrant-list">
          <li v-for="entry in item.entries" :key="entry.lane">
            Lane {{ entry.lane }} · #{{ entry.horseId }}
            <template v-if="resolveHorse(entry.horseId)">
              · {{ resolveHorse(entry.horseId)!.name }}
            </template>
          </li>
        </ul>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.panel-heading {
  margin: 0 0 0.5rem;
  font-size: 1rem;
  font-weight: 650;
}

.empty-copy {
  margin: 0;
  font-size: 0.9rem;
  color: rgba(27, 42, 74, 0.7);
}

.schedule-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.schedule-row {
  border-radius: 6px;
  margin-bottom: 0.25rem;
}

.schedule-row--current,
.schedule-row--next {
  background: rgba(31, 95, 224, 0.12);
}

.schedule-summary {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.5rem;
  border: none;
  background: transparent;
  text-align: left;
  font: inherit;
  cursor: pointer;
  border-radius: 6px;
}

.schedule-summary:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 1px;
}

.schedule-marker {
  width: 1.25rem;
  text-align: center;
  font-weight: 700;
}

.entrant-list {
  list-style: none;
  margin: 0;
  padding: 0 0.5rem 0.5rem 2rem;
  font-size: 0.85rem;
  color: rgba(27, 42, 74, 0.85);
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
