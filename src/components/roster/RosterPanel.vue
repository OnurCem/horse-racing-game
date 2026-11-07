<script setup lang="ts">
import type { Horse } from '../../domain/types'

defineProps<{
  roster: readonly Horse[]
}>()
</script>

<template>
  <section class="roster-panel" aria-labelledby="roster-heading">
    <h3 id="roster-heading" class="panel-heading">Horse roster · {{ roster.length }}</h3>
    <div class="roster-scroll">
      <table class="roster-table">
        <thead>
          <tr>
            <th scope="col">No.</th>
            <th scope="col">Name</th>
            <th scope="col">Color</th>
            <th scope="col">Condition</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="horse in roster" :key="horse.id">
            <td>{{ horse.id }}</td>
            <td>{{ horse.name }}</td>
            <td>
              <span class="color-cell">
                <span
                  class="color-swatch"
                  :style="{ backgroundColor: horse.colorHex }"
                  :title="horse.colorName"
                />
                {{ horse.colorName }}
              </span>
            </td>
            <td>{{ horse.condition }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style scoped>
.panel-heading {
  margin: 0 0 0.5rem;
  font-size: 1rem;
  font-weight: 650;
}

.roster-scroll {
  max-height: 22rem;
  overflow-y: auto;
  border: 1px solid rgba(27, 42, 74, 0.12);
  border-radius: 6px;
  background: #fff;
}

.roster-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.roster-table th,
.roster-table td {
  padding: 0.35rem 0.5rem;
  text-align: left;
  border-bottom: 1px solid rgba(27, 42, 74, 0.08);
}

.roster-table th {
  position: sticky;
  top: 0;
  background: #f0ebe3;
  font-weight: 650;
}

.color-cell {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.color-swatch {
  width: 0.85rem;
  height: 0.85rem;
  border-radius: 50%;
  border: 1px solid rgba(27, 42, 74, 0.25);
  flex-shrink: 0;
}
</style>
