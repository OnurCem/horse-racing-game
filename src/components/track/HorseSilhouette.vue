<script setup lang="ts">
defineProps<{
  colorHex: string
}>()
</script>

<template>
  <svg
    class="horse-silhouette"
    viewBox="0 0 32 22"
    width="32"
    height="22"
    aria-hidden="true"
    focusable="false"
  >
    <path
      d="M4 14c2-6 6-9 11-9 2 0 4 .5 5 1.5l2-3c.5-.8 1.5-1 2.3-.5.5.3.8.9.7 1.5l-.8 4.5c1.2.8 2.1 2 2.4 3.5.4 2 .2 4.5-1 6.5-.3.4-.8.6-1.3.5h-1.5c-.6 0-1-.4-1.2-1l-.5-2.2c-2.3.5-4.6.3-6.8-.6-1.2-.5-2.1-1.3-2.8-2.2-.4-.5-.3-1.2.2-1.6.6-.5 1.4-.4 1.9.1.8.8 1.8 1.4 3 1.8.5.2 1 .3 1.5.3-1.2-2.8-.5-5.5 1.2-7.2-2.5.3-4.5 1.5-5.8 3.5-.5.7-1.5.9-2.2.4-.4-.3-.6-.8-.5-1.3Z"
      :fill="colorHex"
      stroke="#1b2a4a"
      stroke-width="0.6"
    />
  </svg>
</template>

<style scoped>
.horse-silhouette {
  display: block;
}
</style>
