<script setup lang="ts">
defineProps<{
  heading: string
  expanded: boolean
  panelId: string
}>()

const emit = defineEmits<{
  toggle: []
}>()
</script>

<template>
  <section class="collapsible" :aria-labelledby="`${panelId}-heading`">
    <h3 :id="`${panelId}-heading`" class="visually-hidden">{{ heading }}</h3>
    <button
      type="button"
      class="collapsible-trigger"
      :aria-expanded="expanded"
      :aria-controls="`${panelId}-body`"
      @click="emit('toggle')"
    >
      <span class="collapsible-title">{{ heading }}</span>
      <span class="collapsible-chevron" aria-hidden="true">{{ expanded ? '▴' : '▾' }}</span>
    </button>
    <div
      v-show="expanded"
      :id="`${panelId}-body`"
      class="collapsible-body"
    >
      <slot />
    </div>
  </section>
</template>

<style scoped>
.collapsible {
  border: 1px solid rgba(27, 42, 74, 0.12);
  border-radius: 8px;
  background: #fff;
}

.collapsible-trigger {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.65rem 0.85rem;
  border: none;
  background: transparent;
  font: inherit;
  font-size: 1rem;
  font-weight: 650;
  color: var(--text);
  cursor: pointer;
  border-radius: 8px;
  text-align: left;
}

.collapsible-trigger:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.collapsible-chevron {
  font-size: 0.85rem;
  color: rgba(27, 42, 74, 0.65);
}

.collapsible-body {
  padding: 0 0.85rem 0.85rem;
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
