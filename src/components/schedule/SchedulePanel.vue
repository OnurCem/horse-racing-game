<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import CollapsibleSection from '../layout/CollapsibleSection.vue'
import ScheduleList from './ScheduleList.vue'
import { NARROW_LAYOUT_QUERY, useMatchMedia } from '../../composables/useMatchMedia'
import type { GameStatus, Horse, RoundResult, ScheduledRound } from '../../domain/types'

const props = defineProps<{
  schedule: readonly ScheduledRound[]
  roster: readonly Horse[]
  activeRoundIndex: number
  status: GameStatus
  results: readonly Pick<RoundResult, 'round'>[]
}>()

const isNarrow = useMatchMedia(NARROW_LAYOUT_QUERY)

const panelExpanded = ref(true)
const expandedRound = ref<number | null>(null)

watch(
  isNarrow,
  (narrow) => {
    panelExpanded.value = !narrow
  },
  { immediate: true },
)

/** Round number of the highlighted row (next up or running), or null when there is none. */
const activeRound = computed(() => {
  if (props.status !== 'ready' && props.status !== 'running' && props.status !== 'paused') {
    return null
  }
  return props.schedule[props.activeRoundIndex]?.round ?? null
})

// Open the active round's entrants whenever a new round becomes active (including
// after regenerating). Users can still collapse it or open another row by hand.
watch(
  [() => props.schedule, activeRound],
  ([, round]) => {
    if (round !== null) {
      expandedRound.value = round
    }
  },
  { immediate: true },
)

const collapsibleHeading = computed(() =>
  props.schedule.length === 0 ? 'Schedule' : `Schedule · ${props.schedule.length} rounds`,
)
</script>

<template>
  <section
    class="schedule-panel"
    :class="{ 'schedule-panel--flat': !isNarrow }"
    aria-labelledby="schedule-heading"
  >
    <CollapsibleSection
      v-if="isNarrow"
      panel-id="schedule"
      :heading="collapsibleHeading"
      :expanded="panelExpanded"
      @toggle="panelExpanded = !panelExpanded"
    >
      <ScheduleList v-model:expanded-round="expandedRound" v-bind="props" />
    </CollapsibleSection>
    <template v-else>
      <h3 id="schedule-heading" class="panel-heading">Schedule</h3>
      <ScheduleList v-model:expanded-round="expandedRound" v-bind="props" />
    </template>
  </section>
</template>

<style scoped>
/* Same row height as the race controls header (2.75rem buttons) so this
   heading lines up with the race heading in the next column. */
.panel-heading {
  display: flex;
  align-items: center;
  min-height: 2.75rem;
  margin: 0 0 0.5rem;
  font-size: 1rem;
  font-weight: 650;
}
</style>
