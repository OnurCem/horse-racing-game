<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import { NARROW_LAYOUT_QUERY, useMatchMedia } from '../../composables/useMatchMedia'
import { formatRaceTime } from '../../domain/formatRaceTime'
import type { Horse, RoundResult } from '../../domain/types'

const props = defineProps<{
  results: readonly RoundResult[]
  roster: readonly Horse[]
}>()

const isNarrow = useMatchMedia(NARROW_LAYOUT_QUERY)

const openRound = ref<number | null>(null)
const expandedFull = ref<Set<number>>(new Set())
const announceText = ref('')

const horsesById = computed(() => new Map(props.roster.map((h) => [h.id, h])))

const latestOpenGroup = computed(() => {
  if (openRound.value === null) {
    return null
  }
  return props.results.find((r) => r.round === openRound.value) ?? null
})

const mobilePanelTitle = computed(() => {
  if (isNarrow.value && latestOpenGroup.value) {
    const g = latestOpenGroup.value
    return `Results · Round ${g.round} · ${g.distanceMeters.toLocaleString()} m`
  }
  return 'Results'
})

watch(
  () => props.results.length,
  (count, prev = 0) => {
    if (count === 0) {
      // A new game cleared the results.
      openRound.value = null
      expandedFull.value = new Set()
      announceText.value = ''
      return
    }
    if (count <= prev) {
      return
    }

    const latest = props.results[count - 1]!
    openRound.value = latest.round
    const nextExpanded = new Set(expandedFull.value)
    nextExpanded.delete(latest.round)
    expandedFull.value = nextExpanded
    announceText.value = `Round ${latest.round} complete. Results are available.`
  },
  { immediate: true },
)

const toggleRound = (round: number): void => {
  openRound.value = openRound.value === round ? null : round
}

const visibleRows = (group: RoundResult): RoundResult['finishingOrder'] => {
  if (!isNarrow.value || expandedFull.value.has(group.round)) {
    return group.finishingOrder
  }
  return group.finishingOrder.slice(0, 3)
}

const showExpandAll = (group: RoundResult): boolean => {
  return isNarrow.value && !expandedFull.value.has(group.round) && group.finishingOrder.length > 3
}

const expandAll = (round: number): void => {
  expandedFull.value = new Set([...expandedFull.value, round])
}
</script>

<template>
  <section class="results-panel" aria-labelledby="results-heading">
    <h3 id="results-heading" class="panel-heading">{{ mobilePanelTitle }}</h3>
    <p class="visually-hidden" aria-live="polite">{{ announceText }}</p>
    <p v-if="results.length === 0" class="empty-copy">Results appear after each round</p>
    <div v-else class="result-groups">
      <article
        v-for="group in results"
        :key="group.round"
        class="result-group"
        :class="{ 'result-group--open': openRound === group.round }"
      >
        <button
          v-if="!isNarrow || openRound !== group.round"
          type="button"
          class="result-heading"
          :aria-expanded="openRound === group.round"
          @click="toggleRound(group.round)"
        >
          Round {{ group.round }} · {{ group.distanceMeters.toLocaleString() }} m
        </button>
        <div v-if="openRound === group.round" class="result-body">
          <table class="results-table">
            <thead>
              <tr>
                <th scope="col">Position</th>
                <th scope="col" class="col-horse">Horse</th>
                <th scope="col">Name</th>
                <th scope="col" class="col-time">Time</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in visibleRows(group)" :key="row.position">
                <td>{{ row.position }}</td>
                <td class="col-horse">
                  <span
                    v-if="horsesById.get(row.horseId)"
                    class="color-swatch"
                    :style="{ backgroundColor: horsesById.get(row.horseId)!.colorHex }"
                  />
                  #{{ row.horseId }}
                </td>
                <td>{{ horsesById.get(row.horseId)?.name ?? '—' }}</td>
                <td class="col-time">{{ formatRaceTime(row.finishTimeMs) }}</td>
              </tr>
            </tbody>
          </table>
          <button
            v-if="showExpandAll(group)"
            type="button"
            class="show-all-btn"
            @click="expandAll(group.round)"
          >
            Show all 10
          </button>
        </div>
      </article>
    </div>
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

.result-groups {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.result-heading {
  width: 100%;
  text-align: left;
  padding: 0.5rem 0.65rem;
  border: 1px solid rgba(27, 42, 74, 0.12);
  border-radius: 6px;
  background: #fff;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.result-heading:focus-visible,
.show-all-btn:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.result-group--open .result-heading {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}

.results-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
  border: 1px solid rgba(27, 42, 74, 0.12);
  border-radius: 6px;
  background: #fff;
  overflow: hidden;
}

.result-group--open:not(:has(.result-heading)) .results-table {
  border-radius: 6px;
}

.results-table th,
.results-table td {
  padding: 0.35rem 0.5rem;
  text-align: left;
  border-bottom: 1px solid rgba(27, 42, 74, 0.08);
}

@media (max-width: 899px) {
  /* min-height does not apply to table cells; height acts as a minimum row height. */
  .results-table th,
  .results-table td {
    box-sizing: border-box;
    height: 44px;
  }
}

/* Keep the swatch beside the number now that the Time column takes width. */
.results-table .col-horse {
  white-space: nowrap;
}

@media (max-width: 359px) {
  .results-table th,
  .results-table td {
    padding-inline: 0.3rem;
  }
}

.results-table .col-time {
  text-align: right;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.results-table th {
  background: rgba(31, 95, 224, 0.08);
  font-weight: 650;
}

.color-swatch {
  display: inline-block;
  width: 0.85rem;
  height: 0.85rem;
  border-radius: 50%;
  margin-right: 0.25rem;
  vertical-align: middle;
  border: 1px solid rgba(27, 42, 74, 0.25);
}

.show-all-btn {
  display: block;
  width: 100%;
  margin-top: 0.5rem;
  min-height: 44px;
  padding: 0.5rem 1rem;
  border: 2px solid rgba(31, 95, 224, 0.45);
  border-radius: 6px;
  background: #fff;
  font: inherit;
  font-weight: 600;
  color: var(--accent);
  cursor: pointer;
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
