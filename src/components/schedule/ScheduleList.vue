<script setup lang="ts">
import { computed } from 'vue'

import type { GameStatus, Horse, RoundResult, ScheduledRound } from '../../domain/types'

type RowState = 'upcoming' | 'next' | 'current' | 'completed'

const props = defineProps<{
  schedule: readonly ScheduledRound[]
  roster: readonly Horse[]
  activeRoundIndex: number
  status: GameStatus
  results: readonly Pick<RoundResult, 'round'>[]
}>()

/** Round number whose entrants are shown; owned by the parent so it survives layout changes. */
const expandedRound = defineModel<number | null>('expandedRound', { default: null })

const horsesById = computed(() => new Map(props.roster.map((h) => [h.id, h])))

const completedRounds = computed(() => new Set(props.results.map((r) => r.round)))

function rowStateFor(index: number, round: number): RowState {
  if (completedRounds.value.has(round)) {
    return 'completed'
  }
  if (index !== props.activeRoundIndex) {
    return 'upcoming'
  }
  if (props.status === 'running' || props.status === 'paused') {
    return 'current'
  }
  return props.status === 'ready' ? 'next' : 'upcoming'
}

const rows = computed(() =>
  props.schedule.map((item, index) => ({
    item,
    state: rowStateFor(index, item.round),
    entrantsId: `schedule-round-${item.round}-entrants`,
    entrants: item.entries.map((entry) => ({
      ...entry,
      name: horsesById.value.get(entry.horseId)?.name ?? null,
    })),
  })),
)

const toggleRound = (round: number): void => {
  expandedRound.value = expandedRound.value === round ? null : round
}
</script>

<template>
  <p v-if="schedule.length === 0" class="empty-copy">No schedule yet</p>
  <ul v-else class="schedule-list">
    <li
      v-for="row in rows"
      :key="row.item.round"
      class="schedule-row"
      :class="`schedule-row--${row.state}`"
    >
      <button
        type="button"
        class="schedule-summary"
        :aria-expanded="expandedRound === row.item.round"
        :aria-controls="row.entrantsId"
        @click="toggleRound(row.item.round)"
      >
        <span class="schedule-marker" aria-hidden="true">
          <template v-if="row.state === 'completed'">✓</template>
          <template v-else-if="row.state === 'current'">●</template>
        </span>
        <span>
          Round {{ row.item.round }} · {{ row.item.distanceMeters.toLocaleString() }} m
        </span>
        <span v-if="row.state === 'current'" class="visually-hidden">now running</span>
      </button>
      <ul v-if="expandedRound === row.item.round" :id="row.entrantsId" class="entrant-list">
        <li v-for="entry in row.entrants" :key="entry.lane">
          Lane {{ entry.lane }} · #{{ entry.horseId }}
          <template v-if="entry.name">· {{ entry.name }}</template>
        </li>
      </ul>
    </li>
  </ul>
</template>

<style scoped>
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
