<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import type { Horse, RoundResult } from '../../domain/types'

const props = defineProps<{
  results: readonly RoundResult[]
  roster: readonly Horse[]
}>()

const openRound = ref<number | null>(null)

const horsesById = computed(() => new Map(props.roster.map((h) => [h.id, h])))

watch(
  () => props.results.length,
  (count, prev = 0) => {
    if (count > prev && count > 0) {
      const latest = props.results[count - 1]
      openRound.value = latest?.round ?? null
    }
  },
  { immediate: true },
)

const toggleRound = (round: number): void => {
  openRound.value = openRound.value === round ? null : round
}
</script>

<template>
  <section class="results-panel" aria-labelledby="results-heading" aria-live="polite">
    <h3 id="results-heading" class="panel-heading">Results</h3>
    <p v-if="results.length === 0" class="empty-copy">Results appear after each round</p>
    <div v-else class="result-groups">
      <article
        v-for="group in results"
        :key="group.round"
        class="result-group"
        :class="{ 'result-group--open': openRound === group.round }"
      >
        <button type="button" class="result-heading" @click="toggleRound(group.round)">
          Round {{ group.round }} · {{ group.distanceMeters.toLocaleString() }} m
        </button>
        <table v-if="openRound === group.round" class="results-table">
          <thead>
            <tr>
              <th scope="col">Position</th>
              <th scope="col">Horse</th>
              <th scope="col">Name</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in group.finishingOrder" :key="row.position">
              <td>{{ row.position }}</td>
              <td>
                <span
                  v-if="horsesById.get(row.horseId)"
                  class="color-swatch"
                  :style="{ backgroundColor: horsesById.get(row.horseId)!.colorHex }"
                />
                #{{ row.horseId }}
              </td>
              <td>{{ horsesById.get(row.horseId)?.name ?? '—' }}</td>
            </tr>
          </tbody>
        </table>
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

.result-heading:focus-visible {
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
  border-top: none;
  border-radius: 0 0 6px 6px;
  background: #fff;
}

.results-table th,
.results-table td {
  padding: 0.35rem 0.5rem;
  text-align: left;
  border-bottom: 1px solid rgba(27, 42, 74, 0.08);
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
</style>
