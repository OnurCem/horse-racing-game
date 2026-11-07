<script setup lang="ts">
import { HORSE_SILHOUETTE_PATH } from './horseSilhouettePath'

defineProps<{
  colorHex: string
}>()

const outline = '#1b2a4a'
</script>

<template>
  <svg
    class="horse-silhouette"
    viewBox="0 0 219.175 219.175"
    width="32"
    height="22"
    aria-hidden="true"
    focusable="false"
  >
    <path
      :d="HORSE_SILHOUETTE_PATH"
      :fill="colorHex"
      :stroke="outline"
      stroke-width="2.2"
      stroke-linejoin="round"
      stroke-linecap="round"
    />
  </svg>
</template>

<style scoped>
.horse-silhouette {
  display: block;
}
</style>
