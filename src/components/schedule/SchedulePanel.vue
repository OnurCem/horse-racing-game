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
.panel-heading {
  margin: 0 0 0.5rem;
  font-size: 1rem;
  font-weight: 650;
}
</style>
