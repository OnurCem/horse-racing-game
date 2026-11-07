<script setup lang="ts">
import RaceControls from '../controls/RaceControls.vue'
import ResultsPanel from '../results/ResultsPanel.vue'
import RosterPanel from '../roster/RosterPanel.vue'
import SchedulePanel from '../schedule/SchedulePanel.vue'
import RaceTrack from '../track/RaceTrack.vue'
import { useGameStore } from '../../stores/game'
import { storeToRefs } from 'pinia'
import { useRaceRunner } from '../../composables/useRaceRunner'
import { useReducedMotion } from '../../composables/useReducedMotion'

const store = useGameStore()
const { roster, schedule, status, activeRound, activeRoundIndex, results } = storeToRefs(store)

const { frameProgress } = useRaceRunner()
const prefersReducedMotion = useReducedMotion()
</script>

<template>
  <div class="app-shell">
    <h1 class="app-title">Horse Racing</h1>
    <div class="app-grid">
      <SchedulePanel
        class="area-schedule"
        :schedule="schedule"
        :roster="roster"
        :active-round-index="activeRoundIndex"
        :status="status"
        :results="results"
      />
      <RosterPanel class="area-roster" :roster="roster" />
      <RaceControls
        class="area-controls"
        :status="status"
        :active-round="activeRound"
        :schedule-length="schedule.length"
        :active-round-index="activeRoundIndex"
        @generate="store.generateSchedule()"
        @start="store.start()"
        @pause="store.pause()"
        @resume="store.resume()"
      />
      <RaceTrack
        class="area-track"
        :status="status"
        :active-round="activeRound"
        :roster="roster"
        :frame-progress="frameProgress"
        :reduced-motion="prefersReducedMotion"
      />
      <ResultsPanel class="area-results" :results="results" :roster="roster" />
    </div>
  </div>
</template>

<style scoped>
.app-shell {
  width: min(1100px, 100%);
}

.app-title {
  margin: 0 0 1.25rem;
  font-size: clamp(1.75rem, 4vw, 2.25rem);
  font-weight: 650;
  letter-spacing: -0.02em;
  text-align: left;
  border-bottom: 3px solid var(--accent);
  padding-bottom: 0.35rem;
}

.app-grid {
  display: grid;
  /* 340px fits the roster table (about 320px of content plus a classic
     scrollbar) without wrapping names or scrolling sideways. */
  grid-template-columns: 340px minmax(0, 1fr);
  grid-template-rows: auto auto 1fr;
  grid-template-areas:
    'schedule controls'
    'schedule track'
    'roster results';
  column-gap: 1.5rem;
  row-gap: 1.25rem;
  align-items: start;
}

.area-schedule {
  grid-area: schedule;
}

.area-roster {
  grid-area: roster;
}

.area-controls {
  grid-area: controls;
}

.area-track {
  grid-area: track;
}

.area-results {
  grid-area: results;
}

@media (max-width: 899px) {
  .app-title {
    margin-bottom: 0.85rem;
  }

  .app-grid {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .area-controls {
    order: 1;
  }

  .area-track {
    order: 2;
  }

  .area-results {
    order: 3;
  }

  .area-schedule {
    order: 4;
  }

  .area-roster {
    order: 5;
  }
}
</style>
