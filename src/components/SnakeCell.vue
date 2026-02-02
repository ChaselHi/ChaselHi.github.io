<template>
  <div
    class="snake-cell"
    :class="{
      'snake-head': isHead,
      'snake-body': isBody,
      'snake-food': isFood
    }"
  >
    <span v-if="isHead">🟢</span>
    <span v-else-if="isBody">🟩</span>
    <span v-else-if="isFood">🍎</span>
  </div>
</template>

<script setup lang="ts">
interface Props {
  isHead?: boolean;
  isBody?: boolean;
  isFood?: boolean;
}

defineProps<Props>();
</script>

<style scoped>
.snake-cell {
  width: 24px;
  height: 24px;
  display: grid;
  place-items: center;
  background: var(--cell);
  border-radius: 4px;
  user-select: none;
  transition: background-color 0.1s ease;
}

.snake-cell.snake-head {
  background: #22c55e; /* Green accent */
  border-radius: 6px;
  font-size: 16px;
}

.snake-cell.snake-body {
  background: #16a34a; /* Darker green */
  border-radius: 5px;
  font-size: 14px;
}

.snake-cell.snake-food {
  background: #ef4444; /* Red for food */
  border-radius: 50%;
  font-size: 16px;
  animation: pulse 1s infinite alternate;
}

@keyframes pulse {
  from { transform: scale(1); }
  to { transform: scale(1.2); }
}
</style>