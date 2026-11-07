<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import CollapsibleSection from '../layout/CollapsibleSection.vue'
import RosterTable from './RosterTable.vue'
import { useMatchMedia } from '../../composables/useMatchMedia'
import type { Horse } from '../../domain/types'

const props = defineProps<{
  roster: readonly Horse[]
}>()

const isNarrow = useMatchMedia('(max-width: 899px)')

const rosterExpanded = ref(true)

watch(
  isNarrow,
  (narrow) => {
    rosterExpanded.value = !narrow
  },
  { immediate: true },
)

const collapsibleHeading = computed(() => `Horse roster · ${props.roster.length}`)

const showCollapsibleChrome = computed(() => isNarrow.value)
</script>

<template>
  <section
    class="roster-panel"
    :class="{ 'roster-panel--flat': !showCollapsibleChrome }"
    aria-labelledby="roster-heading"
  >
    <CollapsibleSection
      v-if="showCollapsibleChrome"
      panel-id="roster"
      :heading="collapsibleHeading"
      :expanded="rosterExpanded"
      @toggle="rosterExpanded = !rosterExpanded"
    >
      <RosterTable :roster="roster" />
    </CollapsibleSection>
    <template v-else>
      <div class="roster-desktop-header">
        <h3 id="roster-heading" class="panel-heading">{{ collapsibleHeading }}</h3>
        <button
          type="button"
          class="roster-toggle"
          :aria-expanded="rosterExpanded"
          aria-controls="roster-table-body"
          @click="rosterExpanded = !rosterExpanded"
        >
          {{ rosterExpanded ? 'Hide roster' : 'Show roster' }}
        </button>
      </div>
      <RosterTable
        v-show="rosterExpanded"
        id="roster-table-body"
        :roster="roster"
      />
    </template>
  </section>
</template>

<style scoped>
.roster-panel--flat .panel-heading {
  margin: 0;
  font-size: 1rem;
  font-weight: 650;
}

.roster-desktop-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.roster-toggle {
  padding: 0.25rem 0.5rem;
  border: 1px solid rgba(27, 42, 74, 0.2);
  border-radius: 6px;
  background: #fff;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text);
  cursor: pointer;
}

.roster-toggle:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
</style>
