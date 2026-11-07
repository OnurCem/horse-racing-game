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
      <aside class="app-sidebar">
        <SchedulePanel
          :schedule="schedule"
          :roster="roster"
          :active-round-index="activeRoundIndex"
          :status="status"
          :results="results"
        />
        <RosterPanel :roster="roster" />
      </aside>
      <div class="app-main">
        <RaceControls
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
          :status="status"
          :active-round="activeRound"
          :roster="roster"
          :frame-progress="frameProgress"
          :reduced-motion="prefersReducedMotion"
        />
        <ResultsPanel :results="results" :roster="roster" />
      </div>
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
  grid-template-columns: minmax(220px, 280px) 1fr;
  gap: 1.5rem;
  align-items: start;
}

.app-sidebar {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.app-main {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  min-width: 0;
}
</style>
